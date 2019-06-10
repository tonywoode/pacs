"use strict"

/*
 * Possible alt imp: https://www.npmjs.com/package/http-proxy-cache-lf
 *   note not express though...also, whilst maybe not suitable
 *   why isn't app.use(express.static(localFolder)) useful?
 */   

const webdav = require("webdav-server").v2
const express = require("express")
const app = express()
const request = require("request")
const proxy = require("http-proxy-middleware")
const path = require("path")
const http = require("http")
const fs = require("fs")
const server = new webdav.WebDAVServer()
//const server = new webdav.WebDAVServer({
//  port: 1900,
//  https: {
//    key: fs.readFileSync('./certs/key.pem'),
//    cert: fs.readFileSync('./certs/cert.pem')
//  }
//})
const { promisify } = require("util")
const mkdirp = require("mkdirp-promise")
const { dirname } = require("path")
const config = require("../config.json")
const util = require("util")
const mkdirpsync = require("mkdirpsync")
const os = require("os")
// we must enable persistent connections in node, as underlying this all is the
// http lib's default of http 1.0-like new connections for each request
// https://stackoverflow.com/a/38614839/3536094
const keepAliveAgent = new http.Agent({ keepAlive: true })

const testConnection = require("./testConnection")(config)
const webdavClient = require("webdav")
const client = require("./client")(webdavClient)(config)(keepAliveAgent)

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

const ip = config[config.whichIp]
const platform = os.platform()
const localFolder = platform === "win32"? config.localFolderWin : config.localFolderNix
const printJson = json => JSON.stringify(json, null, 2)
//TODO: real imp needs to read the filesize, and if not the same, get it locally
//  whereas this will only work for the first file requested!
let thisTarget = ""


app.use((req, res, next) => {
  console.log("%s %s", req.method, decodeURIComponent(req.path))
  console.log("req header: " + JSON.stringify(req.headers, null, 2))
  console.log("req params: " + JSON.stringify(req.params, null, 2))
  console.log("req body: " + req.body)
  next()
})

// either retrieve the file locally, or make a folder for the file we'll need to get
// this part works well, comment out to see issue with GET below
app.get("*", (req, res, next) => {
  const decoded = decodeURIComponent(req.path)
  const pathToAsset = path.join(localFolder, decoded)
  fs.access(pathToAsset, fs.constants.F_OK, err => {
    if (err) { //remote path doesn't exist locally, make folder to hold it
      if (thisTarget !== decoded) {
        //only make a folder on the first get for this asset
        const assetsFolder = path.join(localFolder, dirname(decoded))
        console.log(`make path for get: ${assetsFolder}`)
        fs.existsSync(assetsFolder) || mkdirpsync(assetsFolder)
        thisTarget = decoded
      }
      next()
    } else {
      //sendFile IS streaming, but also setting content type etc: https://stackoverflow.com/a/37400161/3536094
      res.sendFile(pathToAsset, "", err => {
        if (err) {
          next(err)
        } else {
          if (thisTarget !== decoded) {
            //only tell me on the first get
            console.log(`${decoded} exists locally`)
            console.log("Sending local file:", pathToAsset)
            thisTarget = decoded
          }
        }
      })
    }
  })
})

const proxyOptions = {
  auth: `${config.user}:${config.pass}`,
  target: `${ip}:${config.port}`,
  agent: keepAliveAgent,
  logLevel: "debug",
  onProxyReq: (proxyReq, req, res) => {
      // add custom header to request
    // TODO: though you can see these in the stream, they don't seem to be received / acted upon
       proxyReq.setHeader('cache-control', 'no-cache')
       proxyReq.setHeader('pragma', 'no-cache')
    console.log(proxyReq)
  },
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
    //what methods can i call on proxyres?   console.log("members are " + console.log(Object.keys(proxyRes)))
    if (req.method === "GET"){
      //console.log("path to asset is " + pathToAsset)
      //proxyRes.pipe(fs.createWriteStream(pathToAsset), {'flags': 'a'})
    }
    proxyRes.on("data", function(chunk) {
      const contentType = proxyRes.headers["content-type"]
      if (
        contentType.includes(`xml`) ||
        contentType.includes(`text`) ||
        contentType.includes(`json`)
      ) {
        console.log(chunk.toString())
      }
      if (req.method === "GET") {
        /* Don't try resuming content atm, that's quite difficult when proxying:
         *
         *  if its a get
         *     if the content-range of the proxy response shows /^bytes 0-/, 
         *       or if the reqeust included “cache-control”: "no-cache"
         *         if the file exists in the local store
         *           and its filesize equals that on the server
         *            return that file
         *     else if the filesize is not equal on the local store 
         *      (as long as the file isn’t 0 bytes on the server)
         *        delete and make sure to run this next 
         *          check again if the file exsts, if the file does not exist
         *            and if the folder path doesn’t exist on the source
         *              make the folder path
         *                begin the transfer
         */
        console.log("GET HAPPENING IN PROXYRES FOR " + decoded)
        // TODO: sometimes, a click on a single rom in a romdata results in multiple GETs 
        //   for seemingly every file in a folder, irrespective of WebDAV client.
        // req.pipe(request(newurl)).pipe(res)
        proxyRes.pipe(fs.createWriteStream(pathToAsset))
        //proxyRes.sendFile(pathToAsset)
        // const stream = fs.appendFileSync(pathToAsset, chunk) //, function (err) { if(err) throw err; });
        // stream.on("end", function() {
        // do we  pipe the file as a stream to the client once GET finished? Ideally, but
          // problem is, that's not how some GETs are working, some are (probably incorrectly) live-loading the file from its store,
          // how could we enforce always downloading?!? That's an upstream consideration.
            //fs.createReadStream(pathToAsset).pipe(res)
      }
    })
  }
}

//TODO: check connection is still up on every operation
server.setFileSystem("", new webdav.PhysicalFileSystem(localFolder))

const myProxy = proxy("/", proxyOptions)

testConnection(client).then(result => {
  result ? ( 
    console.log("succeeded connecting to NAS folder"),
    console.log("local folder is " + localFolder),
    //after a while coping with connection reuse issues piping request,
    //  this option reuses connections correctly, at least with netdrive....
    //https://stackoverflow.com/questions/10435407/proxy-with-express-js/16924410
    app.use(myProxy)
  ) : (
    console.log("couldn't connect to NAS, so using local folder"),
    app.use(webdav.extensions.express("", server))
  )
})

//really we should switch imp whenever the connection is down
app.get("/RESETME", (req, res, next) => {
  console.log("Resetting Provider")
  expressResetter.resetRoutes(app)
  app.use(webdav.extensions.express("", server))
  next()
})

//app.propfind("*", (req, res, next) => {
//  const decoded = decodeURIComponent(req.path)
//  const pathToAsset = path.join(localFolder, decoded)
//  if (fs.existsSync(pathToAsset)) {
//  app.use(myProxy)
//  }
//    next()
//})

app.use(function(err, req, res, next) {
  console.error(err)
  res.status(500).send("Something broke!")
  next()
})

app.listen(1900)

//imp before i started using the proxy, so i was using another client to get stats etc

//app.get("*", (req, res, next) => {
//  const decoded = decodeURIComponent(req.path)
//  const pathToAsset = localFolder + decoded
//  const assetsFolder = localFolder + dirname(decoded)
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
//the infamous one-line proxy
//    var newurl = `${config.localIp}:${config.port}${req.path}`
//  console.log("newurl is " + newurl)
//  req.pipe(request(newurl)).pipe(res)


