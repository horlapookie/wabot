import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default {
  name: 'translate',
  description: 'Translate text to a specified language. Usage: $translate [language] [text]',
  async execute(msg, { sock, args }) {
    if (args.length < 2) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Usage: $translate [language] [text to translate]' }, { quoted: msg });
      return;
    }

    const targetLanguage = args.shift();
    const textToTranslate = args.join(' ');

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful translator.' },
          { role: 'user', content: `Translate the following text to ${targetLanguage}:\n\n${textToTranslate}` }
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const translation = response.choices[0].message.content;

      await sock.sendMessage(msg.key.remoteJid, { text: `🌐 Translation (${targetLanguage}):\n\n${translation}` }, { quoted: msg });

    } catch (error) {
      console.error('OpenAI API error:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Sorry, there was an error while translating.' }, { quoted: msg });
    }
  }
};
