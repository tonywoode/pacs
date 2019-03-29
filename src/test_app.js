'use strict'
//const webdavClient = require("webdav")
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
  server.start( () => console.log("ready"))
	
})
//const config = require("../config.json")
//const client = require("./client")(webdavClient)(config)
//const server = require("./server")(webdavServer)(config)
//const webdavServer = require("webdav-server").v2
//const server = new webdavServer.WebDAVServer({ config })

  //const webdav = require('webdav-server')
  //webdav.PhysicalFolder.loadFromPath('/Volumes/GAMES/Atari Games', (e, folder) => {
  //    if(e) throw e
  //
  //    const server = new webdav.WebDAVServer({ port: 1900 })
  //
  //  server.addResourceTree(folder, (e) => { 
  //    if(e) throw e
  //      server.start((s) => console.log('Server started on port ' + s.address().port + '.') )
  //    })
  //})


//server.start(() => console.log("** Webdav Server running ***"))
//const clientTaskified = require("./taskifyPromiseModule")(client)
//console.log(clientTaskified)
//console.log(clientTaskified.getDirectoryContents.toString())
//clientTaskified.getDirectoryContents(config.folder).fork(console.error, console.log)
//clientTaskified.stat('folder1').fork(console.error, console.log)

