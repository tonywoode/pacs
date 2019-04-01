'use strict'
const webdav = require('webdav-server').v2
const app = require('express')()
const server = new webdav.WebDAVServer()
const testDir = './specs/testDir'
const testWinDir = "F:/Computer Classics/c64 Games"


server.setFileSystem('', new webdav.PhysicalFileSystem(testWinDir), console.log("ready"))
app.use(webdav.extensions.express('', server))


server.afterRequest((arg, next) => {
    // Display the method, the URI, the returned status code and the returned message
    console.log('>>', arg.request.method, arg.requested.uri, '>', arg.response.statusCode, arg.response.statusMessage);
    console.log(arg.request.url)
    console.log( arg.request.rawHeaders)
    console.log(arg.request.headers )

    // If available, display the body of the response
    console.log(arg.responseBody);
    next();
});

app.listen(1900)
