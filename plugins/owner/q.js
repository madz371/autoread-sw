exports.run = {
   usage: ['q'],
   use: 'reply chat',
   category: 'owner',
   async: async (m, {
      client,
      store
   }) => {
      try {
         if (!m.quoted) return client.reply(m.chat, Func.texted('bold', `🚩 Reply to message that contain quoted.`), m)
         const msg = await store.loadMessage(m.chat, m.quoted.id)
         if (msg.quoted === null) return client.reply(m.chat, Func.texted('bold', `🚩 Message does not contain quoted.`), m)
         return client.copyNForward(m.chat, msg.quoted.fakeObj)
      } catch (e) {
         client.reply(m.chat, `🚩 Can't load message.`, m)
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}