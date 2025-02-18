exports.run = {
   usage: ['wame'],
   category: 'miscs',
   async: async (m, {
      client,
      text
   }) => {
      let number = m.quoted ? (m.quoted.sender).split`@` [0] : (m.sender).split`@` [0]
      let chat = text ? text : 'hai'
      client.reply(m.chat, `https://wa.me/${number}?text=${encodeURI(chat)}`, m)
   },
   error: false,
   owner: true
}