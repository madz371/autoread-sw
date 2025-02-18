const { Function: Func, Scraper, Cooldown, Spam, InvCloud, Config: env } = new (require('@neoxr/wb'))
const cron = require('node-cron')
const cooldown = new Cooldown(env.cooldown)
const spam = new Spam({
   RESET_TIMER: env.cooldown,
   HOLD_TIMER: env.timeout,
   PERMANENT_THRESHOLD: env.permanent_threshold,
   NOTIFY_THRESHOLD: env.notify_threshold,
   BANNED_THRESHOLD: env.banned_threshold
})

module.exports = async (client, ctx) => {
   var { store, m, body, prefix, plugins, commands, args, command, text, prefixes, core } = ctx
   try {
      // "InvCloud" reduces RAM usage and minimizes errors during rewrite (according to recommendations/suggestions from Baileys)
      require('./lib/system/schema')(m, env), InvCloud(store)
      const groupSet = global.db.groups.find(v => v.jid === m.chat)
      const chats = global.db.chats.find(v => v.jid === m.chat)
      const users = global.db.users.find(v => v.jid === m.sender)
      const setting = global.db.setting
      const isOwner = [client.decodeJid(client.user.id).replace(/@.+/, ''), env.owner, ...setting.owners].map(v => v + '@s.whatsapp.net').includes(m.sender)
      const isPrem = users && users.premium || isOwner
      const groupMetadata = m.isGroup ? await Func.getGroupMetadata(m.chat, client) : {}
      const participants = m.isGroup ? groupMetadata ? groupMetadata.participants : [] : [] || []
      const adminList = m.isGroup ? await client.groupAdmin(m.chat) : [] || []
      const isAdmin = m.isGroup ? adminList.includes(m.sender) : false
      const isBotAdmin = m.isGroup ? adminList.includes((client.user.id.split`:`[0]) + '@s.whatsapp.net') : false
      const blockList = typeof await (await client.fetchBlocklist()) != 'undefined' ? await (await client.fetchBlocklist()) : []
      const isSpam = spam.detection(client, m, {
         prefix, command, commands, users, cooldown,
         show: 'all', // choose 'all' or 'command-only'
         banned_times: users.ban_times,
         simple: false
      })

      // exception disabled plugin
      var plugins = Object.fromEntries(Object.entries(plugins).filter(([name, _]) => !setting.pluginDisable.includes(name)))

      // stories reaction
      client.storyJid = client.storyJid ? client.storyJid : []
      if (m.chat.endsWith('broadcast') && !client.storyJid.includes(m.sender) && m.sender != client.decodeJid(client.user.id)) client.storyJid.push(m.sender)
      if (setting.autoreact && m.chat.endsWith('broadcast') && [...new Set(client.storyJid)].includes(m.sender) && !/protocol/.test(m.mtype)) {
         await client.sendMessage('status@broadcast', {
            react: {
               text: Func.random(setting.emoji),
               key: m.key
            }
         }, {
            statusJidList: [m.sender]
         })
      }

      if (!setting.online) client.sendPresenceUpdate('unavailable', m.chat)
      if (setting.online) client.sendPresenceUpdate('available', m.chat).then(async () => { client.sendPresenceUpdate('composing', m.chat)})  //recording //composing
      if (m.chat.endsWith('g.us') && setting.autoreadgc) await client.readMessages([m.key])
      if (m.chat.endsWith('s.whatsapp.net') && setting.autoreadpc) await client.readMessages([m.key])
		  
      if (!users || typeof users.limit === undefined) return global.db.users.push({
         jid: m.sender,
         hit: 0,
         spam: 0
      })
      if (!setting.multiprefix) setting.noprefix = false
      if (m.isGroup) groupSet.activity = new Date() * 1
      if (users) {
         users.name = m.pushName
         users.lastseen = new Date() * 1
      }
      if (chats) {
         chats.chat += 1
         chats.lastseen = new Date * 1
      }
      if (m.isGroup && !m.fromMe) {
         let now = new Date() * 1
         if (!groupSet.member[m.sender]) {
            groupSet.member[m.sender] = {
               lastseen: now,
               warning: 0
            }
         } else {
            groupSet.member[m.sender].lastseen = now
         }
      }
      if (setting.antispam && isSpam && /(BANNED|NOTIFY|TEMPORARY)/.test(isSpam.state)) return client.reply(m.chat, Func.texted('bold', `🚩 ${isSpam.msg}`), m)
      if (setting.antispam && isSpam && /HOLD/.test(isSpam.state)) return
      if (body && !setting.self && core.prefix != setting.onlyprefix && commands.includes(core.command) && !setting.multiprefix && !env.evaluate_chars.includes(core.command)) return client.reply(m.chat, `🚩 *Incorrect prefix!*, this bot uses prefix : *[ ${setting.onlyprefix} ]*\n\n➠ ${setting.onlyprefix + core.command} ${text || ''}`, m)
      const matcher = Func.matcher(command, commands).filter(v => v.accuracy >= 60)
      if (prefix && !commands.includes(command) && matcher.length > 0 && !setting.self) {
         if (!m.isGroup || (m.isGroup && !groupSet.mute)) return client.reply(m.chat, `🚩 Command you are using is wrong, try the following recommendations :\n\n${matcher.map(v => '➠ *' + (prefix ? prefix : '') + v.string + '* (' + v.accuracy + '%)').join('\n')}`, m)
      }
      if (body && prefix && commands.includes(command) || body && !prefix && commands.includes(command) && setting.noprefix || body && !prefix && commands.includes(command) && env.evaluate_chars.includes(command)) {
         if (setting.error.includes(command)) return client.reply(m.chat, Func.texted('bold', `🚩 Command _${(prefix ? prefix : '') + command}_ disabled.`), m)
         if (!m.isGroup && env.blocks.some(no => m.sender.startsWith(no))) return client.updateBlockStatus(m.sender, 'block')
         if (commands.includes(command)) {
            users.hit += 1
            users.usebot = new Date() * 1
            Func.hitstat(command, m.sender)
         }
         const is_commands = Object.fromEntries(Object.entries(plugins).filter(([name, prop]) => prop.run.usage))
         for (let name in is_commands) {
            const cmd = is_commands[name].run
            const turn = cmd.usage instanceof Array ? cmd.usage.includes(command) : cmd.usage instanceof String ? cmd.usage == command : false
            const turn_hidden = cmd.hidden instanceof Array ? cmd.hidden.includes(command) : cmd.hidden instanceof String ? cmd.hidden == command : false
            if (!turn && !turn_hidden) continue
            if (m.isBot || m.chat.endsWith('broadcast') || /edit/.test(m.mtype)) continue
            if (setting.self && !isOwner && !m.fromMe) continue
            if (!m.isGroup && !['owner'].includes(name) && chats && !isPrem && !users.banned && new Date() * 1 - chats.lastchat < env.timeout) continue
            if (!['me', 'owner', 'exec'].includes(name) && users && (users.banned || new Date - users.ban_temporary < env.timeout)) continue
            if (m.isGroup && !['activation', 'groupinfo'].includes(name) && groupSet.mute) continue
            if (cmd.cache && cmd.location) {
               Func.updateFile(cmd.location)
            }
            if (cmd.owner && !isOwner) {
               client.reply(m.chat, global.status.owner, m)
               continue
            }
            if (cmd.restrict && !isPrem && !isOwner && text && new RegExp('\\b' + setting.toxic.join('\\b|\\b') + '\\b').test(text.toLowerCase())) {
               client.reply(m.chat, `⚠️ You violated the *Terms & Conditions* of using bots by using blacklisted keywords, as a penalty for your violation being blocked and banned.`, m).then(() => {
                  users.banned = true
                  client.updateBlockStatus(m.sender, 'block')
               })
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
            cmd.async(m, { client, args, text, isPrefix: prefix, prefixes, command, groupMetadata, participants, users, chats, groupSet, setting, isOwner, isAdmin, isBotAdmin, plugins: Object.fromEntries(Object.entries(plugins).filter(([name, _]) => !setting.pluginDisable.includes(name))), blockList, env, ctx, store, Func, Scraper })
            break
         }
      } else {
         const is_events = Object.fromEntries(Object.entries(plugins).filter(([name, prop]) => !prop.run.usage))
         for (let name in is_events) {
            let event = is_events[name].run
            if ((m.fromMe && m.isBot) || m.chat.endsWith('broadcast') || /pollUpdate/.test(m.mtype)) continue
            if (!m.isGroup && env.blocks.some(no => m.sender.startsWith(no))) return client.updateBlockStatus(m.sender, 'block')
            if (setting.self && !['menfess_ev', 'anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(event.pluginName) && !isOwner && !m.fromMe) continue
            if (!['anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(name) && users && (users.banned || new Date - users.ban_temporary < env.timeout)) continue
            if (!['anti_link', 'anti_tagall', 'anti_virtex', 'filter'].includes(name) && groupSet && groupSet.mute) continue
            if (!m.isGroup && !['menfess_ev', 'chatbot', 'auto_download'].includes(name) && chats && !isPrem && !users.banned && new Date() * 1 - chats.lastchat < env.timeout) continue
            if (event.cache && event.location) {
               Func.updateFile(event.location)
            }
            if (event.error) continue
            if (event.owner && !isOwner) continue
            if (event.group && !m.isGroup) continue
            if (event.botAdmin && !isBotAdmin) continue
            if (event.admin && !isAdmin) continue
            if (event.private && m.isGroup) continue
            event.async(m, { client, body, prefixes, groupMetadata, participants, users, chats, groupSet, setting, isOwner, isAdmin, isBotAdmin, plugins: Object.fromEntries(Object.entries(plugins).filter(([name, _]) => !setting.pluginDisable.includes(name))), blockList, env, ctx, store, Func, Scraper })
         }
      }
   } catch (e) {
      if (/(undefined|overlimit|timed|timeout|users|item|time)/ig.test(e.message)) return
      console.log(e)
   }
   Func.reload(require.resolve(__filename))
}
