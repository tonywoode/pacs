const  config = require("../config.json")
const { createClient } = require("webdav")
 
const client = createClient(
    `${config.url}:${config.port}`,
    {
        username: config.user,
        password: config.pass
    }
)

module.exports = client

