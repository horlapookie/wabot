import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { getEmojis } from '../lib/emojis.js';
import { extractVideoId, downloadVideoAPI, downloadWithYtdl } from '../lib/mediaHelper.js';

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
            } else {
                const { videos } = await yts(searchQuery);
                if (!videos || videos.length === 0) {
                    return await sock.sendMessage(chatId, {
                        text: `${emojis.error} No videos found for your search query!`
                    }, { quoted: msg });
                }
                videoUrl = videos[0].url;
                videoTitle = videos[0].title || searchQuery;
            }

            try {
                const ytId = extractVideoId(videoUrl);
                const thumbUrl = ytId ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg` : undefined;
                const displayTitle = videoTitle || searchQuery || 'Video';

                if (thumbUrl) {
                    await sock.sendMessage(chatId, {
                        image: { url: thumbUrl },
                        caption: `${emojis.video} *${displayTitle}*\n\n${emojis.processing} Processing your video request...`
                    }, { quoted: msg });
                }
            } catch (e) {
                console.error('[VIDEO] Error sending preview:', e?.message || e);
            }

            let videoResult;
            try {
                console.log('[VIDEO] Attempting video API...');
                videoResult = await downloadVideoAPI(videoUrl);

                if (!videoResult.status) {
                    throw new Error('Video API failed');
                }
                console.log('[VIDEO] Video API success');
            } catch (apiErr) {
                console.error(`[VIDEO] Video API failed:`, apiErr?.message || apiErr);

                try {
                    console.log('[VIDEO] Trying ytdl-core fallback...');
                    const tempDir = path.join(__dirname, '../temp');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                    const tempFile = path.join(tempDir, `${Date.now()}.mp4`);

                    const stream = await downloadWithYtdl(videoUrl, false);
                    
                    await new Promise(async (resolve, reject) => {
                        const ffmpeg = (await import('fluent-ffmpeg')).default;
                        ffmpeg(stream)
                            .videoBitrate(1024)
                            .toFormat('mp4')
                            .save(tempFile)
                            .on('end', resolve)
                            .on('error', reject);
                    });

                    await sock.sendMessage(chatId, {
                        video: { url: tempFile },
                        mimetype: "video/mp4",
                        caption: `${emojis.video} *${videoTitle || 'Video'}*`
                    }, { quoted: msg });

                    setTimeout(() => {
                        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
                    }, 2000);

                    await sock.sendMessage(chatId, {
                        react: { text: emojis.success, key: msg.key }
                    });

                    return;
                } catch (fbErr) {
                    console.error('[VIDEO] ytdl-core fallback failed:', fbErr?.message || fbErr);
                    return await sock.sendMessage(chatId, {
                        text: `${emojis.error} All download methods failed. Please try again later.`
                    }, { quoted: msg });
                }
            }

            if (videoResult && videoResult.status && videoResult.result?.download) {
                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
                const tempFile = path.join(tempDir, `${Date.now()}_video.mp4`);

                const response = await axios({
                    url: videoResult.result.download,
                    method: 'GET',
                    responseType: 'stream',
                    timeout: 120000,
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

                await sock.sendMessage(chatId, {
                    video: { url: tempFile },
                    mimetype: 'video/mp4',
                    caption: `${emojis.video} *${videoResult.result.title || videoTitle || 'Video'}*`
                }, { quoted: msg });

                await sock.sendMessage(chatId, {
                    react: { text: emojis.success, key: msg.key }
                });

                setTimeout(() => {
                    try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
                }, 2000);
            }
        } catch (error) {
            console.error('[VIDEO] Error:', error);
            await sock.sendMessage(chatId, {
                text: `${emojis.error} An error occurred while processing your request. Please try again later.`
            }, { quoted: msg });
        }
    }
};
