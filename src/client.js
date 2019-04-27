'use strict'
const client = webdavClient => config => keepAliveAgent => webdavClient.createClient(
  `${config[config.whichIp]}:${config.port}`,
    {
        username: config.user,
      password: config.pass,
      //atm this is causing the intial mounting to hang...httpAgent: keepAliveAgent //don't forget we'll need an https keep alive agent too
    }
)

module.exports = client

