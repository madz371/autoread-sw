const { Function: Func, Scraper, Cooldown, Spam, InvCloud, Config: env } = new (require('@neoxr/wb'))
const moment = require('moment-timezone')
const cron = require('node-cron')
const cooldown = new Cooldown(env.cooldown)
const spam = new Spam({
   RESET_TIMER: env.cooldown,
   NOTIFY_THRESHOLD: env.notify_threshold
})
module.exports = async (client, ctx) => {
   const { store, m, body, prefix, plugins, commands, args, command, text, prefixes, core } = ctx
   try {
      require('./lib/system/schema')(m), InvCloud(store)
      let chats = global.db.chats.find(v => v.jid === m.chat)
      let users = global.db.users.find(v => v.jid === m.sender)
      let setting = global.db.setting
      let isOwner = [client.decodeJid(client.user.id).replace(/@.+/, ''), env.owner, ...setting.owners].map(v => v + '@s.whatsapp.net').includes(m.sender)
      const groupMetadata = m.isGroup ? await Func.getGroupMetadata(m.chat, client) : {}
      const participants = m.isGroup ? groupMetadata ? groupMetadata.participants : [] : [] || []
      let adminList = m.isGroup ? await client.groupAdmin(m.chat) : [] || []
      let isAdmin = m.isGroup ? adminList.includes(m.sender) : false
      let isBotAdmin = m.isGroup ? adminList.includes((client.user.id.split`:`[0]) + '@s.whatsapp.net') : false
      let blockList = typeof await (await client.fetchBlocklist()) != 'undefined' ? await (await client.fetchBlocklist()) : []

      if (!setting.online) client.sendPresenceUpdate('unavailable', m.chat)
      if (setting.online) client.sendPresenceUpdate('available', m.chat).then(async () => { client.sendPresenceUpdate('composing', m.chat)})  //recording //composing
      if (m.chat.endsWith('g.us') && setting.autoreadgc) await client.readMessages([m.key])
      if (m.chat.endsWith('s.whatsapp.net') && setting.autoreadpc) await client.readMessages([m.key])
		  
	  if (!setting.multiprefix) setting.noprefix = false
      if (setting.debug && !m.fromMe && isOwner) client.reply(m.chat, Func.jsonFormat(m), m)

      if (chats) {
         chats.chat += 1
         chats.lastchat = new Date * 1
      } else {
         global.db.chats.push({
            jid: m.chat,
            chat: 1,
            lastchat: new Date * 1,
            lastreply: 0
         })
      }

      // Stories Reaction
      client.stories = client.stories ? client.stories : []
      const stories = client.stories.length > 1 ? client.stories.find(v => v.jid === m.sender) : undefined
      if (setting.autoreact && !m.fromMe && m.chat.endsWith('broadcast') && !stories && !setting.except.includes(String(m.sender.replace(/@.+/, ''))) && !/protocol/.test(m.mtype)) {
         client.stories.push({
            jid: m.sender,
            key: m.key
         })
      }
      if (setting.autoreact && !m.fromMe && client.stories.length > 0 && !/protocol/.test(m.mtype)) {
         for (const v of client.stories) {
            if (client.stories.length > 0) await client.sendMessage('status@broadcast', {
               react: {
                  text: Func.random(setting.emoji),
                  key: v.key
               }
            }, {
               statusJidList: [v.jid]
            })
            Func.removeItem(client.stories, v)
            await Func.delay(1500)
            if (client.stories.length < 1) break
         }
      }

      // reset greeting message replies time at 00.00
      cron.schedule('00 00 * * *', () => {
         global.db.chats.map(v => v.lastreply = 0)
      }, {
         scheduled: true,
         timezone: "Asia/Jakarta"
      })

      const matcher = Func.matcher(command, commands).filter(v => v.accuracy >= 60)
      if (prefix && !commands.includes(command) && matcher.length > 0 && !setting.self) {
         if (!m.isGroup || (m.isGroup && !setting.silent)) return 
      }

      const usePrefix = body && prefix && commands.includes(command)
         || body && !prefix && commands.includes(command) && setting.noprefix
         || body && !prefix && commands.includes(command) && env.evaluate_chars.includes(command)

      if (usePrefix) {
         if (setting.error.includes(command)) return 
         if (!m.isGroup && env.blocks.some(no => m.sender.startsWith(no))) return client.updateBlockStatus(m.sender, 'block')
         const is_commands = Object.fromEntries(Object.entries(plugins).filter(([name, prop]) => prop.run.usage))
         for (let name in is_commands) {
            const cmd = is_commands[name].run
            const turn = cmd.usage instanceof Array ? cmd.usage.includes(command) : cmd.usage instanceof String ? cmd.usage == command : false
            const turn_hidden = cmd.hidden instanceof Array ? cmd.hidden.includes(command) : cmd.hidden instanceof String ? cmd.hidden == command : false
            if (!turn && !turn_hidden) continue
            if (m.isBot || m.chat.endsWith('broadcast') || /edit/.test(m.mtype)) continue
            if (setting.self && !isOwner && !m.fromMe) continue
            if (cmd.owner && !isOwner) {
               client.reply(m.chat, global.status.owner, m)
               continue
            }
            if (cmd.group && !m.isGroup) {
               client.reply(m.chat, global.status.group, m)
               continue
            } else if (cmd.botAdmin && !isBotAdmin) {
               client.reply(m.chat, global.status.botAdmin, m)
               continue
            } else if (cmd.admin && !isAdmin) {
               client.reply(m.chat, global.status.admin, m)
               continue
            }
            if (cmd.private && m.isGroup) {
               client.reply(m.chat, global.status.private, m)
               continue
            }
            cmd.async(m, { client, args, text, isPrefix: prefix, prefixes, command, groupMetadata, participants, users, chats, setting, isOwner, isAdmin, isBotAdmin, plugins, blockList, env, ctx, store, Func, Scraper })
            break
         }
      } else {
         const is_events = Object.fromEntries(Object.entries(plugins).filter(([name, prop]) => !prop.run.usage))
         for (let name in is_events) {
            let event = is_events[name].run
            if (m.isBot || m.chat.endsWith('broadcast') || /pollUpdate/.test(m.mtype)) continue
            if (!m.isGroup && env.blocks.some(no => m.sender.startsWith(no))) return client.updateBlockStatus(m.sender, 'block')
            if (setting.self && event.exception && !isOwner && !m.fromMe) continue
            if (!m.isGroup && ['chatbot'].includes(name) && body && Func.socmed(body)) continue
            if (event.owner && !isOwner) continue
            if (event.group && !m.isGroup) continue
            if (event.botAdmin && !isBotAdmin) continue
            if (event.admin && !isAdmin) continue
            if (event.private && m.isGroup) continue
            event.async(m, { client, body, prefixes, groupMetadata, participants, users, chats, setting, isOwner, isAdmin, isBotAdmin, plugins, blockList, env, ctx, store, Func, Scraper })
         }
      }
   } catch (e) {
      if (/(rate|overlimit|timeout|users)/ig.test(e.message)) return
      console.log(e)
   }
   Func.reload(require.resolve(__filename))
}
