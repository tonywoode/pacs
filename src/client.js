'use strict'
const client = webdavClient => config => webdavClient.createClient(
    `${config.localIp}:${config.port}`,
    {
        username: config.user,
        password: config.pass
    }
)

module.exports = client

