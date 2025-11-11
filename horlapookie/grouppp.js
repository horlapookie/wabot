
export default {
  name: 'grouppp',
  description: 'Get group profile picture (admin only)',
  async execute(msg, { sock }) {
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');

    if (!isGroup) {
      return await sock.sendMessage(remoteJid, { text: '❌ This command only works in groups.' }, { quoted: msg });
    }

    const metadata = await sock.groupMetadata(remoteJid);
    const participants = metadata.participants;
    const admins = participants.filter(p => p.admin !== null).map(p => p.id);
    const isSenderAdmin = admins.includes(sender);

    if (!isSenderAdmin) {
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can fetch the group profile picture.' }, { quoted: msg });
    }

    try {
      const ppUrl = await sock.profilePictureUrl(remoteJid, 'image');
      
      await sock.sendMessage(remoteJid, {
        image: { url: ppUrl },
        caption: `📸 *${metadata.subject}*\n\nGroup Profile Picture`
      }, { quoted: msg });
    } catch (error) {
      if (error.message.includes('404')) {
        await sock.sendMessage(remoteJid, { 
          text: '❌ This group has no profile picture.' 
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remoteJid, { 
          text: `❌ Failed to fetch group picture: ${error.message}` 
        }, { quoted: msg });
      }
    }
  }
};
