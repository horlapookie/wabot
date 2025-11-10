export const commands = [
  { name: 'menu', category: 'General', description: 'Show all commands' },
  { name: 'ping', category: 'General', description: 'Check bot latency' },
  { name: 'uptime', category: 'General', description: 'Check how long bot has been running' },
  { name: 'time', category: 'General', description: 'Get current time' },
  { name: 'info', category: 'General', description: 'Get command information' },
  { name: 'userinfo', category: 'General', description: 'Get user information' },
  { name: 'profile', category: 'General', description: 'View user profile' },
  
  { name: 'group', category: 'Group', description: 'Group management (kick/ban/promote/demote/tagall/warn/lock/unlock)' },
  
  { name: 'ask', category: 'AI', description: 'Ask AI a question' },
  
  { name: 'xsearch', category: 'Media', description: 'Search Xvideos content' },
  { name: 'xget', category: 'Media', description: 'Download Xvideos video' },
  { name: 'screenshot', category: 'Media', description: 'Take a screenshot of a website' },
  
  { name: 'echo', category: 'Fun', description: 'Echo your message' },
  { name: 'joke', category: 'Fun', description: 'Get a random joke' },
  { name: 'quote', category: 'Fun', description: 'Get a random quote' },
  
  { name: 'viewonce', category: 'Utility', description: 'View once media' },
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
