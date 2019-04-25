'use strict'
const http = require('http')
const keepAliveAgent = new http.Agent({ keepAlive: true });
const client = webdavClient => config => webdavClient.createClient(
    `${config.localIp}:${config.port}`,
    {
        username: config.user,
      password: config.pass,
      httpAgent: keepAliveAgent //don't forget we'll need an https keep alive agent too
    }
)

module.exports = client

