"use strict"
const webdav = require("webdav-server").v2
const express = require("express")
const app = express()
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

const webdavClient = require("webdav")
const client = require("./client")(webdavClient)(config)(keepAliveAgent)
const mkdirpsync = require("mkdirpsync")

const ip = config[config.whichIp]
const localFolder = config[config.localFolder]

const printJson = json => JSON.stringify(json, null, 2)

server.setFileSystem("", new webdav.PhysicalFileSystem(localFolder))
app.use(webdav.extensions.express("", server))

app.use((req, res, next) => {
  console.log("%s %s", req.method, decodeURIComponent(req.path))
  console.log("req header: " + JSON.stringify(req.headers, null, 2))
  console.log("req params: " + JSON.stringify(req.params, null, 2))
  console.log("req body: " + req.body)
  next()
})
app.all("*", (req, res, next) => {
  const decoded = decodeURIComponent(req.path)
  const pathToAsset = path.join(localFolder, decoded)
  console.log("asset you wanted was " + pathToAsset)
})

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

let satisfied = false
let thisTarget = ""
//server.beforeRequest( ( arg, next) => {
//    console.log('>>', arg.request.method, arg.requested.uri, '>', arg.response.statusCode, arg.response.statusMessage)
//    console.log("request uri is " + arg.request.url)
//    console.log("raw headers are " + arg.request.rawHeaders)
//    console.log("request headers are " + printJson(arg.request.headers ))
//    console.log("response headers are " + printJson(arg.response.getHeaders()))
//    console.log("response body is " + arg.responseBody);
//  next()
//})

server.beforeRequest((arg, next) => {
  // Display the method, the URI, the returned status code and the returned message
  console.log(
    ">>",
    arg.request.method,
    arg.requested.uri,
    ">",
    arg.response.statusCode,
    arg.response.statusMessage
  )
  console.log("request uri is " + arg.request.url)
  console.log("raw headers are " + arg.request.rawHeaders)
  console.log("request headers are " + printJson(arg.request.headers))

  // If available, display the body of the response
  console.log("response headers are " + printJson(arg.response.getHeaders()))
  console.log("response body is " + arg.responseBody)

  if (arg.request.method === "GET") {
    satisfied = false
    const decoded = decodeURIComponent(arg.request.path)
    const pathToAsset = path.join(localFolder, decoded)
    const assetsFolder = path.join(localFolder, dirname(decoded))
    console.log("path to asset is " + pathToAsset)
    if (fs.existsSync(pathToAsset)) {
      client
        .stat(decoded)
        .then(result => {
          console.log(result)
         const remoteSize = result.size
          console.log("remote size is " + remoteSize)
          return remoteSize
        })
        .catch(function(err) { throw err })
        .then( remoteSize => {
          const stat = fs.lstatSync(pathToAsset)
          console.log("stat of that existing file is " + printJson(stat))
          console.log("size of that existing file is " + printJson(stat.size))
          satisfied = true
          if ( remoteSize && remoteSize > stat.size) { 
            console.log( "remote file larger " + remoteSize + " vs " + stat.size)
            const outStream = fs.createWriteStream(pathToAsset)
            client.createReadStream(decoded).pipe(outStream)
          } else {
            arg.setCode(200)
            arg.responseBody = fs.readFileSync(pathToAsset)
           arg.exit() 
          }

        })
      // next()
    } else {
      if (thisTarget !== decoded) {
        //only make a folder on the first get for this asset
        const assetsFolder = path.join(localFolder, dirname(decoded))
        console.log(`make path for get: ${assetsFolder}`)
        fs.existsSync(assetsFolder) || mkdirpsync(assetsFolder)
        thisTarget = decoded
      }
      //now find out how large this file is
      let size = ""
      client
        .stat(decoded)
        .then(result => {
          console.log(result)
          size = result.size
          console.log("size is " + size)
        })
        .catch(function(err) {
          throw err
        })
    }
    //next()
  }
})

app.use(function(err, req, res, next) {
  console.error(err)
  res.status(500).send("Something broke!")
  next()
})

app.listen(1900)
