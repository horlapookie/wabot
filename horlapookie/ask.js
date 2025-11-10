import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default {
  name: 'ask',
  description: 'Ask the AI a question',
  async execute(msg, { args, sock }) {
    const prompt = args.join(' ');
    if (!prompt) {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Please provide a prompt.' }, { quoted: msg });
      return;
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      });

      const answer = response.choices[0].message.content;
      await sock.sendMessage(msg.key.remoteJid, { text: answer }, { quoted: msg });
    } catch (error) {
      console.error('[ask] OpenAI error:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: 'Sorry, something went wrong with the AI.' }, { quoted: msg });
    }
  }
};
