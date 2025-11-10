import { getCommandsByCategory, getTotalCommands } from '../lib/menuHelper.js';

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

👤 *Creator:* horlapookie & toshiro
📝 *Prefix:* ${prefix}
🔢 *Total Commands:* ${totalCommands}

`;

    const categoryEmojis = {
      'General': '📌',
      'Group': '👥',
      'AI': '🤖',
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

    await sock.sendMessage(msg.key.remoteJid, {
      text: menuText
    }, { quoted: msg });
  }
};
