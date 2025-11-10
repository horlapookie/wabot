
import axios from 'axios';

export default {
  name: 'urban',
  description: 'Search Urban Dictionary for slang definitions',
  async execute(msg, { args, sock }) {
    const term = args.join(' ');
    if (!term) {
      await sock.sendMessage(msg.key.remoteJid, { 
        text: '❓ Please provide a term to search.\n\nExample: $urban yeet' 
      }, { quoted: msg });
      return;
    }

    try {
      const apiUrl = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`;
      const { data } = await axios.get(apiUrl);

      if (!data.list || data.list.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: `❌ No definition found for "${term}".` 
        }, { quoted: msg });
        return;
      }

      const topResult = data.list[0];
      let responseText = `📖 *Urban Dictionary*\n\n`;
      responseText += `*Word:* ${topResult.word}\n\n`;
      responseText += `*Definition:*\n${topResult.definition.replace(/\[|\]/g, '')}\n\n`;
      responseText += `*Example:*\n${topResult.example.replace(/\[|\]/g, '')}\n\n`;
      responseText += `👍 ${topResult.thumbs_up} | 👎 ${topResult.thumbs_down}\n`;
      responseText += `👤 By: ${topResult.author}`;

      await sock.sendMessage(msg.key.remoteJid, { 
        text: responseText 
      }, { quoted: msg });
    } catch (error) {
      console.error('[urban] API error:', error.message);
      await sock.sendMessage(msg.key.remoteJid, { 
        text: '❌ Failed to fetch definition. Please try again later.' 
      }, { quoted: msg });
    }
  }
};
