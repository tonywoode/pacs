"use strict"
const webdav = require("webdav-server").v2
const app = require("express")()
const request = require("request")
const proxy = require("http-proxy-middleware")
const path = require("path")
const http = require("http")
const fs = require("fs")
const server = new webdav.WebDAVServer()
const { promisify } = require("util")
const mkdirp = require("mkdirp-promise")
const { dirname } = require("path")
const config = require("../config.json")
const util = require("util")

//tee output to console and to a logfile https://stackoverflow.com/a/30578473/3536094
const logFile = "./pacs_logfile.txt"
const logStream = fs.createWriteStream(logFile)

console.log = (...args) => {
  const text = util.format.apply(this, args) + "\n"
  logStream.write(text)
  process.stdout.write(text)
}

console.error = (...args) => {
  const text = util.format.apply(this, args) + "\n"
  logStream.write(text)
  process.stderr.write(text)
}

// we must enable persistent connections in node, as underlying this all is the
// http lib's default of http 1.0-like new connections for each request
// https://stackoverflow.com/a/38614839/3536094
const keepAliveAgent = new http.Agent({ keepAlive: true })
const testConnection = require("./testConnection")(config)

const webdavClient = require("webdav")
const client = require("./client")(webdavClient)(config)(keepAliveAgent)
const mkdirpsync = require("mkdirpsync")

//standard basic auth conversion
const { user, pass } = config
const data = `${user}:${pass}`
const base64data = Buffer.from(data).toString("base64")
const headerAuth = `Basic ${base64data}`

const ip = config[config.whichIp]
const localFolder = config[config.localFolder]

const printJson = json => JSON.stringify(json, null, 2)

const proxyOptions = {
  auth: `${config.user}:${config.pass}`,
  target: `${ip}:${config.port}`,
  agent: keepAliveAgent,
  logLevel: "debug",
  onProxyRes: (proxyRes, req, res) => {
    console.log(`
*********
 ${(req.method, decodeURIComponent(req.path))}
 req header: ${printJson(req.headers)}
 req method: ${req.method}
 req params: ${printJson(req.params)}
 req body: ${req.body}

 *********

 proxyRes header: ${printJson(proxyRes.headers)}
 proxyRes method: ${proxyRes.method}
 proxyRes params: ${printJson(proxyRes.params)}
 proxyRes body: ${proxyRes.body}

 *********

 res header: ${printJson(res.headers)}
 res method: ${res.method}
 res params: ${printJson(res.params)}
 res body: ${res.body}
 `)
      const decoded = decodeURIComponent(req.path)
      const pathToAsset = path.join(localFolder, decoded)
    if (req.method === "GET") {
      const assetsFolder = path.join(localFolder, dirname(decoded))
      console.log(`make path for get: ${assetsFolder}`)
      fs.existsSync(assetsFolder) || mkdirpsync(assetsFolder)
    }
    //what methods can i call on proxyres then?   console.log("methods are " + console.log(Object.keys(proxyRes)))
    proxyRes.on("data", function(chunk) {
      const contentType = proxyRes.headers["content-type"]
      if (
        contentType.includes(`xml`) ||
        contentType.includes(`text`) ||
        contentType.includes(`json`)
      ) {
        console.log(chunk.toString())
      } else if (req.method === "GET") {
        //const decoded = decodeURIComponent(req.path)
        //const pathToAsset = localFolder + decoded
        //     const assetsFolder = localFolder + dirname(decoded)

        console.log("GET HAPPENING IN PROXYRES FOR " + decoded)
        //req.pipe(request(newurl)).pipe(res)
        //      return client.createReadStream(decoded).pipe(fs.createWriteStream(pathToAsset))//.pipe(res))//that was a bad idea!
        //proxyRes.pipe(fs.createWriteStream(pathToAsset))
        //TODO: doing this aync consistently corrupts the 7z header of files larger than about 15 meg
        fs.appendFileSync(pathToAsset, chunk) //, function (err) { if(err) throw err; });
      }
    })
  }
}

testConnection(client).then(result => {
  console.log("result is " + result)
  if (result === false) {
    server.setFileSystem(
      "",
      new webdav.PhysicalFileSystem(localFolder),
      console.log("ready")
    )
    app.use(webdav.extensions.express("", server))
  } else {
    //after a while coping with connection reuse issues piping request, this option reuses connections correctly, at least with netdrive....
    //https://stackoverflow.com/questions/10435407/proxy-with-express-js/16924410
    var myProxy = proxy("/", proxyOptions)
    app.use(myProxy)
  }
})

//app.use((req, res, next) => {
//  console.log("%s %s", req.method, decodeURIComponent(req.path))
//  //  console.log("req header: " + JSON.stringify(req.headers, null, 2))
//  //console.log("req params: " + JSON.stringify(req.params, null, 2))
//  //console.log("req body: " + req.body)
//  next()
//})

//ignore mame assets for now
//app.propfind("/Games/MAME", (req, res, next) => res.status(204).send())

//app.get("*", (req, res, next) => {
//  const decoded = decodeURIComponent(req.path)
//  const pathToAsset = localFolder + decoded
//  const assetsFolder = localFolder + dirname(decoded)
//  if (req.path.includes(".DS_Store")) {
//    console.log("trying to ignore ds store file")
//    return next()
//  }
//  next()
//  console.log(
//    `going to copy file from ${ip}:${config.port}${req.path} to ${pathToAsset}`
//  )
//  //client.copyFile(`${ip}:${config.port}${req.path}`, req.headers.Destination = `${localFolder}${req.path}`).then(next()).catch(err => console.log(err))
//  client
//    .stat(decoded)
//    .then(stat => {
//      console.log(
//        `its a ${
//          stat.type
//        } so, presuming thats a file,i might mkdirp ${assetsFolder}`
//      )
//      console.log("is it a file?" + (stat.type === "file"))
//      return (
//        stat.type === "file"// && mkdirp(assetsFolder) //and what if you actually go want to GET a dir?
//        // fs.promises.access(localFolder + require('path').dirname(decoded), fs.constants.R_OK)
//        // .then( _ =>  mkdirp(localFolder + require('path').dirname(decoded)) )//and what if you actually go want to GET a dir?
//        //.catch( err => console.log(err))
//      )
//    })
//    .then(_ => fs.promises.access(pathToAsset, fs.constants.W_OK)) //we only want to do this at the start when range = 0-.*
//    .then(_ => {
//      console.log(
//        `${pathToAsset} already exists, the file is local so return that and get outta here`
//      )
//      //fs.createReadStream(pathToAsset).pipe(res)
//    })
//    .catch(_ => {
//      console.log(pathToAsset + " needs copying locally")
//      //      return client.createReadStream(decoded).pipe(fs.createWriteStream(pathToAsset))//.pipe(res))//that was a bad idea!
//    })
//    .then(next())
//    .catch(err => console.log(err))
//})

//app.use((req, res, next) => {
//req.headers.Authorization = headerAuth
//req.headers.connection = "keep-alive"
//console.log(req.headers.Authorization)
//modify the url in any way you want
//    var newurl = `${config.localIp}:${config.port}${req.path}`
//  console.log("newurl is " + newurl)
//  req.pipe(request(newurl)).pipe(res)
//next()
//})

//server.afterRequest((arg, next) => {
//    // Display the method, the URI, the returned status code and the returned message
//    console.log('>>', arg.request.method, arg.requested.uri, '>', arg.response.statusCode, arg.response.statusMessage)
//    console.log(arg.request.url)
//    console.log( arg.request.rawHeaders)
//    console.log(arg.request.headers )
//
//    // If available, display the body of the response
//    console.log(arg.responseBody);
//    next();
//})
//
app.use(function(err, req, res, next) {
  console.error(err)
  res.status(500).send("Something broke!")
  next()
})

app.listen(1900)
