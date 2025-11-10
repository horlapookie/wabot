import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

export default {
  name: 'xget',
  description: 'Download video from Xvideos link',
  async execute(msg, { sock, args }) {
    try {
      if (!args || args.length === 0) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Please provide a valid Xvideos link.\n\nExample: `$xget https://www.xvideos.com/video.uccemhm8148/title-here`'
        }, { quoted: msg });
      }

      const link = args[0];
      // Updated regex to allow 'video.' + alphanumeric or digits after 'video'
      if (!/^https:\/\/(www\.)?xvideos\.com\/video(\.|)\w+/i.test(link)) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Invalid Xvideos link format.'
        }, { quoted: msg });
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: '⏳ Fetching video page, please wait...'
      }, { quoted: msg });

      const res = await fetch(link);
      if (!res.ok) throw new Error('Failed to fetch video page.');

      const html = await res.text();
      const $ = cheerio.load(html);

      // Try getting video URL from <video> sources
      let videoUrl = $('video > source').attr('src') || $('#html5video_base source').attr('src');

      // If not found, parse scripts for setVideoUrlHigh or setVideoUrlLow (updated regex)
      if (!videoUrl) {
        const scripts = $('script').get();
        for (const script of scripts) {
          const scriptContent = $(script).html();
          if (!scriptContent) continue;

          // Clean regex to find setVideoUrlHigh or setVideoUrlLow without strange chars
          let match = scriptContent.match(/setVideoUrlHigh['"](.+?)['"]/);
          if (match && match[1]) {
            videoUrl = match[1];
            break;
          }

          match = scriptContent.match(/setVideoUrlLow['"](.+?)['"]/);
          if (match && match[1]) {
            videoUrl = match[1];
            break;
          }
        }
      }

      if (!videoUrl) {
        return await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Failed to extract video URL.'
        }, { quoted: msg });
      }

      const title = $('h2.page-title').text().trim() || 'xvideos_download';

      await sock.sendMessage(msg.key.remoteJid, {
        text: '⏳ Downloading video, please wait...'
      }, { quoted: msg });

      const fileRes = await fetch(videoUrl);
      if (!fileRes.ok) throw new Error('Failed to download video file.');

      const buffer = await fileRes.buffer();

      // Clean title for filename
      const cleanTitle = title.replace(/[^\w\s]/gi, '').slice(0, 30);
      const filename = path.join(tmpdir(), `${cleanTitle}.mp4`);

      await writeFile(filename, buffer);

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: filename },
        caption: `🔞 *${title}*\nDownloaded from: ${link}`
      }, { quoted: msg });

      // Optionally delete temp file after sending
      // import { unlink } from 'fs/promises';
      // await unlink(filename);

    } catch (err) {
      console.error('[xget] Error:', err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: '❌ Failed to download the video.'
      }, { quoted: msg });
    }
  }
};
