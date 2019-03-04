const { createClient } = require("webdav")
 
const client = (webdavClient, config) => webdavClient.createClient(
    `${config.url}:${config.port}`,
    {
        username: config.user,
        password: config.pass
    }
)

module.exports = client

