export const commands = [
  { name: 'menu', category: 'General', description: 'Show all commands' },
  { name: 'ping', category: 'General', description: 'Check bot latency' },
  { name: 'uptime', category: 'General', description: 'Check how long bot has been running' },
  { name: 'time', category: 'General', description: 'Get current time' },
  { name: 'info', category: 'General', description: 'Get command information' },
  { name: 'userinfo', category: 'General', description: 'Get user information' },
  { name: 'profile', category: 'General', description: 'View user profile' },
  
  { name: 'group kick', category: 'Group', description: 'Kick a member from group' },
  { name: 'group ban', category: 'Group', description: 'Ban a user from using bot' },
  { name: 'group unban', category: 'Group', description: 'Unban a user' },
  { name: 'group promote', category: 'Group', description: 'Promote member to admin' },
  { name: 'group demote', category: 'Group', description: 'Demote admin to member' },
  { name: 'group tagall', category: 'Group', description: 'Tag all group members' },
  { name: 'group warn', category: 'Group', description: 'Warn a user' },
  { name: 'group lock', category: 'Group', description: 'Lock group (admins only)' },
  { name: 'group unlock', category: 'Group', description: 'Unlock group (everyone)' },
  
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
