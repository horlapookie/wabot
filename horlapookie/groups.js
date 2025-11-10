import fs from 'fs';
import path from 'path';

const warnsPath = path.join(process.cwd(), 'database/json/warns.json');
const bannedPath = path.join(process.cwd(), 'database/json/banned.json');

function loadWarns() {
  if (!fs.existsSync(warnsPath)) return {};
  return JSON.parse(fs.readFileSync(warnsPath, 'utf-8'));
}

function saveWarns(warns) {
  fs.writeFileSync(warnsPath, JSON.stringify(warns, null, 2));
}

function loadBanned() {
  if (!fs.existsSync(bannedPath)) return {};
  return JSON.parse(fs.readFileSync(bannedPath, 'utf-8'));
}

function saveBanned(banned) {
  fs.writeFileSync(bannedPath, JSON.stringify(banned, null, 2));
}

// Individual command exports
export const kick = {
  name: 'kick',
  description: 'Kick a member from the group (admin only)',
  async execute(msg, { sock }) {
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');

    if (!isGroup) {
      return await sock.sendMessage(remoteJid, { text: '❌ This command only works in groups.' }, { quoted: msg });
    }

    const metadata = await sock.groupMetadata(remoteJid);
    const participants = metadata.participants;
    
    // Normalize sender JID to match participant format
    const normalizedSender = sender.includes('@') ? sender : `${sender}@s.whatsapp.net`;
    
    const admins = participants.filter(p => p.admin !== null).map(p => p.id);
    const isSenderAdmin = admins.includes(normalizedSender);
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const botIsAdmin = participants.some(p => p.id === botNumber && (p.admin === 'admin' || p.admin === 'superadmin'));

    if (!isSenderAdmin) {
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can kick members.' }, { quoted: msg });
    }
    if (!botIsAdmin) {
      return await sock.sendMessage(remoteJid, { text: '❌ I need to be an admin to kick users.' }, { quoted: msg });
    }

    let userToKick = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                     msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!userToKick) {
      return await sock.sendMessage(remoteJid, { text: '❌ Please reply to or tag the user you want to kick.' }, { quoted: msg });
    }

    if (userToKick === botNumber) {
      return await sock.sendMessage(remoteJid, { text: '❌ I cannot kick myself!' }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(remoteJid, [userToKick], 'remove');
      await sock.sendMessage(remoteJid, {
        text: `✅ Successfully kicked @${userToKick.split('@')[0]}`,
        mentions: [userToKick]
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Failed to kick user: ${error.message}` }, { quoted: msg });
    }
  }
};

export const ban = {
  name: 'ban',
  description: 'Ban a user from using the bot (owner/mod only)',
  async execute(msg, { sock, OWNER_NUMBER, moderators }) {
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];

    if (senderNumber !== OWNER_NUMBER && !(moderators && moderators.includes(senderNumber))) {
      return await sock.sendMessage(remoteJid, { text: '❌ Only bot owner or moderators can ban users.' }, { quoted: msg });
    }

    let userToBan = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                    msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!userToBan) {
      return await sock.sendMessage(remoteJid, { text: '❌ Please reply to or tag the user you want to ban.' }, { quoted: msg });
    }

    const banned = loadBanned();
    const targetNumber = userToBan.split('@')[0];
    banned[targetNumber] = {
      reason: msg.message?.conversation?.split(' ').slice(1).join(' ') || 'No reason provided',
      by: senderNumber,
      time: new Date().toISOString()
    };
    saveBanned(banned);

    await sock.sendMessage(remoteJid, {
      text: `🚫 User @${targetNumber} has been banned from using the bot.`,
      mentions: [userToBan]
    }, { quoted: msg });
  }
};

export const unban = {
  name: 'unban',
  description: 'Unban a user (owner/mod only)',
  async execute(msg, { sock, OWNER_NUMBER, moderators }) {
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderNumber = sender.split('@')[0];

    if (senderNumber !== OWNER_NUMBER && !(moderators && moderators.includes(senderNumber))) {
      return await sock.sendMessage(remoteJid, { text: '❌ Only bot owner or moderators can unban users.' }, { quoted: msg });
    }

    let userToUnban = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                      msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!userToUnban) {
      return await sock.sendMessage(remoteJid, { text: '❌ Please reply to or tag the user you want to unban.' }, { quoted: msg });
    }

    const banned = loadBanned();
    const targetNumber = userToUnban.split('@')[0];

    if (!banned[targetNumber]) {
      return await sock.sendMessage(remoteJid, { text: '❌ User is not banned.' }, { quoted: msg });
    }

    delete banned[targetNumber];
    saveBanned(banned);

    await sock.sendMessage(remoteJid, {
      text: `✅ User @${targetNumber} has been unbanned.`,
      mentions: [userToUnban]
    }, { quoted: msg });
  }
};

export const promote = {
  name: 'promote',
  description: 'Promote a member to admin (admin only)',
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
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can promote members.' }, { quoted: msg });
    }

    let userToPromote = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                        msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!userToPromote) {
      return await sock.sendMessage(remoteJid, { text: '❌ Please tag or reply to the user to promote.' }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(remoteJid, [userToPromote], 'promote');
      await sock.sendMessage(remoteJid, {
        text: `✅ Promoted @${userToPromote.split('@')[0]} to admin`,
        mentions: [userToPromote]
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Failed to promote: ${error.message}` }, { quoted: msg });
    }
  }
};

export const demote = {
  name: 'demote',
  description: 'Demote an admin to member (admin only)',
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
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can demote members.' }, { quoted: msg });
    }

    let userToDemote = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                       msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!userToDemote) {
      return await sock.sendMessage(remoteJid, { text: '❌ Please tag or reply to the user to demote.' }, { quoted: msg });
    }

    try {
      await sock.groupParticipantsUpdate(remoteJid, [userToDemote], 'demote');
      await sock.sendMessage(remoteJid, {
        text: `✅ Demoted @${userToDemote.split('@')[0]} to member`,
        mentions: [userToDemote]
      }, { quoted: msg });
    } catch (error) {
      await sock.sendMessage(remoteJid, { text: `❌ Failed to demote: ${error.message}` }, { quoted: msg });
    }
  }
};

export const tagall = {
  name: 'tagall',
  description: 'Tag all group members (admin only)',
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
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can use tagall.' }, { quoted: msg });
    }

    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const owners = [];
    const botUsers = [];
    const groupAdmins = [];
    const members = [];

    for (const p of participants) {
      const jid = p.id;
      if (jid === botNumber) {
        botUsers.push(jid);
      } else if (p.admin === 'admin' || p.admin === 'superadmin') {
        groupAdmins.push(jid);
      } else {
        members.push(jid);
      }
    }

    function buildMentions(title, emoji, users) {
      if (users.length === 0) return '';
      const mentionsText = users.map(jid => `│ @${jid.split('@')[0]}`).join('\n');
      return `╭─ *${emoji} ${title}:*\n${mentionsText}\n╰────────────\n\n`;
    }

    const text =
      buildMentions('Bot', '🤖', botUsers) +
      buildMentions('Admins', '🛡️', groupAdmins) +
      buildMentions('Members', '👥', members);

    const allMentions = [...botUsers, ...groupAdmins, ...members];

    await sock.sendMessage(remoteJid, {
      text: text.trim(),
      mentions: allMentions
    }, { quoted: msg });
  }
};

export const warn = {
  name: 'warn',
  description: 'Warn a user (admin only)',
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
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can warn users.' }, { quoted: msg });
    }

    let userToWarn = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                     msg.message?.extendedTextMessage?.contextInfo?.participant;

    if (!userToWarn) {
      return await sock.sendMessage(remoteJid, { text: '⚠️ Please tag or reply to the user you want to warn.' }, { quoted: msg });
    }

    const warns = loadWarns();
    if (!warns[remoteJid]) warns[remoteJid] = {};
    if (!warns[remoteJid][userToWarn]) warns[remoteJid][userToWarn] = 0;
    warns[remoteJid][userToWarn] += 1;
    saveWarns(warns);

    await sock.sendMessage(remoteJid, {
      text: `⚠️ @${userToWarn.split('@')[0]} has been warned. Total warnings: ${warns[remoteJid][userToWarn]}`,
      mentions: [userToWarn]
    }, { quoted: msg });
  }
};

export const lock = {
  name: 'lock',
  description: 'Lock group (admin only)',
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
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can lock the group.' }, { quoted: msg });
    }

    try {
      await sock.groupSettingUpdate(remoteJid, 'announcement');
      await sock.sendMessage(remoteJid, { text: '🔒 Group is now locked (only admins can send messages).' }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(remoteJid, { text: `❌ Failed to lock group: ${err.message}` }, { quoted: msg });
    }
  }
};

export const unlock = {
  name: 'unlock',
  description: 'Unlock group (admin only)',
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
      return await sock.sendMessage(remoteJid, { text: '❌ Only group admins can unlock the group.' }, { quoted: msg });
    }

    try {
      await sock.groupSettingUpdate(remoteJid, 'not_announcement');
      await sock.sendMessage(remoteJid, { text: '🔓 Group is now unlocked (everyone can send messages).' }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(remoteJid, { text: `❌ Failed to unlock group: ${err.message}` }, { quoted: msg });
    }
  }
};

// Legacy export for backward compatibility (not used)
export default {
  name: 'group',
  description: 'Group management commands (use individual commands instead)',
  async execute(msg, { sock }) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: '❌ Use individual commands: $kick, $ban, $promote, $demote, $tagall, $warn, $lock, $unlock'
    }, { quoted: msg });
  }
};
