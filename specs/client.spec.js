"use strict"

const src = `../src/`
const webdavServer = require("webdav-server").v2
const webdavClient = require("webdav")
const config = { url: "http://localhost", port: 1900 }

//start webdav server serving a fake filesystem, you'll get 200s back
const server = require(`${src}server`)(webdavServer)(config)
const client = require(`${src}client`)(webdavClient)(config)
//console.log(server)
client.stat("folder1/file1.txt").then(result => {
  console.log( "result is " + JSON.stringify(result.filename))
  //process.exit()
  server.stop()
  })
    .catch(console.log)

//describe(`client`, () => {
//  describe(`stat`, () => {
//    it(`should lookup a file`, () => {})
    //so we have a server running on port 1900 let's run a stat command to get a listing eh
//  })
//})

//server.stop() // server.stop() is not working for me, and nothing else depends on this test
