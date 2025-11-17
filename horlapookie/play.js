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
                try {
                    const info = await ytdl.getInfo(videoUrl);
                    songTitle = info.videoDetails.title;
                } catch (e) {
                    songTitle = 'Song';
                }
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

            console.log('[PLAY] Downloading with ytdl-core:', videoUrl);
            
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const tempFile = path.join(tempDir, `${Date.now()}.mp3`);

            const ytdlOptions = {
                requestOptions: {
                    headers: {
                        'cookie': 'VISITOR_INFO1_LIVE=; PREF=f1=50000000&tz=UTC; YSC=',
                        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'accept-language': 'en-US,en;q=0.9'
                    }
                }
            };

            const info = await ytdl.getInfo(videoUrl, ytdlOptions);
            const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
            
            if (!audioFormats.length) {
                throw new Error('No audio formats available');
            }

            await new Promise(async (resolve, reject) => {
                const ffmpeg = (await import('fluent-ffmpeg')).default;
                
                const stream = ytdl(videoUrl, {
                    quality: 'highestaudio',
                    filter: 'audioonly',
                    ...ytdlOptions
                });

                ffmpeg(stream)
                    .audioBitrate(128)
                    .audioCodec('libmp3lame')
                    .toFormat('mp3')
                    .on('error', (err) => {
                        console.error('[PLAY] FFmpeg error:', err);
                        reject(err);
                    })
                    .on('end', () => {
                        console.log('[PLAY] Conversion completed');
                        resolve();
                    })
                    .save(tempFile);
            });

            if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size < 1024) {
                throw new Error('Downloaded file is invalid or too small');
            }

            await sock.sendMessage(chatId, {
                audio: { url: tempFile },
                mimetype: "audio/mpeg",
                fileName: `${songTitle}.mp3`,
                ptt: false
            }, { quoted: msg });

            await sock.sendMessage(chatId, {
                react: { text: emojis.success, key: msg.key }
            });

            setTimeout(() => {
                try {
                    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                } catch (e) {
                    console.error('[PLAY] Cleanup error:', e);
                }
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
