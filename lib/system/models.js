const models = {
   users: Object.freeze({
       afk: -1,
       afkReason: '',
       afkObj: {},
       lastseen: 0,
       hit: 0
   }),
   groups: Object.freeze({
      activity: 0,
       mute: false
       member: {}
   }),
   chats: Object.freeze({
      chat: 0,
      lastchat: 0,
      lastseen: 0
   }),
   setting: Object.freeze({
      autodownload: true,
      antispam: false,
      debug: false,
      autoreadgc: false,
      autoreadpc: false,
      autoreact: false,
      antidelete: false,
      error: [],
      hidden: [],
      pluginDisable: [],
      receiver: [],
      groupmode: true,
      viewonce: true,
      antidelete: true,
      autosticker: true,
      sk_pack: 'WhatsApp Bot',
      sk_author: 'tiktok: @devar.bot',
      self: true,
      noprefix: true,
      multiprefix: true,
      prefix: ['.', '#', '!', '/'],
      emoji: ['🤣', '🥹', '😂', '😋', '😎', '🤓', '🤪', '🥳', '😠', '😱', '🤔'],
      toxic: ["ajg", "ajig", "anjas", "anjg", "anjim", "anjing", "anjrot", "anying", "asw", "autis", "babi", "bacod", "bacot", "bagong", "bajingan", "bangsad", "bangsat", "bastard", "bego", "bgsd", "biadab", "biadap", "bitch", "bngst", "bodoh", "bokep", "cocote", "coli", "colmek", "comli", "dajjal", "dancok", "dongo", "fuck", "gelay", "goblog", "goblok", "guoblog", "guoblok", "hairul", "henceut", "idiot", "itil", "jamet", "jancok", "jembut", "jingan", "kafir", "kanjut", "kanyut", "keparat", "kntl", "kontol", "lana", "loli", "lont", "lonte", "mancing", "meki", "memek", "ngentod", "ngentot", "ngewe", "ngocok", "ngtd", "njeng", "njing", "njinx", "oppai", "pantek", "pantek", "peler", "pepek", "pilat", "pler", "pornhub", "pucek", "puki", "pukimak", "redhub", "sange", "setan", "silit", "telaso", "tempek", "tete", "titit", "toket", "tolol", "tomlol", "tytyd", "xnxx"],
      online: true,
      onlyprefix: '+',
      owners: [''],
      lastReset: new Date * 1,
      msg: 'Hi +tag 🪸\nI am an automated system (WhatsApp Bot) that can help to do something, search and get data.',
      style: 4,
      cover: 'https://qu.ax/myNsY.jpg',
      link: 'https://chat.whatsapp.com/DI9hzTGqXoi5rRwsbpadCk'
   })
}

module.exports = { models }