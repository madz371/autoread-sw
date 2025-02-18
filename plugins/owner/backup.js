const { MongoDB, PostgreSQL } = new(require('@neoxr/wb'))
const { writeFileSync: create, readFileSync: read }= require('fs')
const env = require('config.json')
exports.run = {
   usage: ['backup'],
   category: 'owner',
   async: async (m, {
      client,
      command,
      env,
      Func
   }) => {
      try {
         if (process.env.DATABASE_URL && /mongo/.test(process.env.DATABASE_URL)) MongoDB.db = env.database
         const machine = (process.env.DATABASE_URL && /mongo/.test(process.env.DATABASE_URL)) ? MongoDB : (process.env.DATABASE_URL && /postgres/.test(process.env.DATABASE_URL)) ? PostgreSQL : new(require('lib/system/localdb'))(env.database)
         await client.sendReact(m.chat, '🕒', m.key)
         await machine.save(global.db)
         create(env.database + '.json', JSON.stringify(global.db, null, 3), 'utf-8')
         await client.sendFile(m.chat, read('./' + env.database + '.json'), env.database + '.json', '', m)
      } catch (e) {
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   owner: true,
   cache: true,
   location: __filename
}