
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
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      const { data } = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(data);
      const results = [];

      // Extract search results
      $('.g').each((i, element) => {
        if (i >= 5) return false; // Limit to 5 results
        
        const title = $(element).find('h3').text();
        const link = $(element).find('a').attr('href');
        const snippet = $(element).find('.VwiC3b').text() || $(element).find('.lyLwlc').text();

        if (title && link) {
          results.push({ title, link, snippet });
        }
      });

      if (results.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ No results found for your query.' 
        }, { quoted: msg });
        return;
      }

      let responseText = `🔍 *Google Search Results for:* ${query}\n\n`;
      results.forEach((result, index) => {
        responseText += `*${index + 1}. ${result.title}*\n`;
        responseText += `🔗 ${result.link}\n`;
        if (result.snippet) {
          responseText += `📄 ${result.snippet}\n`;
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
