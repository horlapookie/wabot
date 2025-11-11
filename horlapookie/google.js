
import axios from 'axios';

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
      // Use Google Custom Search API via RapidAPI alternative
      const apiUrl = `https://google-search74.p.rapidapi.com/?query=${encodeURIComponent(query)}&limit=5&related_keywords=true`;
      
      // Fallback to a simpler scraper if RapidAPI fails
      let results;
      try {
        const { data } = await axios.get(`https://api.caliph.biz.id/api/search/googlesearch?q=${encodeURIComponent(query)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (data && data.result && data.result.length > 0) {
          results = data.result;
        } else {
          throw new Error('No results');
        }
      } catch (err) {
        // Second fallback API
        const { data } = await axios.get(`https://api.agatz.xyz/api/googlesearch?message=${encodeURIComponent(query)}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (data && data.data && data.data.length > 0) {
          results = data.data.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
          }));
        } else {
          throw new Error('No results found');
        }
      }

      if (!results || results.length === 0) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ No results found for your query.' 
        }, { quoted: msg });
        return;
      }

      let responseText = `🔍 *Google Search Results for:* ${query}\n\n`;
      results.slice(0, 5).forEach((result, index) => {
        responseText += `*${index + 1}. ${result.title}*\n`;
        responseText += `🔗 ${result.link || result.url}\n`;
        if (result.snippet || result.description) {
          responseText += `📄 ${result.snippet || result.description}\n`;
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
