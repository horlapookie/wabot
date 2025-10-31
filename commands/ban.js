import fs from 'fs';
import path from 'path';

export default {
  name: 'ban',
  description: 'Ban a user by replying or tagging, with an optional reason.',
  onlyMod: true, // Owner or mod only
  async execute(msg, { sock, args, moderators, isOwner }) {
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

    // From reply
    const replyTarget = msg.message?.extendedTextMessage?.contextInfo?.participant;
    if (replyTarget) targets.push(replyTarget.split('@')[0]);

    // From mentions
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const jid of mentions) targets.push(jid.split('@')[0]);

    if (targets.length === 0) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Please reply to or mention the user you want to ban.\n\n*Usage:*\n$ban @user --spamming'
      }, { quoted: msg });
      return;
    }

    // Get reason from args like --spamming
    const reasonInput = args.find(arg => arg.startsWith('--'));
    const reason = reasonInput ? reasonInput.slice(2).trim() : null;

    if (!reason) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❓ Please provide a reason using `--`.\n\n*Example:*\n$ban @user --spamming'
      }, { quoted: msg });
      return;
    }

    for (const number of targets) {
      banned[number] = {
        reason,
        by: senderNumber,
        time: new Date().toISOString()
      };
    }

    fs.writeFileSync(bannedPath, JSON.stringify(banned, null, 2));

    await sock.sendMessage(msg.key.remoteJid, {
      text: `✅ *Banned:*\n${targets.map(n => `@${n} - ${reason}`).join('\n')}`,
      mentions: targets.map(n => `${n}@s.whatsapp.net`)
    }, { quoted: msg });
  }
};
