"use strict"

module.exports = webdavServer => {
  const server = new webdavServer.WebDAVServer({
    port: 1900
  })

  server.rootFileSystem().addSubTree(server.createExternalContext(), {
    'folder1': {                                // /folder1
      'file1.txt': webdavServer.ResourceType.File,  // /folder1/file1.txt
      'file2.txt': webdavServer.ResourceType.File   // /folder1/file2.txt
    },
    'file0.txt': webdavServer.ResourceType.File       // /file0.txt
  })
    
  server.afterRequest((arg, next) => {
    // Display the method, the URI, the returned status code and the returned message
    console.log(
      ">>",
      arg.request.method,
      arg.requested.uri,
      ">",
      arg.response.statusCode,
      arg.response.statusMessage
    )
    // If available, display the body of the response
    console.log(arg.responseBody)
    next()
  })
  server.start(() => console.log("READY"))
}
