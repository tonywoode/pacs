const Task = require("data.task")

const clientServicesWith = (client, config) => {
  //promise to task
  const nasDirListing = new Task((rej, res) =>
    client
      .getDirectoryContents(config.folder)
      .then(res)
      .catch(rej)
  )

  return { nasDirListing }
}

module.exports = clientServicesWith
