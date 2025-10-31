export default {
  name: 'addmod',
  onlyMod: true,
  async execute(msg, { sock, args, moderators, saveModerators }) {
    const remoteJid = msg.key.remoteJid;
    if (!args[0]) {
      return await sock.sendMessage(remoteJid, {
        text: 'Usage: $addmod 234xxxxxxxxxx',
      }, { quoted: msg });
    }

    const number = args[0].replace(/\D/g, '');
    if (!moderators.includes(number)) {
      moderators.push(number);
      saveModerators();
    }

    await sock.sendMessage(remoteJid, {
      text: `✅ @${number} has been added as a moderator.`,
      mentions: [`${number}@s.whatsapp.net`],
    }, { quoted: msg });
  },
};
