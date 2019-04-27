'use strict'
//const clientTaskified = require("./taskifyPromiseModule")(client)
//console.log(clientTaskified)
//console.log(clientTaskified.getDirectoryContents.toString())
//clientTaskified.getDirectoryContents(config.folder).fork(console.error, console.log)

//if the client is too heavyweight or doesn't reuse the connection,
// perhaps node's http might reuse the connection:
// https://stackoverflow.com/questions/53933409/node-js-http-post-request-with-basic-authentication  
module.exports = config => client => {
  return client.stat(config.folder).then(
  () => true
)
  .catch( () => false)
}

