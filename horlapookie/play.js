import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEmojis } from '../lib/emojis.js';
import { extractVideoId } from '../lib/mediaHelper.js';
import { downloadAudio, cleanupTempFile } from '../utils/ytDownloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emojis = getEmojis();

export default {
    name: 'play',
    description: 'Download and send music from YouTube as audio',
    aliases: ['song', 'music'],
    category: 'Media',
    async execute(msg, { sock, args }) {
        const chatId = msg.key.remoteJid;

        try {
            await sock.sendMessage(chatId, {
                react: { text: emojis.processing, key: msg.key }
            });

            const searchQuery = args.join(' ').trim();

            if (!searchQuery) {
                return await sock.sendMessage(chatId, {
                    text: `${emojis.error} *Music Player*\n\nWhat song would you like to download?\n\nExample: \`$play Shape of You\``
                }, { quoted: msg });
            }

            let videoUrl = '';
            let songTitle = '';

            if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
                videoUrl = searchQuery;
                songTitle = 'Song';
            } else {
                await sock.sendMessage(chatId, {
                    text: `${emojis.search} Searching for: *${searchQuery}*...`
                }, { quoted: msg });

                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: `${emojis.error} No songs found for your search query!`
                    }, { quoted: msg });
                }
                videoUrl = videos[0].url;
                songTitle = videos[0].title || searchQuery;
            }

            const ytId = extractVideoId(videoUrl);
            const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : undefined;

            if (thumbUrl) {
                await sock.sendMessage(chatId, {
                    image: { url: thumbUrl },
                    caption: `${emojis.music} *${songTitle}*\n\n${emojis.download} Downloading audio...`
                }, { quoted: msg });
            }

            console.log('[PLAY] Downloading with ytDownloader:', videoUrl);

            const downloadResult = await downloadAudio(videoUrl);

            if (!downloadResult.success) {
                throw new Error(downloadResult.error || 'Download failed');
            }

            if (!fs.existsSync(downloadResult.path)) {
                throw new Error('Downloaded file not found');
            }

            await sock.sendMessage(chatId, {
                audio: { url: downloadResult.path },
                mimetype: "audio/mpeg",
                fileName: `${downloadResult.title || songTitle}.mp3`,
                ptt: false
            }, { quoted: msg });

            await sock.sendMessage(chatId, {
                react: { text: emojis.success, key: msg.key }
            });

            setTimeout(() => {
                cleanupTempFile(downloadResult.path);
            }, 5000);

        } catch (error) {
            console.error('[PLAY] Error:', error);
            await sock.sendMessage(chatId, {
                react: { text: emojis.error, key: msg.key }
            });
            await sock.sendMessage(chatId, {
                text: `${emojis.error} Failed to download audio: ${error.message}\n\nPlease try again or use a different song.`
            }, { quoted: msg });
        }
    }
};