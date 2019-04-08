'use strict'
const webdav = require('webdav-server').v2
const app = require('express')()
const request = require('request');
const basicAuth = require('express-basic-auth');

const server = new webdav.WebDAVServer()
const config = require("../config.json")

const testDir = './specs/testDir'
//const testWinDir = "F:/Computer Classics/c64 Games"
const testWinDir = "F:/Nintendo Games/N64 Games/GoodN64_314_GM"

//app.all('/', (req,res, next) => { console.log(req); res.send("hello there"); next() })
//app.propfind('/', (req,res) => { console.log(req); res.send("hello there"); })

const alt = false
const { user, pass } = config
const data = `${user}:${pass}`
const base64data = Buffer.from(data).toString('base64')
const headerAuth = `Basic ${base64data}`

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

  //option3
  //const proxy = require('http-proxy-middleware')
  //var apiProxy = proxy('*', {target: 'http://nas.thetrickis.com:5005'});
  //app.use(apiProxy)



  // option1: https://stackoverflow.com/a/16924410/3536094
  //or rather: https://stackoverflow.com/a/20539239/3536094
  //error handling if the remote server is offline will need fixing though: though http://stackoverflow.com/a/20198377/132208
 

  app.all('*', (req,res) => {
      req.headers.Authorization = headerAuth
    //     console.log(req.headers)
    //   console.log(req.body)
    //   console.log(req.method)
    //   console.log(req.params)
    //console.log("PATH" + req.path)
      //modify the url in any way you want
    var newurl = `${config.localIp}:${config.port}${req.path}`
    //  console.log("newurl is " + newurl)
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
