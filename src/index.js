const config = require("../config.json")
const client = require("./client")(config)
const Task = require("data.task")
const clientServicesWith = require("./client-services.js")

const clientServices = clientServicesWith(client, config)

clientServices.nasDirListing.fork(console.error, console.log)
