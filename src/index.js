const config = require("../config.json")
const client = require("./client")
// Get directory contents
const nasDirListing = async => client.getDirectoryContents(config.folder)

const printNasDirListing = async () => console.log(await nasDirListing())

printNasDirListing()
// Outputs a structure like:
// [{
//     filename: "/my-file.txt",
//     basename: "my-file.txt",
//     lastmod: "Mon, 10 Oct 2018 23:24:11 GMT",
//     size: 371,
//     type: "file"
// }]
