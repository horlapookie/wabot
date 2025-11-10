import { downloadXvideo } from '../toshiro-helper/xmedia.js';

export default {
  name: 'xget',
  description: 'Download video from Xvideos link',
  async execute(msg, { sock, args }) {
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Please provide a valid Xvideos link.\n\nExample: `$xget https://www.xvideos.com/video.uccemhm8148/title-here`'
        }, { quoted: msg });
      }

      const link = args[0];

      await sock.sendMessage(msg.key.remoteJid, {
        text: '⏳ Downloading video, please wait...'
      }, { quoted: msg });

      const result = await downloadXvideo(link);

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: result.filename },
        caption: `🔞 *${result.title}*\nDownloaded from: ${result.link}`
      }, { quoted: msg });

    } catch (err) {
      console.error('[xget] Error:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ ${err.message}`
      }, { quoted: msg });
    }
  }
};
