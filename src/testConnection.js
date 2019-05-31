"use strict"
//if the client is too heavyweight or doesn't reuse the connection,
// perhaps node's http might reuse the connection:
// https://stackoverflow.com/questions/53933409/node-js-http-post-request-with-basic-authentication
module.exports = config => client => {
  return client
    .stat(config.folder)
    .then(() => true)
    .catch(() => false)
}
