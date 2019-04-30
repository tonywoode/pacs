'use strict'
const webdav = require('webdav-server').v2
const app = require('express')()
const request = require('request');
const proxy = require('http-proxy-middleware')
const http = require('http')
const fs = require('fs')
const server = new webdav.WebDAVServer()
const {promisify} = require('util')
const mkdirp = require('mkdirp-promise')

const config = require("../config.json")

//const testWinDir = "F:/Nintendo Games/N64 Games/GoodN64_314_GM"

//app.all('/', (req,res, next) => { console.log(req); res.send("hello there"); next() })
//app.propfind('/', (req,res) => { console.log(req); res.send("hello there"); })

// we must enable persistent connections in node, as underlying this all is the 
// http lib's default of http 1.0-like new connections for each request
// https://stackoverflow.com/a/38614839/3536094
const keepAliveAgent = new http.Agent({ keepAlive: true });
const testConnection = require("./testConnection")(config)

const webdavClient = require("webdav")
const client = require("./client")(webdavClient)(config)(keepAliveAgent)

//standard basic auth conversion
const { user, pass } = config
const data = `${user}:${pass}`
const base64data = Buffer.from(data).toString('base64')
const headerAuth = `Basic ${base64data}`

app.use( (req, res, next) => { console.log('%s %s', req.method, req.url); next() })
testConnection(client).then(result => {
  console.log("result is " + result)
  if (result === false) {
  server.setFileSystem('', new webdav.PhysicalFileSystem(config.localFolder), console.log("ready"))
  app.use(webdav.extensions.express('', server))
}
else { 
  // option1: https://stackoverflow.com/a/16924410/3536094 or rather: https://stackoverflow.com/a/20539239/3536094
  //error handling if the remote server is offline will need fixing though: though http://stackoverflow.com/a/20198377/132208
  //after a while coping with connection reuse issues piping request, this option reuses connections correctly, at least with netdrive....
  //https://stackoverflow.com/questions/10435407/proxy-with-express-js/16924410

    var myProxy = proxy('/', {
      auth : `${config.user}:${config.pass}`,
      target: `${config[config.whichIp]}:${config.port}`,
      agent: keepAliveAgent,
      logLevel: 'debug'
    })
app.use(myProxy)
}
})


 app.get('*', (req,res, next) => {
   const pathey = req.path
   const decoded = decodeURIComponent(req.path)
   if (pathey.includes('.DS_Store')){next()}
   console.log(`going to copy file from ${config[config.whichIp]}:${config.port}${req.path} to ${config.localFolder}${decoded}`)
   //   client.copyFile(`${config[config.whichIp]}:${config.port}${req.path}`, req.headers.Destination = `${config.localFolder}${pathey}`).then(next()).catch(err => console.log(err))
   client.stat(decoded)
     .then( stat => { 
       console.log("its a " + stat.type + " so, presuming thats a file,i'm going to mkdirp " + config.localFolder + require('path').dirname(decoded))
       console.log("is it a file?" + (stat.type === "file"))
       return stat.type === "file" && mkdirp(config.localFolder + require('path').dirname(decoded)) //and what if you actually go want to GET a dir?     
     })
     .then( _ => //client.getFileContents(decoded, { format: "text" }))
       client.createReadStream(decoded)
       .pipe(fs.createWriteStream(`${config.localFolder}${decoded}`))
       //   .then( data => { 
       //console.log( "data is " + data)
       //fs.writeFileSync(`${config.localFolder}${decoded}`, data)
       //})
     )
     .then(next())
     .catch(err => console.log(err))
 })
//  app.all('*', (req,res) => {
  //    //req.headers.Authorization = headerAuth
  //    req.headers.connection = "keep-alive"
  //    //console.log(req.headers.Authorization)
  //      console.log(req.headers)
  //       console.log(req.body)
  //       console.log(req.method)
  //       console.log(req.params)
  //    //console.log("PATH" + req.path)
  //      //modify the url in any way you want
  //    //    var newurl = `${config.localIp}:${config.port}${req.path}`
  //    //  console.log("newurl is " + newurl)
  //    //  req.pipe(request(newurl)).pipe(res)
  //    console.log(res.headers)
  //    console.log(res.method)
  //    console.log(res.params)
  //  })


//server.afterRequest((arg, next) => {
//    // Display the method, the URI, the returned status code and the returned message
//    console.log('>>', arg.request.method, arg.requested.uri, '>', arg.response.statusCode, arg.response.statusMessage);
//    console.log(arg.request.url)
//    console.log( arg.request.rawHeaders)
//    console.log(arg.request.headers )
//
//    // If available, display the body of the response
//    console.log(arg.responseBody);
//    next();
//});
app.use(function (err, req, res, next) {
  console.error(err)
  res.status(500).send('Something broke!')
})
app.listen(1900)
