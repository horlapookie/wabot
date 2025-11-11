
export default {
  name: 'grouplink',
  description: 'Get group invite link (admin only)',
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
    
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botIsAdmin = admins.includes(botNumber);

    if (!isSenderAdmin) {
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can fetch the group link.' }, { quoted: msg });
    }
    
    if (!botIsAdmin) {
      return await sock.sendMessage(remoteJid, { text: '❌ I need to be an admin to fetch the group link.' }, { quoted: msg });
    }

    try {
      const code = await sock.groupInviteCode(remoteJid);
      const inviteLink = `https://chat.whatsapp.com/${code}`;
      
      await sock.sendMessage(remoteJid, {
        text: `🔗 *Group Invite Link:*\n\n${inviteLink}`
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(remoteJid, { 
        text: `❌ Failed to fetch group link: ${error.message}` 
      }, { quoted: msg });
    }
  }
};
