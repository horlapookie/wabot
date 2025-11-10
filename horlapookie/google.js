
import axios from 'axios';
import * as cheerio from 'cheerio';

export default {
  name: 'google',
  description: 'Search Google and get top results',
  async execute(msg, { args, sock }) {
    const query = args.join(' ');
    if (!query) {
      await sock.sendMessage(msg.key.remoteJid, { 
        text: '❓ Please provide a search query.\n\nExample: $google what is nodejs' 
      }, { quoted: msg });
      return;
    }

    try {
      // Use PopCat API for Google search
      const apiUrl = `https://api.popcat.xyz/google?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.results || data.results.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ No results found for your query.' 
        }, { quoted: msg });
        return;
      }

      let responseText = `🔍 *Google Search Results for:* ${query}\n\n`;
      data.results.slice(0, 5).forEach((result, index) => {
        responseText += `*${index + 1}. ${result.title}*\n`;
        responseText += `🔗 ${result.url}\n`;
        if (result.description) {
          responseText += `📄 ${result.description}\n`;
        }
        responseText += `\n`;
      });

      await sock.sendMessage(msg.key.remoteJid, { 
        text: responseText.trim() 
      }, { quoted: msg });
    } catch (error) {
      console.error('[google] Search error:', error.message);
      await sock.sendMessage(msg.key.remoteJid, { 
        text: '❌ Failed to perform search. Please try again later.' 
      }, { quoted: msg });
    }
  }
};
