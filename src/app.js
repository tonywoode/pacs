'use strict'
const config = require("../config.json")
const webdavClient = require("webdav")
const client = require("./client")(webdavClient, config)

const Task = require("data.task")

const clientServicesWith = require("./client-services.js")
const clientServices = clientServicesWith(client, config)

console.log("WEBDAV CLIENT SUPPORTS:")
console.log(client)

clientServices.nasDirListing.fork(console.error, console.log)
