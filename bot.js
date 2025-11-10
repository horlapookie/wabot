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
const OWNER_NUMBER = '2348028336218';

const MODS_FILE = path.join(__dirname, 'moderators.json');
const BANNED_FILE = path.join(__dirname, 'banned.json');
const WELCOME_CONFIG_FILE = path.join(__dirname, 'welcomeConfig.json');

let botActive = true;

let moderators = fs.existsSync(MODS_FILE)
  ? JSON.parse(fs.readFileSync(MODS_FILE))
  : [];

function saveModerators() {
  fs.writeFileSync(MODS_FILE, JSON.stringify(moderators, null, 2));
}

function loadBanned() {
  return fs.existsSync(BANNED_FILE)
    ? JSON.parse(fs.readFileSync(BANNED_FILE))
    : {};
}

let welcomeConfig = fs.existsSync(WELCOME_CONFIG_FILE)
  ? JSON.parse(fs.readFileSync(WELCOME_CONFIG_FILE))
  : {};

function saveWelcomeConfig() {
  fs.writeFileSync(WELCOME_CONFIG_FILE, JSON.stringify(welcomeConfig, null, 2));
}

// Load commands dynamically
const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsDir)
  .filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const imported = await import(`file://${path.join(commandsDir, file)}`);
    const command = imported.default;
    if (command && command.name && typeof command.execute === 'function') {
      commands.set(command.name, command);
      console.log(`Loaded command: ${command.name}`);
    } else {
      console.log(`Skipping file (invalid command structure): ${file}`);
    }
  } catch (err) {
    console.error(`Failed to load command ${file}:`, err);
  }
}

async function startBot() {
  const sessionFolder = path.join(__dirname, 'Success');
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: !fs.existsSync(path.join(sessionFolder, 'creds.json')),
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

  // Welcome and goodbye messages
  sock.ev.on('group-participants.update', async (update) => {
    try {
      const groupId = update.id;
      if (!welcomeConfig[groupId]?.enabled) return;

      for (const participant of update.participants) {
        const contactId = participant.split('@')[0];
        let text = '';

        if (update.action === 'add') {
          const welcomeMsg = welcomeConfig[groupId].welcomeMessage || 'Welcome @user 🎉';
          text = welcomeMsg.replace(/@user/g, `@${contactId}`);
        } else if (update.action === 'remove') {
          const goodbyeMsg = welcomeConfig[groupId].goodbyeMessage || 'Goodbye @user 😢';
          text = goodbyeMsg.replace(/@user/g, `@${contactId}`);
        }

        if (text) {
          await sock.sendMessage(groupId, {
            text,
            mentions: [participant],
          });
        }
      }
    } catch (e) {
      console.error('Error handling group participants update:', e);
    }
  });

  // Helper function to announce bot ON status in all groups
  async function announceBotOn() {
    try {
      // Fetch all chats
      const allChats = await sock.groupFetchAllParticipating();
      for (const groupId in allChats) {
        try {
          const group = allChats[groupId];
          const participants = group.participants.map(p => p.id);
          // Compose mention text tagging all participants
          const mentionText = participants.map(p => `@${p.split('@')[0]}`).join(' ');
          await sock.sendMessage(groupId, {
            text: `✅ Bot has been activated and is now online!\n${mentionText}`,
            mentions: participants,
          });
        } catch (e) {
          console.error(`Failed to announce in group ${groupId}:`, e);
        }
      }
    } catch (e) {
      console.error('Failed to fetch groups for announcement:', e);
    }
  }

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !messages.length) return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const senderJid = isGroup ? msg.key.participant : remoteJid;
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

    // Owner can toggle bot on/off with commands
    if (commandName === 'off' && senderNumber === OWNER_NUMBER) {
      botActive = false;
      await sock.sendMessage(remoteJid, { text: '❌ Bot deactivated by owner.' }, { quoted: msg });
      return;
    }

    if (commandName === 'on' && senderNumber === OWNER_NUMBER) {
      botActive = true;
      await sock.sendMessage(remoteJid, { text: '✅ Bot activated by owner.' }, { quoted: msg });
      // Announce in all groups
      await announceBotOn();
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
      await command.execute(msg, {
        sock,
        args,
        moderators,
        saveModerators,
        OWNER_NUMBER,
        welcomeConfig,
        saveWelcomeConfig,
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
