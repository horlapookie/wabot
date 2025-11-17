import { getCommandsByCategory, getTotalCommands } from '../lib/menuHelper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: 'menu',
  description: 'Display all available commands',
  async execute(msg, { sock }) {
    const prefix = '$';
    const categories = getCommandsByCategory();
    const totalCommands = getTotalCommands();

    let menuText = `╔═══════════════════════╗
║   *TOSHIRO MD MINI BOT*   ║
╚═══════════════════════╝

👤 *Owner Name:* toshiro
📝 *Prefix:* ${prefix}
🔢 *Total Commands:* ${totalCommands}

`;

    const categoryEmojis = {
      'General': '📌',
      'Group': '👥',
      'AI': '🤖',
      'Search Tools': '🔍',
      'Developer Tools': '💻',
      'Media': '🎬',
      'Fun': '🎮',
      'Utility': '🔧'
    };

    Object.keys(categories).forEach(category => {
      const emoji = categoryEmojis[category] || '📂';
      menuText += `╭─────⊷ *${emoji} ${category.toUpperCase()}*\n`;
      categories[category].forEach(cmd => {
        menuText += `│ ◦ ${prefix}${cmd.name}\n`;
      });
      menuText += `╰───────────────\n\n`;
    });

    menuText += `╔═══════════════════════╗
║   *Made with ❤️*          ║
╚═══════════════════════╝

Type *${prefix}info <command>* for details`;

    const images = ['menu1.jpg', 'menu2.jpg'];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const imagePath = path.join(__dirname, '../images', randomImage);

    try {
      const imageBuffer = fs.readFileSync(imagePath);
      await sock.sendMessage(msg.key.remoteJid, {
        image: imageBuffer,
        caption: menuText
      }, { quoted: msg });
    } catch (error) {
      console.error('Error sending menu image:', error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: menuText
      }, { quoted: msg });
    }
  }
};
