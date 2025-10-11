import Log from '../classes/Log.js'

let logger = {
  log(user,type,description) {
    let newLog = Log.initOne(user,type,description)
    newLog.save()
  }
}

export default logger