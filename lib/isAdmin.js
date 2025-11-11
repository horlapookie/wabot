async function isAdmin(sock, chatId, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return { isSenderAdmin: false, isBotAdmin: false };
        }

        const groupMetadata = await sock.groupMetadata(chatId);

        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const normalizedSenderId = senderId.split('@')[0] + '@s.whatsapp.net';

        const participant = groupMetadata.participants.find(p => {
            const participantId = p.id.split('@')[0];
            const senderIdNumber = senderId.split('@')[0];
            return participantId === senderIdNumber;
        });

        const bot = groupMetadata.participants.find(p => {
            const participantId = p.id.split('@')[0];
            const botIdNumber = botId.split('@')[0];
            return participantId === botIdNumber;
        });

        const isBotAdmin = bot && (bot.admin === 'admin' || bot.admin === 'superadmin');
        const isSenderAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

        if (!bot) {
            return { isSenderAdmin, isBotAdmin: false };
        }

        return { isSenderAdmin, isBotAdmin };
    } catch (error) {
        if (error.message && error.message.includes('Timed Out')) {
            return { isSenderAdmin: false, isBotAdmin: false };
        }
        console.error('[isAdmin] Error:', error.message || error);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

export default isAdmin;
