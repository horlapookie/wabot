import { searchXvideos } from '../toshiro-helper/xmedia.js';

export default {
  name: 'xsearch',
  description: 'Search Xvideos content',
  async execute(msg, { sock, args }) {
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Please provide a search query.\n\nExample: `$xsearch lana rhoades`'
        }, { quoted: msg });
      }

      const query = args.join(' ');
      const results = await searchXvideos(query);

      if (results.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ No results found.'
        }, { quoted: msg });
      }

      const message = `🔍 *Search Results for:* _${query}_\n\n${results.join('\n\n')}`;
      await sock.sendMessage(msg.key.remoteJid, { text: message }, { quoted: msg });

    } catch (err) {
      console.error('[xsearch] Error:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: `❌ ${err.message}`
      }, { quoted: msg });
    }
  }
};
