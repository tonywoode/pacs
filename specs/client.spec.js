"use strict"

const src = `../src/`
const webdavServer = require("webdav-server").v2
const webdavClient = require("webdav")
const config = { url: "http://localhost", port: 1900 }

//start webdav server serving a fake filesystem, you'll get 200s back
const server = require(`${src}server`)(webdavServer)(config)
const client = require(`${src}client`)(webdavClient)(config)

const clientTaskified = require(`${src}taskifyPromiseModule`)(client)
//client.stat("folder1/file1.txt").then(result => {
//  console.log( "result is " + JSON.stringify(result.filename))
//  server.stop()
//  })
//    .catch(console.log)
const newError = msg => {
  throw new Error(msg)
}

describe(`client`, () => {
  afterEach(() => server.stop())
  const file = "/folder1/file1.txt"
  describe(`stat`, () => {
    it(`should lookup a file`, done => {
      clientTaskified.stat(file).fork(
        // don't even think about writing: `rej =>`
        done //done(`don't even think about invoking done`))
        , res => { 
          expect(res.filename).to.equal(file)          
          done()
        }
        )

    })
  //so we have a server running on port 1900 let's run a stat command to get a listing eh
  })
})

