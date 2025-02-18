"use strict";
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
require('events').EventEmitter.defaultMaxListeners = 500
const { Baileys, MongoDB, PostgreSQL, Function: Func, Config: env } = new (require('@neoxr/wb'))
require('./lib/system/functions'), require('./lib/system/scraper')
const fs = require('fs'),
   path = require('path'),
   colors = require('@colors/colors'),
   { platform } = require('os')
const cache = new (require('node-cache'))({
   stdTTL: env.cooldown
})
if (process.env.DATABASE_URL && /mongo/.test(process.env.DATABASE_URL)) MongoDB.db = env.database
const machine = (process.env.DATABASE_URL && /mongo/.test(process.env.DATABASE_URL)) ? MongoDB : (process.env.DATABASE_URL && /postgres/.test(process.env.DATABASE_URL)) ? PostgreSQL : new (require('./lib/system/localdb'))(env.database)
const client = new Baileys({
   type: '--neoxr-v1',
   plugsdir: 'plugins',
   session: 'session',
   online: true,
   bypass_disappearing: true,
   version: [2, 3000, 1019573976]
}, {
   browser: ['Ubuntu', 'Firefox', '20.0.00']
})

/* starting to connect */
client.once('connect', async res => {
   /* load database */
   global.db = { users: [], chats: [], groups: [], statistic: {}, sticker: {}, setting: {}, ...(await machine.fetch() || {}) }

   /* save database */
   await machine.save(global.db)

   /* write connection log */
   if (res && typeof res === 'object' && res.message) Func.logFile(res.message)
})

/* print error */
client.once('error', async error => {
   console.log(colors.red(error.message))
   if (error && typeof error === 'object' && error.message) Func.logFile(error.message)
})

/* bot is connected */
client.once('ready', async () => {
   /* auto restart if ram usage is over */
   const ramCheck = setInterval(() => {
      var ramUsage = process.memoryUsage().rss
      if (ramUsage >= require('bytes')(env.ram_limit)) {
         clearInterval(ramCheck)
         process.send('reset')
      }
   }, 60 * 1000)

   /* create temp directory if doesn't exists */
   if (!fs.existsSync('./temp')) fs.mkdirSync('./temp')

   /* additional config */
   require('./lib/system/config')

   /* clear temp folder every 10 minutes */
   setInterval(async () => {
      try {
         const tmpFiles = fs.readdirSync('./temp')
         if (tmpFiles.length > 0) {
            tmpFiles.filter(v => !v.endsWith('.file')).map(v => fs.unlinkSync('./temp/' + v))
         }
      } catch { }
   }, 60 * 1000 * 10)
   
    const sock = client.sock;
    sock.reply('6282130962482@s.whatsapp.net', 'Aktif', null) 

   /* save database send http-request every 30 seconds */
   setInterval(async () => {
      if (global.db) await machine.save(global.db)

   }, 5_000)
})

/* print all message object */
client.register('message', ctx => {
   require('./handler')(client.sock, ctx)
   require('./lib/system/baileys')(client.sock)
})

/* print deleted message object */
client.register('message.delete', ctx => {
   const sock = client.sock
   if (!ctx || ctx.origin.fromMe || ctx.origin.isBot || !ctx.origin.sender) return
   if (cache.has(ctx.origin.sender) && cache.get(ctx.origin.sender) === 1) return
   cache.set(ctx.origin.sender, 1)
   if (Object.keys(ctx.delete.message) < 1) return
   if (!ctx.origin.isGroup && global.db.setting.find(v => v.jid == ctx.origin.chat).antidelete) return sock.copyNForward(ctx.origin.chat, ctx.delete)
})