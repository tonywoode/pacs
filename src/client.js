const { createClient } = require("webdav")
 
const client = config => createClient(
    `${config.url}:${config.port}`,
    {
        username: config.user,
        password: config.pass
    }
)

module.exports = client

