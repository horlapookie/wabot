import fs from 'fs';
import path from 'path';

export default {
  name: 'unban',
  description: 'Unban a user by replying or tagging',
  onlyMod: true, // Only owner or moderators
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

    let targets = [];

    // If reply
    const replyTarget = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (replyTarget) targets.push(replyTarget.split('@')[0]);

    // If tagged
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const jid of mentions) targets.push(jid.split('@')[0]);

    if (targets.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Reply to or tag the user you want to unban.'
      }, { quoted: msg });
      return;
    }

    for (const number of targets) {
      delete banned[number];
    }

    fs.writeFileSync(bannedPath, JSON.stringify(banned, null, 2));

    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ Unbanned:\n${targets.map(n => `@${n}`).join('\n')}`,
      mentions: targets.map(n => `${n}@s.whatsapp.net`)
    }, { quoted: msg });
  }
};
