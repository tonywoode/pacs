'use strict'
const webdavClient = require("webdav")
const webdavServer = require("webdav-server").v2
const config = require("../config.json")
const client = require("./client")(webdavClient)(config)
const server = require("./server")(webdavServer)(config)

const clientTaskified = require("./taskifyPromiseModule")(client)
console.log(clientTaskified)
console.log(clientTaskified.getDirectoryContents.toString())
clientTaskified.getDirectoryContents(config.folder).fork(console.error, console.log)
clientTaskified.stat('folder1').fork(console.error, console.log)

