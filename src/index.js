const config = require("../config.json")
const client = require("./client")
const Task = require("data.task")

//promise to task
const nasDirListing = new Task((rej, res) =>
  client
    .getDirectoryContents(config.folder)
    .then(res)
    .catch(rej)
)

nasDirListing.fork(console.log, console.log)
