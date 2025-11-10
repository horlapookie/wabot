
import axios from 'axios';

export default {
  name: 'github',
  description: 'Get GitHub repository info and download link',
  async execute(msg, { args, sock }) {
    const repoUrl = args[0];
    
    if (!repoUrl || !repoUrl.includes('github.com')) {
      await sock.sendMessage(msg.key.remoteJid, { 
        text: '❓ Please provide a valid GitHub repository URL.\n\nExample: $github https://github.com/username/repo' 
      }, { quoted: msg });
      return;
    }

    try {
      // Extract owner and repo from URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ Invalid GitHub URL format.' 
        }, { quoted: msg });
        return;
      }

      const [, owner, repo] = match;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Fetch repository info from GitHub API
      const apiUrl = `https://api.github.com/repos/${owner}/${cleanRepo}`;
      const { data } = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'WhatsApp-Bot',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const downloadUrl = `https://github.com/${owner}/${cleanRepo}/archive/refs/heads/${data.default_branch}.zip`;

      let responseText = `📦 *GitHub Repository Info*\n\n`;
      responseText += `📌 *Name:* ${data.name}\n`;
      responseText += `👤 *Owner:* ${data.owner.login}\n`;
      responseText += `📝 *Description:* ${data.description || 'No description'}\n\n`;
      responseText += `⭐ *Stars:* ${data.stargazers_count.toLocaleString()}\n`;
      responseText += `🍴 *Forks:* ${data.forks_count.toLocaleString()}\n`;
      responseText += `👀 *Watchers:* ${data.watchers_count.toLocaleString()}\n`;
      responseText += `📂 *Open Issues:* ${data.open_issues_count}\n`;
      responseText += `🌐 *Language:* ${data.language || 'Not specified'}\n`;
      responseText += `📅 *Created:* ${new Date(data.created_at).toLocaleDateString()}\n`;
      responseText += `🔄 *Updated:* ${new Date(data.updated_at).toLocaleDateString()}\n\n`;
      responseText += `🔗 *Repository URL:* ${data.html_url}\n`;
      responseText += `📥 *Download ZIP:* ${downloadUrl}\n\n`;
      responseText += `📜 *License:* ${data.license?.name || 'No license'}`;

      await sock.sendMessage(msg.key.remoteJid, { 
        text: responseText 
      }, { quoted: msg });

    } catch (error) {
      console.error('[github] API error:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ Repository not found. Please check the URL and try again.' 
        }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { 
          text: '❌ Failed to fetch repository info. Please try again later.' 
        }, { quoted: msg });
      }
    }
  }
};
