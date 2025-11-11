import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANTILINK_FILE = path.join(__dirname, '../database/json/antilink.json');

function ensureFile() {
    if (!fs.existsSync(ANTILINK_FILE)) {
        fs.writeFileSync(ANTILINK_FILE, JSON.stringify({}, null, 2));
    }
}

export function setAntilinkSetting(chatId, action) {
    ensureFile();
    const data = JSON.parse(fs.readFileSync(ANTILINK_FILE, 'utf-8'));
    data[chatId] = action;
    fs.writeFileSync(ANTILINK_FILE, JSON.stringify(data, null, 2));
}

export function getAntilinkSetting(chatId) {
    ensureFile();
    const data = JSON.parse(fs.readFileSync(ANTILINK_FILE, 'utf-8'));
    return data[chatId] || 'off';
}

export function removeAntilinkSetting(chatId) {
    ensureFile();
    const data = JSON.parse(fs.readFileSync(ANTILINK_FILE, 'utf-8'));
    delete data[chatId];
    fs.writeFileSync(ANTILINK_FILE, JSON.stringify(data, null, 2));
}
