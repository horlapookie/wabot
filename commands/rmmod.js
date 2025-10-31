export default {
  name: 'rmmod',
  onlyMod: true,
  async execute(msg, { sock, args, moderators, saveModerators }) {
    const remoteJid = msg.key.remoteJid;
    if (!args[0]) {
      return await sock.sendMessage(remoteJid, {
        text: 'Usage: $rmmod 234xxxxxxxxxx',
      }, { quoted: msg });
    }

    const number = args[0].replace(/\D/g, '');
    const index = moderators.indexOf(number);
    if (index !== -1) {
      moderators.splice(index, 1);
      saveModerators();
    }

    await sock.sendMessage(remoteJid, {
      text: `❌ @${number} is no longer a moderator.`,
      mentions: [`${number}@s.whatsapp.net`],
    }, { quoted: msg });
  },
};
