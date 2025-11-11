import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emojisPath = path.join(__dirname, '../data/emojis.json');
let cachedEmojis = null;

export function getEmojis() {
    if (!cachedEmojis) {
        cachedEmojis = JSON.parse(fs.readFileSync(emojisPath, 'utf8'));
    }
    return cachedEmojis;
}
