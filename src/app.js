'use strict'
const webdav = require('webdav-server').v2
const app = require('express')()
const server = new webdav.WebDAVServer()
const testDir = './specs/testDir'
server.setFileSystem('', new webdav.PhysicalFileSystem(testDir), console.log("ready"))
app.use(webdav.extensions.express('', server))
app.listen(1900)
