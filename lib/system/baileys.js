const { Function: Func } = new(require('@neoxr/wb'))
const fs = require('fs')
const mime = require('mime-types').lookup

module.exports = client => {
   
   client.getName = jid => {
      const isFound = global.db.users.find(v => v.jid === client.decodeJid(jid))
      if (!isFound) return null
      return isFound.name
   }
}
