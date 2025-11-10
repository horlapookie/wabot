import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from '@whiskeysockets/baileys';

import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMAND_PREFIX = '$';
let OWNER_NUMBER = '2348028336218'; // Default fallback

const BANNED_FILE = path.join(__dirname, 'database/json/banned.json');
const MODERATORS_FILE = path.join(__dirname, 'database/json/moderators.json');
const CREDS_FILE = path.join(__dirname, 'auth_info/creds.json');

let botActive = true;

function getBotOwnerNumber() {
  try {
    if (fs.existsSync(CREDS_FILE)) {
      const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf-8'));
      if (creds.me && creds.me.id) {
        // Extract number from format "2347055517860:7@s.whatsapp.net"
        const number = creds.me.id.split(':')[0];
        console.log(`Bot owner number detected: ${number}`);
        return number;
      }
    }
  } catch (error) {
    console.error('Error reading bot owner from creds.json:', error.message);
  }
  return OWNER_NUMBER; // Return default if can't read
}

function loadModerators() {
  const mods = fs.existsSync(MODERATORS_FILE)
    ? JSON.parse(fs.readFileSync(MODERATORS_FILE))
    : [];
  
  // Auto-add bot owner to moderators if not present
  if (!mods.includes(OWNER_NUMBER)) {
    mods.push(OWNER_NUMBER);
    saveModerators(mods);
    console.log(`Auto-added bot owner ${OWNER_NUMBER} to moderators`);
  }
  
  return mods;
}

function saveModerators(mods) {
  fs.writeFileSync(MODERATORS_FILE, JSON.stringify(mods, null, 2));
}

function loadBanned() {
  return fs.existsSync(BANNED_FILE)
    ? JSON.parse(fs.readFileSync(BANNED_FILE))
    : {};
}

// Load commands dynamically
const commands = new Map();
const commandsDir = path.join(__dirname, 'horlapookie');
const commandFiles = fs
  .readdirSync(commandsDir)
  .filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const imported = await import(`file://${path.join(commandsDir, file)}`);
    
    // Handle default export
    const command = imported.default;
    if (command && command.name && typeof command.execute === 'function') {
      commands.set(command.name, command);
      console.log(`Loaded command: ${command.name}`);
    }
    
    // Handle named exports (for groups.js individual commands)
    for (const [key, value] of Object.entries(imported)) {
      if (key !== 'default' && value && value.name && typeof value.execute === 'function') {
        commands.set(value.name, value);
        console.log(`Loaded command: ${value.name}`);
      }
    }
  } catch (err) {
    console.error(`Failed to load command ${file}:`, err);
  }
}

async function startBot() {
  // Detect and set bot owner number from creds
  OWNER_NUMBER = getBotOwnerNumber();
  
  const sessionFolder = path.join(__dirname, 'auth_info');
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log('Reconnecting...');
        startBot();
      } else {
        console.log('Logged out. Please reauthenticate.');
      }
    } else if (connection === 'open') {
      console.log('Bot is online!');
    }
  });


  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages.length) return;
    const msg = messages[0];
    if (!msg.message) return;

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return; // Skip if no remoteJid
    
    const isGroup = remoteJid.endsWith('@g.us');
    const senderJid = isGroup ? msg.key.participant : remoteJid;
    
    // Skip if senderJid is null (status updates, etc.)
    if (!senderJid) return;
    
    const senderNumber = senderJid.split('@')[0];
    const banned = loadBanned();

    // Auto delete messages from banned users
    if (banned[senderNumber]) {
      try {
        await sock.sendMessage(remoteJid, {
          delete: {
            remoteJid,
            fromMe: false,
            id: msg.key.id,
            participant: senderJid,
          },
        });
      } catch {}
      return;
    }

    // Read message body
    let body = '';
    const messageType = Object.keys(msg.message)[0];
    if (messageType === 'conversation') body = msg.message.conversation;
    else if (messageType === 'extendedTextMessage') body = msg.message.extendedTextMessage.text;

    if (!body.startsWith(COMMAND_PREFIX)) return;

    const args = body.slice(COMMAND_PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    
    // Get message sender info for proper quoting
    const isFromMe = msg.key.fromMe;

    // Owner can toggle bot on/off with commands
    if (commandName === 'off' && senderNumber === OWNER_NUMBER) {
      botActive = false;
      await sock.sendMessage(remoteJid, { text: '❌ Bot deactivated by owner.' }, { quoted: msg });
      return;
    }

    if (commandName === 'on' && senderNumber === OWNER_NUMBER) {
      botActive = true;
      await sock.sendMessage(remoteJid, { text: '✅ Bot activated by owner.' }, { quoted: msg });
      return;
    }

    // If bot is off and sender is not owner, reply telling bot is off
    if (!botActive && senderNumber !== OWNER_NUMBER) {
      await sock.sendMessage(remoteJid, {
        text: '❌ Bot is currently off. Please contact the owner to activate.',
      }, { quoted: msg });
      return;
    }

    if (!commandName) {
      await sock.sendMessage(remoteJid, {
        text: `❓ Unknown command. Try \`${COMMAND_PREFIX}help\` or check available options.`,
      }, { quoted: msg });
      return;
    }

    const command = commands.get(commandName);
    if (!command) {
      await sock.sendMessage(remoteJid, {
        text: `❓ Unknown command: *${commandName}*. Try \`${COMMAND_PREFIX}help\`.`,
      }, { quoted: msg });
      return;
    }

    try {
      const moderators = loadModerators();
      await command.execute(msg, {
        sock,
        args,
        OWNER_NUMBER,
        moderators,
      });
    } catch (err) {
      console.error(`Error executing command ${commandName}:`, err);
      await sock.sendMessage(remoteJid, {
        text: `❌ Error executing command: ${err.message}`,
      }, { quoted: msg });
    }
  });

  console.log('Starting bot...');
}

startBot();
