import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ytdl from '@distube/ytdl-core';
import { getEmojis } from '../lib/emojis.js';
import { extractVideoId } from '../lib/mediaHelper.js';

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
                try {
                    const info = await ytdl.getInfo(videoUrl);
                    videoTitle = info.videoDetails.title;
                } catch (e) {
                    videoTitle = 'Video';
                }
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

            console.log('[VIDEO] Downloading with ytdl-core:', videoUrl);
            
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const tempFile = path.join(tempDir, `${Date.now()}.mp4`);

            const info = await ytdl.getInfo(videoUrl);
            const formats = ytdl.filterFormats(info.formats, 'audioandvideo');
            
            if (!formats.length) {
                throw new Error('No video formats available');
            }

            await new Promise(async (resolve, reject) => {
                const ffmpeg = (await import('fluent-ffmpeg')).default;
                
                const stream = ytdl(videoUrl, {
                    quality: 'highest',
                    filter: format => format.container === 'mp4'
                });

                ffmpeg(stream)
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .format('mp4')
                    .outputOptions([
                        '-preset fast',
                        '-crf 28'
                    ])
                    .on('error', (err) => {
                        console.error('[VIDEO] FFmpeg error:', err);
                        reject(err);
                    })
                    .on('end', () => {
                        console.log('[VIDEO] Conversion completed');
                        resolve();
                    })
                    .save(tempFile);
            });

            if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size < 1024) {
                throw new Error('Downloaded file is invalid or too small');
            }

            await sock.sendMessage(chatId, {
                video: { url: tempFile },
                mimetype: "video/mp4",
                caption: `${emojis.video} *${videoTitle}*`
            }, { quoted: msg });

            await sock.sendMessage(chatId, {
                react: { text: emojis.success, key: msg.key }
            });

            setTimeout(() => {
                try {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                } catch (e) {
                    console.error('[VIDEO] Cleanup error:', e);
                }
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
