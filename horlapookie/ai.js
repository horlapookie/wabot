
import axios from 'axios';

export default {
  name: 'ai',
  description: 'Ask AI a question using Groq API',
  async execute(msg, { args, sock }) {
    const prompt = args.join(' ');
    if (!prompt) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❓ Please provide a question for the AI.' }, { quoted: msg });
      return;
    }

    try {
      // Using free DuckDuckGo AI chat API
      const response = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(prompt)}&owner=Toshiro&botname=ToshiroBot`);
      
      const answer = response.data.response;
      await sock.sendMessage(msg.key.remoteJid, { 
        text: `🤖 *AI Response:*\n\n${answer}` 
      }, { quoted: msg });
    } catch (error) {
      console.error('[ai] API error:', error.response?.data || error.message);
      await sock.sendMessage(msg.key.remoteJid, { 
        text: '❌ Sorry, something went wrong with the AI. Please try again later.' 
      }, { quoted: msg });
    }
  }
};
