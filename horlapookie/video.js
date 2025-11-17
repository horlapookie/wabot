import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEmojis } from '../lib/emojis.js';
import { extractVideoId } from '../lib/mediaHelper.js';
import { downloadVideo, cleanupTempFile } from '../utils/ytDownloader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emojis = getEmojis();

export default {
    name: 'video',
    description: 'Download and send videos from YouTube',
    aliases: ['vid', 'mp4', 'ytv'],
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
                    text: `${emojis.error} *Video Downloader*\n\nWhat video would you like to download?\n\nExample: \`$video Shape of You\``
                }, { quoted: msg });
            }

            let videoUrl = '';
            let videoTitle = '';

            if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
                videoUrl = searchQuery;
                videoTitle = 'Video';
            } else {
                await sock.sendMessage(chatId, {
                    text: `${emojis.search} Searching for: *${searchQuery}*...`
                }, { quoted: msg });

                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: `${emojis.error} No videos found for your search query!`
                    }, { quoted: msg });
                }
                videoUrl = videos[0].url;
                videoTitle = videos[0].title || searchQuery;
            }

            const ytId = extractVideoId(videoUrl);
            const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : undefined;

            if (thumbUrl) {
                await sock.sendMessage(chatId, {
                    image: { url: thumbUrl },
                    caption: `${emojis.video} *${videoTitle}*\n\n${emojis.download} Downloading video...`
                }, { quoted: msg });
            }

            console.log('[VIDEO] Downloading with ytDownloader:', videoUrl);

            const downloadResult = await downloadVideo(videoUrl);

            if (!downloadResult.success) {
                throw new Error(downloadResult.error || 'Download failed');
            }

            if (!fs.existsSync(downloadResult.path)) {
                throw new Error('Downloaded file not found');
            }

            await sock.sendMessage(chatId, {
                video: { url: downloadResult.path },
                mimetype: "video/mp4",
                caption: `${emojis.video} *${downloadResult.title || videoTitle}*`
            }, { quoted: msg });

            await sock.sendMessage(chatId, {
                react: { text: emojis.success, key: msg.key }
            });

            setTimeout(() => {
                cleanupTempFile(downloadResult.path);
            }, 5000);

        } catch (error) {
            console.error('[VIDEO] Error:', error);
            await sock.sendMessage(chatId, {
                react: { text: emojis.error, key: msg.key }
            });
            await sock.sendMessage(chatId, {
                text: `${emojis.error} Failed to download video: ${error.message}\n\nPlease try again or use a different video.`
            }, { quoted: msg });
        }
    }
};