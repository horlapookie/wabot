
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
      // Use DuckDuckGo Instant Answer API as a reliable fallback
      const { data } = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      let responseText = `🔍 *Search Results for:* ${query}\n\n`;

      // Check for instant answer
      if (data.AbstractText) {
        responseText += `📄 *Answer:*\n${data.AbstractText}\n\n`;
        if (data.AbstractURL) {
          responseText += `🔗 Source: ${data.AbstractURL}\n\n`;
        }
      }

      // Add related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        responseText += `*Related Results:*\n\n`;
        const topics = data.RelatedTopics.filter(topic => topic.Text && topic.FirstURL).slice(0, 5);
        
        if (topics.length > 0) {
          topics.forEach((topic, index) => {
            responseText += `*${index + 1}. ${topic.Text.split(' - ')[0]}*\n`;
            responseText += `🔗 ${topic.FirstURL}\n`;
            const description = topic.Text.split(' - ')[1];
            if (description) {
              responseText += `📄 ${description}\n`;
            }
            responseText += `\n`;
          });
        }
      }

      // If no results found, try alternative search
      if (!data.AbstractText && (!data.RelatedTopics || data.RelatedTopics.length === 0)) {
        // Fallback to a simple web search API
        try {
          const searchResponse = await axios.get(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=demo&num=5`, {
            timeout: 5000
          });
          
          if (searchResponse.data.organic_results && searchResponse.data.organic_results.length > 0) {
            responseText = `🔍 *Google Search Results for:* ${query}\n\n`;
            searchResponse.data.organic_results.forEach((result, index) => {
              responseText += `*${index + 1}. ${result.title}*\n`;
              responseText += `🔗 ${result.link}\n`;
              if (result.snippet) {
                responseText += `📄 ${result.snippet}\n`;
              }
              responseText += `\n`;
            });
          } else {
            throw new Error('No results');
          }
        } catch (fallbackError) {
          // Last resort: Simple Wikipedia search
          const wikiResponse = await axios.get(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json`, {
            timeout: 5000
          });
          
          if (wikiResponse.data && wikiResponse.data[1] && wikiResponse.data[1].length > 0) {
            responseText = `🔍 *Wikipedia Search Results for:* ${query}\n\n`;
            for (let i = 0; i < wikiResponse.data[1].length; i++) {
              responseText += `*${i + 1}. ${wikiResponse.data[1][i]}*\n`;
              if (wikiResponse.data[2][i]) {
                responseText += `📄 ${wikiResponse.data[2][i]}\n`;
              }
              responseText += `🔗 ${wikiResponse.data[3][i]}\n\n`;
            }
          } else {
            await sock.sendMessage(msg.key.remoteJid, { 
              text: '❌ No results found for your query. Please try a different search term.' 
            }, { quoted: msg });
            return;
          }
        }
      }

      await sock.sendMessage(msg.key.remoteJid, { 
        text: responseText.trim() 
      }, { quoted: msg });
    } catch (error) {
      console.error('[google] Search error:', error.message);
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `❌ Failed to perform search: ${error.message}\n\nPlease try again later or use a different search term.` 
      }, { quoted: msg });
    }
  }
};
