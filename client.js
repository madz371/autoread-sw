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
   version: [2, 3000, 1019430034]
}, {
   browser: ['Ubuntu', 'Firefox', '20.0.00']
})

client.once('connect', async res => {
   global.db = { users: [], chats: [], groups: [], statistic: {}, sticker: {}, setting: {}, ...(await machine.fetch() || {}) }

   await machine.save(global.db)

   if (res && typeof res === 'object' && res.message) Func.logFile(res.message)
})

client.once('error', async error => {
   console.log(colors.red(error.message))
   if (error && typeof error === 'object' && error.message) Func.logFile(error.message)
})

client.once('ready', async () => {
   const sock = client.sock;
   const ramCheck = setInterval(() => {
      var ramUsage = process.memoryUsage().rss
      if (ramUsage >= require('bytes')(env.ram_limit)) {
         clearInterval(ramCheck)
         process.send('reset')
      }
   }, 60 * 1000)

   if (!fs.existsSync('./temp')) fs.mkdirSync('./temp')

   require('./lib/system/config')

   setInterval(async () => {
      try {
         const tmpFiles = fs.readdirSync('./temp')
         if (tmpFiles.length > 0) {
            tmpFiles.filter(v => !v.endsWith('.file')).map(v => fs.unlinkSync('./temp/' + v))
         }
      } catch { }
   }, 60 * 1000 * 10)
   sock.reply('6282130962482@s.whatsapp.net', 'Online', null) 
   setInterval(async () => {
      if (global.db) await machine.save(global.db)

   }, 60_000)
})

/* print all message object */
client.register('message', ctx => {
   require('./handler')(client.sock, ctx)
   require('./lib/system/baileys')(client.sock)
})
