'use strict'
const webdav = require('webdav-server').v2
const app = require('express')()
const server = new webdav.WebDAVServer()
const request = require('request');
const testDir = './specs/testDir'
const config = require("../config.json")
//const testWinDir = "F:/Computer Classics/c64 Games"
const testWinDir = "F:/Nintendo Games/N64 Games/GoodN64_314_GM"
const basicAuth = require('express-basic-auth');
//app.all('/', (req,res, next) => { console.log(req); res.send("hello there"); next() })
//app.propfind('/', (req,res) => { console.log(req); res.send("hello there"); })
const alt = false
app.use( (req, res, next) => { console.log('%s %s', req.method, req.url); next() })
if (alt) {
  server.setFileSystem('', new webdav.PhysicalFileSystem(testDir), console.log("ready"))
  app.use(webdav.extensions.express('', server))
}
else { 
//  app.use(basicAuth({
//   users: { user : "pass"},
//   challenge: true // <--- needed to actually show the login dialog!
//})); 
  app.all('/', function(req,res) {
    const { user, pass } = config
    const data = `${user}:${pass}`
    const buff = new Buffer(data)  
    const base64data = buff.toString('base64')

    req.headers.Authorization = `Basic ${base64data}`
    console.log(req.headers)
    //modify the url in any way you want
    var newurl = `${config.localUrl}:${config.port}/GAMES`
    req.pipe(request(newurl)).pipe(res)
    //  console.log(res)
})
}

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

app.listen(1900)
