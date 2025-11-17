
export const commands = [
  { name: 'menu', category: 'General', description: 'Display all available commands' },
  { name: 'help', category: 'General', description: 'Display all available commands (alias)' },
  { name: 'ping', category: 'General', description: 'Check bot latency' },
  { name: 'uptime', category: 'General', description: 'Check how long bot has been running' },
  { name: 'time', category: 'General', description: 'Get current time' },
  { name: 'info', category: 'General', description: 'Get command information' },
  { name: 'userinfo', category: 'General', description: 'Get user information with profile picture' },
  { name: 'profile', category: 'General', description: 'View user profile' },

  { name: 'kick', category: 'Group', description: 'Kick a member (admin only)' },
  { name: 'ban', category: 'Group', description: 'Ban user from bot (owner/mod only)' },
  { name: 'unban', category: 'Group', description: 'Unban user (owner/mod only)' },
  { name: 'promote', category: 'Group', description: 'Promote to admin (admin only)' },
  { name: 'demote', category: 'Group', description: 'Demote to member (admin only)' },
  { name: 'tagall', category: 'Group', description: 'Tag all members (admin only)' },
  { name: 'warn', category: 'Group', description: 'Warn a user (admin only)' },
  { name: 'lock', category: 'Group', description: 'Lock group (admin only)' },
  { name: 'unlock', category: 'Group', description: 'Unlock group (admin only)' },
  { name: 'grouplink', category: 'Group', description: 'Get group invite link (admin only)' },
  { name: 'grouppp', category: 'Group', description: 'Get group profile picture (admin only)' },
  { name: 'antilink', category: 'Group', description: 'Configure antilink protection (admin only)' },

  { name: 'ai', category: 'AI', description: 'Ask AI a question using Groq' },

  { name: 'google', category: 'Search Tools', description: 'Search Google and get top results' },
  { name: 'urban', category: 'Search Tools', description: 'Search Urban Dictionary for slang definitions' },

  { name: 'github', category: 'Developer Tools', description: 'Get GitHub repo info and download ZIP file' },

  { name: 'play', category: 'Media', description: 'Download and send music from YouTube' },
  { name: 'music', category: 'Media', description: 'Search and download music from YouTube' },
  { name: 'video', category: 'Media', description: 'Search and download video from YouTube' },
  { name: 'audio', category: 'Media', description: 'Download and send audio as file from YouTube' },
  { name: 'videofile', category: 'Media', description: 'Download and send video as file from YouTube' },
  { name: 'xsearch', category: 'Media', description: 'Search for Xvideos content' },
  { name: 'xget', category: 'Media', description: 'Download Xvideos video' },
  { name: 'screenshot', category: 'Media', description: 'Take a screenshot of a website' },

  { name: 'echo', category: 'Fun', description: 'Echo your message' },
  { name: 'joke', category: 'Fun', description: 'Get a random joke' },
  { name: 'quote', category: 'Fun', description: 'Get a random quote' },

  { name: 'viewonce', category: 'Utility', description: 'Bypass view-once media' },
  { name: 'delete', category: 'Utility', description: 'Delete a message' }
];

export function getCommandsByCategory() {
  const categories = {};
  commands.forEach(cmd => {
    if (!categories[cmd.category]) {
      categories[cmd.category] = [];
    }
    categories[cmd.category].push(cmd);
  });
  return categories;
}

export function getTotalCommands() {
  return commands.length;
}
