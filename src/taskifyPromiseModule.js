const Task = require("data.task")

const taskify = p => (...args) => 
  new Task((rej, res) => {
        p(...args)
          .then(res)
          .catch(rej) //or to log less verbosely:.catch(err => console.error(`Error: ${err.message}\n${err.stack}`) && rej(err))
  })

module.exports = theirModule =>  
  Object.keys(theirModule).reduce((r, i) => {
    r[i] = taskify(theirModule[i])
    return r
  }, {})
