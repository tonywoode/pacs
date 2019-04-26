'use strict'
const http = require('http')
const client = webdavClient => config => keepAliveAgent => webdavClient.createClient(
    `${config.localIp}:${config.port}`,
    {
        username: config.user,
      password: config.pass,
      httpAgent: keepAliveAgent //don't forget we'll need an https keep alive agent too
    }
)

module.exports = client

