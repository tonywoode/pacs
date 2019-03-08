"use strict"

const src = `../src/`
const webdavServer = require("webdav-server").v2
const webdavClient = require("webdav")

const config = {
  url: "http://localhost",
  port: 1900,
}

//start a webdav server serving a fake filesystem, you'll get 200s back off this lot
const server = new webdavServer.WebDAVServer({
  port: config.port
})

server.rootFileSystem().addSubTree(server.createExternalContext(), {
  folder1: {
    // /folder1
    "file1.txt": webdavServer.ResourceType.File, // /folder1/file1.txt
    "file2.txt": webdavServer.ResourceType.File // /folder1/file2.txt
  },
  "file0.txt": webdavServer.ResourceType.File // /file0.txt
})
 server.afterRequest((arg, next) => {
    // Display the method, the URI, the returned status code and the returned message
    console.log(
      ">>",
      arg.request.method,
      arg.requested.uri,
      ">",
      arg.response.statusCode,
      arg.response.statusMessage
    )
    // If available, display the body of the response
    console.log(arg.responseBody)
    next()
  })

server.start(() => console.log("READY"))
const client = require(`${src}client`)(webdavClient, config)
//const client = webdavClient.createClient( "http://localhost:1900")
client.stat("folder1/file1.txt").then(result => {
  console.log( "result is " + JSON.stringify(result.filename))
  server.stop(process.exit())
  })
    .catch(console.log)
//const client = {
//  getDirectoryContents(folder) {
//    folder
//  }
//}

//describe(`client`, () => {
//  describe(`stat`, () => {
//    it(`should lookup a file`, () => {})
    //so we have a server running on port 1900 let's run a stat command to get a listing eh
    
//  })
//})

//server.stop() // server.stop() is not working for me, and nothing else depends on this test
