import fs from 'fs';
import path from 'path';

export default {
  name: 'banlist',
  description: 'View all banned numbers',
  onlyMod: true,
  async execute(msg, { sock, moderators, isOwner }) {
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderNumber = senderJid.split('@')[0];

    if (!isOwner && !moderators.includes(senderNumber)) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Only the owner or a moderator can use this command.'
      }, { quoted: msg });
      return;
    }

    const bannedPath = path.join(process.cwd(), 'banned.json');
    let banned = fs.existsSync(bannedPath) ? JSON.parse(fs.readFileSync(bannedPath)) : {};

    const users = Object.entries(banned);

    if (users.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '✅ No users are currently banned.'
      }, { quoted: msg });
      return;
    }

    const list = users.map(([num, info], i) => {
      const reason = info?.reason || 'No reason';
      const by = info?.by || 'Unknown';
      const time = info?.time ? new Date(info.time).toLocaleString() : 'Unknown time';
      return `${i + 1}. wa.me/${num}\n   ┗ Reason: ${reason}\n   ┗ By: @${by}\n   ┗ At: ${time}`;
    }).join('\n\n');

    await sock.sendMessage(msg.key.remoteJid, {
      text: `🚫 *Banned Users List:*\n\n${list}`,
      mentions: users.map(([_, info]) => `${info.by}@s.whatsapp.net`)
    }, { quoted: msg });
  }
};
