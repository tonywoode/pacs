'use strict'
const webdav = require('webdav-server').v2
const fs = require('fs')

const server = new webdav.WebDAVServer({
  port: 1900,
  https: {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem')
  }
})

server.setFileSystem('', new webdav.PhysicalFileSystem('./specs/testDir'), success => {
  server.start( () => console.log("local server ready"))
	
})

//server.start(() => console.log("** Webdav Server running ***"))
//const clientTaskified = require("./taskifyPromiseModule")(client)
//console.log(clientTaskified)
//console.log(clientTaskified.getDirectoryContents.toString())
//clientTaskified.getDirectoryContents(config.folder).fork(console.error, console.log)
//clientTaskified.stat('folder1').fork(console.error, console.log)

