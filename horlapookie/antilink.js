import { setAntilinkSetting, getAntilinkSetting, removeAntilinkSetting } from '../lib/antilinkSettings.js';
import isAdmin from '../lib/isAdmin.js';

export default {
  name: 'antilink',
  description: 'Configure antilink settings for the group',
  category: 'Group',
  async execute(msg, { sock, args }) {
    const chatId = msg.key.remoteJid;
    const senderId = msg.key.participant || msg.key.remoteJid;

    const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isSenderAdmin) {
      await sock.sendMessage(chatId, { text: '```For Group Admins Only!```' });
      return;
    }

    const prefix = '$';
    const action = args[0]?.toLowerCase();

    if (!action) {
      const usage = `\`\`\`ANTILINK SETUP\n\n${prefix}antilink on\n${prefix}antilink set delete | kick | warn\n${prefix}antilink off\n\`\`\``;
      await sock.sendMessage(chatId, { text: usage });
      return;
    }

    switch (action) {
      case 'on':
        const currentSetting = getAntilinkSetting(chatId);
        if (currentSetting !== 'off') {
          await sock.sendMessage(chatId, { text: '*_Antilink is already on_*' });
          return;
        }
        setAntilinkSetting(chatId, 'delete');
        await sock.sendMessage(chatId, { text: '*_Antilink has been turned ON_*' });
        break;

      case 'off':
        removeAntilinkSetting(chatId);
        await sock.sendMessage(chatId, { text: '*_Antilink has been turned OFF_*' });
        break;

      case 'set':
        if (args.length < 2) {
          await sock.sendMessage(chatId, {
            text: `*_Please specify an action: ${prefix}antilink set delete | kick | warn_*`
          });
          return;
        }
        const setAction = args[1].toLowerCase();
        if (!['delete', 'kick', 'warn'].includes(setAction)) {
          await sock.sendMessage(chatId, {
            text: '*_Invalid action. Choose delete, kick, or warn._*'
          });
          return;
        }
        setAntilinkSetting(chatId, setAction);
        await sock.sendMessage(chatId, {
          text: `*_Antilink action set to ${setAction}_*`
        });
        break;

      case 'status':
        const status = getAntilinkSetting(chatId);
        await sock.sendMessage(chatId, {
          text: `*_Antilink Configuration:_*\nStatus: ${status === 'off' ? 'OFF' : 'ON'}\nAction: ${status === 'off' ? 'Not set' : status}`
        });
        break;

      default:
        await sock.sendMessage(chatId, { text: `*_Use ${prefix}antilink for usage._*` });
    }
  }
};

export async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const action = getAntilinkSetting(chatId);
        if (action === 'off') return;

        console.log(`Antilink enabled for ${chatId}: ${action}`);

        const linkPatterns = [
            /https?:\/\/[^\s]+/gi,
            /www\.[^\s]+/gi,
            /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/gi,
            /wa\.me\/[+0-9]+/gi,
            /t\.me\/[A-Za-z0-9_]+/gi,
        ];

        const containsLink = linkPatterns.some(pattern => pattern.test(userMessage));

        if (containsLink) {
            console.log(`Link detected in message from ${senderId}`);

            const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
            if (isSenderAdmin) {
                console.log('Sender is admin, skipping antilink action');
                return;
            }

            try {
                await sock.sendMessage(chatId, { delete: message.key });
                console.log(`Message deleted successfully`);
            } catch (deleteError) {
                console.error('Failed to delete message:', deleteError);
            }

            const mentionedJidList = [senderId];

            switch (action) {
                case 'kick':
                    try {
                        await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                        await sock.sendMessage(chatId, {
                            text: `🚫 @${senderId.split('@')[0]} has been kicked for sending links!`,
                            mentions: mentionedJidList
                        });
                    } catch (kickError) {
                        console.error('Failed to kick user:', kickError);
                        await sock.sendMessage(chatId, {
                            text: `⚠️ @${senderId.split('@')[0]}, links are not allowed here!`,
                            mentions: mentionedJidList
                        });
                    }
                    break;

                case 'warn':
                    if (!global.antilinkWarnings) global.antilinkWarnings = {};
                    if (!global.antilinkWarnings[chatId]) global.antilinkWarnings[chatId] = {};

                    const warnings = global.antilinkWarnings[chatId][senderId] || 0;
                    const newWarnings = warnings + 1;
                    global.antilinkWarnings[chatId][senderId] = newWarnings;

                    if (newWarnings >= 3) {
                        try {
                            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                            delete global.antilinkWarnings[chatId][senderId];
                            await sock.sendMessage(chatId, {
                                text: `🚫 @${senderId.split('@')[0]} has been kicked after 3 warnings for sending links!`,
                                mentions: mentionedJidList
                            });
                        } catch (kickError) {
                            console.error('Failed to kick user after warnings:', kickError);
                        }
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `⚠️ @${senderId.split('@')[0]} warning ${newWarnings}/3 for sending links!`,
                            mentions: mentionedJidList
                        });
                    }
                    break;

                default:
                    await sock.sendMessage(chatId, {
                        text: `⚠️ @${senderId.split('@')[0]}, links are not allowed in this group!`,
                        mentions: mentionedJidList
                    });
                    break;
            }
        }
    } catch (error) {
        console.error('Error in handleLinkDetection:', error);
    }
}
