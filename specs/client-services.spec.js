'use strict'

const src = `../src/`

const config =  {
  "url": "http://fake.webdav.server",
  "port": 5005,
  "user":  "fake-user",
  "pass": "fake-pass",
  "folder": "GAMES"
}

const client = { getDirectoryContents(folder) { folder }}
const clientServicesWith = require(`${src}client-services.js`)
const clientServices = clientServicesWith(client, config)
console.log(clientServices)
console.log(clientServices.nasDirListing)

