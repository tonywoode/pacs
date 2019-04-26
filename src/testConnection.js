'use strict'
const webdavClient = require("webdav")

const config = require("../config.json")

//const clientTaskified = require("./taskifyPromiseModule")(client)
//console.log(clientTaskified)
//console.log(clientTaskified.getDirectoryContents.toString())
//clientTaskified.getDirectoryContents(config.folder).fork(console.error, console.log)

module.exports = httpAgent => {
  
  const client = require("./client")(webdavClient)(config)(httpAgent)
  return client.stat(config.folder).then(
  () => true
)
  .catch( () => false)
}

