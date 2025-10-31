import axios from 'axios';

async function hentaiScraper() {
  try {
    const url = 'https://sfmcompile.club/api/posts?tags=3d&limit=10';
    const response = await axios.get(url);
    const posts = response.data.posts || [];
    if (!posts.length) throw new Error('No posts found');
    return posts[Math.floor(Math.random() * posts.length)];
  } catch (error) {
    throw error;
  }
}

export default {
  name: 'hentai',
  description: '🔞 Get random hentai posts',
  async execute(msg, { sock }) {
    try {
      const post = await hentaiScraper();
      if (!post.file.url) return sock.sendMessage(msg.key.remoteJid, { text: '😔 No media found.' });
      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: post.file.url },
        caption: `🔞 Hentai: ${post.tags.join(', ')}`
      });
    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, { text: '⚠️ Error fetching hentai posts.' });
    }
  }
};
