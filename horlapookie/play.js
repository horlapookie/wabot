import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { getEmojis } from '../lib/emojis.js';
import { extractVideoId, downloadMusicAPI, downloadWithYtdl } from '../lib/mediaHelper.js';

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
            } else {
                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: `${emojis.error} No songs found for your search query!`
                    }, { quoted: msg });
                }
                videoUrl = videos[0].url;
                songTitle = videos[0].title || searchQuery;
            }

            try {
                const ytId = extractVideoId(videoUrl);
                const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : undefined;
                const displayTitle = songTitle || searchQuery || 'Song';

                if (thumbUrl) {
                    await sock.sendMessage(chatId, {
                        image: { url: thumbUrl },
                        caption: `${emojis.music} *${displayTitle}*\n\n${emojis.processing} Processing your music request...`
                    }, { quoted: msg });
                }
            } catch (e) {
                console.error('[PLAY] Error sending preview:', e?.message || e);
            }

            let musicResult;
            try {
                console.log('[PLAY] Attempting music API...');
                musicResult = await downloadMusicAPI(videoUrl);

                if (!musicResult.status) {
                    throw new Error('Music API failed');
                }
                console.log('[PLAY] Music API success');
            } catch (apiErr) {
                console.error(`[PLAY] Music API failed:`, apiErr?.message || apiErr);

                try {
                    console.log('[PLAY] Trying ytdl-core fallback...');
                    const tempDir = path.join(__dirname, '../temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                    const tempFile = path.join(tempDir, `${Date.now()}.mp3`);

                    const stream = await downloadWithYtdl(videoUrl, true);
                    
                    await new Promise(async (resolve, reject) => {
                        const ffmpeg = (await import('fluent-ffmpeg')).default;
                        ffmpeg(stream)
                            .audioBitrate(128)
                            .toFormat('mp3')
                            .save(tempFile)
                            .on('end', resolve)
                            .on('error', reject);
                    });

                    await sock.sendMessage(chatId, {
                        audio: { url: tempFile },
                        mimetype: "audio/mpeg",
                        fileName: `${songTitle || 'audio'}.mp3`
                    }, { quoted: msg });

                    setTimeout(() => {
                        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
                    }, 2000);

                    await sock.sendMessage(chatId, {
                        react: { text: emojis.success, key: msg.key }
                    });

                    return;
                } catch (fbErr) {
                    console.error('[PLAY] ytdl-core fallback failed:', fbErr?.message || fbErr);
                    return await sock.sendMessage(chatId, {
                        text: `${emojis.error} All download methods failed. Please try again later.`
                    }, { quoted: msg });
                }
            }

            if (musicResult && musicResult.status && musicResult.result?.download) {
                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                const tempFile = path.join(tempDir, `${Date.now()}_raw.mp3`);
                const convertedFile = path.join(tempDir, `${Date.now()}_converted.mp3`);

                const response = await axios({
                    url: musicResult.result.download,
                    method: 'GET',
                    responseType: 'stream',
                    timeout: 60000,
                    maxRedirects: 5
                });

                await new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(tempFile);
                    response.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size < 1024) {
                    throw new Error('Downloaded file is invalid or too small');
                }

                let finalFile = tempFile;
                try {
                    const ffmpeg = (await import('fluent-ffmpeg')).default;
                    await new Promise((resolve, reject) => {
                        ffmpeg(tempFile)
                            .audioCodec('libmp3lame')
                            .audioBitrate(128)
                            .audioChannels(2)
                            .audioFrequency(44100)
                            .toFormat('mp3')
                            .save(convertedFile)
                            .on('end', resolve)
                            .on('error', (err) => {
                                console.warn('[PLAY] Conversion failed, using original file');
                                resolve();
                            });
                    });
                    if (fs.existsSync(convertedFile)) {
                        finalFile = convertedFile;
                    }
                } catch (convErr) {
                    console.warn('[PLAY] Conversion error:', convErr?.message || convErr);
                }

                await sock.sendMessage(chatId, {
                    audio: { url: finalFile },
                    mimetype: 'audio/mpeg',
                    fileName: `${musicResult.result.title || songTitle || 'audio'}.mp3`
                }, { quoted: msg });

                await sock.sendMessage(chatId, {
                    react: { text: emojis.success, key: msg.key }
                });

                setTimeout(() => {
                    try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
                    try { if (fs.existsSync(convertedFile)) fs.unlinkSync(convertedFile); } catch {}
                }, 2000);
            }
        } catch (error) {
            console.error('[PLAY] Error:', error);
            await sock.sendMessage(chatId, {
                text: `${emojis.error} An error occurred while processing your request. Please try again later.`
            }, { quoted: msg });
        }
    }
};
