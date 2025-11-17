
export default {
  name: 'session',
  description: 'Export current session as base64',
  async execute(msg, { sock, OWNER_NUMBER }) {
    const remoteJid = msg.key.remoteJid;
    const senderJid = msg.key.participant || remoteJid;
    const senderNumber = senderJid.split('@')[0];

    // Only owner can export session
    if (senderNumber !== OWNER_NUMBER) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Only the owner can export the session!'
      }, { quoted: msg });
      return;
    }

    try {
      const { exportSessionAsBase64 } = await import('../session.js');
      const base64Session = exportSessionAsBase64();

      if (base64Session) {
        await sock.sendMessage(remoteJid, {
          text: `✅ *Session Exported Successfully!*\n\n📋 Copy the base64 string below and paste it into a file named \`session-id\` in your project root:\n\n\`\`\`${base64Session}\`\`\`\n\n⚠️ *Important:* Keep this session private! Anyone with this can access your WhatsApp bot.\n\n💡 *How to use:*\n1. Create a file named \`session-id\` (no extension)\n2. Paste the base64 string inside it\n3. Restart the bot - it will automatically load the session`
        }, { quoted: msg });
      } else {
        await sock.sendMessage(remoteJid, {
          text: '❌ Failed to export session. Make sure creds.json exists.'
        }, { quoted: msg });
      }
    } catch (error) {
      await sock.sendMessage(remoteJid, {
        text: `❌ Error exporting session: ${error.message}`
      }, { quoted: msg });
    }
  }
};
