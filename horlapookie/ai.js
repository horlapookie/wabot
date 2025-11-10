
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
      // Using a free public AI API (Groq)
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide clear and concise answers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      }, {
        headers: {
          'Authorization': `Bearer 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`,
          'Content-Type': 'application/json'
        }
      });

      const answer = response.data.choices[0].message.content;
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
