
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDS_FILE = path.join(__dirname, 'auth_info/creds.json');
const SESSION_ID_FILE = path.join(__dirname, 'session-id');

/**
 * Load session from session-id file before bot starts
 * Reads base64 session, decodes it, and writes to creds.json
 */
export function loadSessionFromFile() {
  // Check if session-id file exists
  if (!fs.existsSync(SESSION_ID_FILE)) {
    console.log('⚠️ No session-id file found. Bot will use existing auth or generate QR.');
    return false;
  }

  try {
    // Read the base64 session from session-id file
    const base64Session = fs.readFileSync(SESSION_ID_FILE, 'utf-8').trim();
    
    if (!base64Session) {
      console.log('⚠️ session-id file is empty.');
      return false;
    }

    console.log('📂 Found session-id file. Loading session...');
    
    // Decode the base64 string
    const decodedSession = Buffer.from(base64Session, 'base64').toString('utf-8');
    
    // Parse JSON to validate it
    const sessionData = JSON.parse(decodedSession);
    
    // Ensure auth_info directory exists
    const authDir = path.join(__dirname, 'auth_info');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    // Write to creds.json
    fs.writeFileSync(CREDS_FILE, JSON.stringify(sessionData, null, 2));
    
    console.log('✅ Session loaded successfully from session-id file!');
    console.log('🔄 Bot will now connect using the imported session...');
    
    // Delete session-id file after successful import
    fs.unlinkSync(SESSION_ID_FILE);
    console.log('🗑️ session-id file deleted after successful import.');
    
    return true;
  } catch (error) {
    console.error('❌ Error loading session from session-id file:', error.message);
    console.error('💡 Make sure the session-id file contains valid base64 encoded session data.');
    return false;
  }
}

/**
 * Export current session as base64
 */
export function exportSessionAsBase64() {
  try {
    if (!fs.existsSync(CREDS_FILE)) {
      console.error('❌ creds.json not found!');
      return null;
    }
    
    const sessionData = fs.readFileSync(CREDS_FILE, 'utf-8');
    const base64Session = Buffer.from(sessionData).toString('base64');
    
    console.log('✅ Session exported as base64');
    return base64Session;
  } catch (error) {
    console.error('❌ Error exporting session:', error.message);
    return null;
  }
}
