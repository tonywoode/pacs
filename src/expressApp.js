'use strict'

const webdav = require('webdav-server').v2
const express = require('express')
const config = require("../config.json")
 
const server = require("./server")(webdav)(config)
//const server = new webdav.WebDAVServer()
const app = express()
 
// Mount the WebDAVServer instance
app.use(webdav.extensions.express('', server))
app.listen(1901) // Start the Express server
