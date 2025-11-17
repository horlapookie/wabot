
import { searchYouTube, downloadAudio, downloadVideo, cleanupTempFile } from '../utils/ytDownloader.js';
import fs from 'fs';

export const music = {
  name: 'music',
  description: 'Search and play music from YouTube',
  async execute(msg, { sock, args }) {
    const chatId = msg.key.remoteJid;
    
    if (!args || args.length === 0) {
      await sock.sendMessage(chatId, {
        text: '❌ Please provide a song name\nExample: $music seyi vibez'
      }, { quoted: msg });
      return;
    }

    const query = args.join(' ');
    
    await sock.sendMessage(chatId, {
      text: `🔍 Searching for: ${query}...`
    }, { quoted: msg });

    const searchResult = await searchYouTube(query, 'music');
    
    if (!searchResult.success) {
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${searchResult.error}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(chatId, {
      text: `🎵 Found: ${searchResult.title}\n📥 Downloading audio...`
    }, { quoted: msg });

    const downloadResult = await downloadAudio(searchResult.url);
    
    if (!downloadResult.success) {
      await sock.sendMessage(chatId, {
        text: `❌ Download failed: ${downloadResult.error}`
      }, { quoted: msg });
      return;
    }

    try {
      if (!fs.existsSync(downloadResult.path)) {
        throw new Error('Downloaded file not found');
      }

      const audioBuffer = fs.readFileSync(downloadResult.path);
      
      await sock.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${downloadResult.title}.mp3`,
        ptt: false
      }, { quoted: msg });

      cleanupTempFile(downloadResult.path);
      
      await sock.sendMessage(chatId, {
        text: `✅ Successfully sent: ${downloadResult.title}`
      }, { quoted: msg });
    } catch (error) {
      cleanupTempFile(downloadResult.path);
      await sock.sendMessage(chatId, {
        text: `❌ Error sending audio: ${error.message}`
      }, { quoted: msg });
    }
  }
};

export const video = {
  name: 'video',
  description: 'Search and download video from YouTube',
  async execute(msg, { sock, args }) {
    const chatId = msg.key.remoteJid;
    
    if (!args || args.length === 0) {
      await sock.sendMessage(chatId, {
        text: '❌ Please provide a video name\nExample: $video seyi vibez'
      }, { quoted: msg });
      return;
    }

    const query = args.join(' ');
    
    await sock.sendMessage(chatId, {
      text: `🔍 Searching for: ${query}...`
    }, { quoted: msg });

    const searchResult = await searchYouTube(query, 'video');
    
    if (!searchResult.success) {
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${searchResult.error}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(chatId, {
      text: `🎬 Found: ${searchResult.title}\n📥 Downloading video...`
    }, { quoted: msg });

    const downloadResult = await downloadVideo(searchResult.url);
    
    if (!downloadResult.success) {
      await sock.sendMessage(chatId, {
        text: `❌ Download failed: ${downloadResult.error}`
      }, { quoted: msg });
      return;
    }

    try {
      if (!fs.existsSync(downloadResult.path)) {
        throw new Error('Downloaded file not found');
      }

      const videoBuffer = fs.readFileSync(downloadResult.path);
      
      await sock.sendMessage(chatId, {
        video: videoBuffer,
        mimetype: 'video/mp4',
        caption: `🎬 ${downloadResult.title}`
      }, { quoted: msg });

      cleanupTempFile(downloadResult.path);
    } catch (error) {
      cleanupTempFile(downloadResult.path);
      await sock.sendMessage(chatId, {
        text: `❌ Error sending video: ${error.message}`
      }, { quoted: msg });
    }
  }
};

export const audio = {
  name: 'audio',
  description: 'Download and send audio as a file from YouTube',
  async execute(msg, { sock, args }) {
    const chatId = msg.key.remoteJid;
    
    if (!args || args.length === 0) {
      await sock.sendMessage(chatId, {
        text: '❌ Please provide a song name\nExample: $audio seyi vibez'
      }, { quoted: msg });
      return;
    }

    const query = args.join(' ');
    
    await sock.sendMessage(chatId, {
      text: `🔍 Searching for: ${query}...`
    }, { quoted: msg });

    const searchResult = await searchYouTube(query, 'audio');
    
    if (!searchResult.success) {
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${searchResult.error}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(chatId, {
      text: `🎵 Found: ${searchResult.title}\n📥 Downloading audio file...`
    }, { quoted: msg });

    const downloadResult = await downloadAudio(searchResult.url);
    
    if (!downloadResult.success) {
      await sock.sendMessage(chatId, {
        text: `❌ Download failed: ${downloadResult.error}`
      }, { quoted: msg });
      return;
    }

    try {
      if (!fs.existsSync(downloadResult.path)) {
        throw new Error('Downloaded file not found');
      }

      const audioBuffer = fs.readFileSync(downloadResult.path);
      
      await sock.sendMessage(chatId, {
        document: audioBuffer,
        mimetype: 'audio/mpeg',
        fileName: `${downloadResult.title}.mp3`
      }, { quoted: msg });

      cleanupTempFile(downloadResult.path);
      
      await sock.sendMessage(chatId, {
        text: `✅ Successfully sent audio file: ${downloadResult.title}`
      }, { quoted: msg });
    } catch (error) {
      cleanupTempFile(downloadResult.path);
      await sock.sendMessage(chatId, {
        text: `❌ Error sending audio file: ${error.message}`
      }, { quoted: msg });
    }
  }
};

export const videofile = {
  name: 'videofile',
  description: 'Download and send video as a file from YouTube',
  async execute(msg, { sock, args }) {
    const chatId = msg.key.remoteJid;
    
    if (!args || args.length === 0) {
      await sock.sendMessage(chatId, {
        text: '❌ Please provide a video name\nExample: $videofile seyi vibez'
      }, { quoted: msg });
      return;
    }

    const query = args.join(' ');
    
    await sock.sendMessage(chatId, {
      text: `🔍 Searching for: ${query}...`
    }, { quoted: msg });

    const searchResult = await searchYouTube(query, 'video');
    
    if (!searchResult.success) {
      await sock.sendMessage(chatId, {
        text: `❌ Error: ${searchResult.error}`
      }, { quoted: msg });
      return;
    }

    await sock.sendMessage(chatId, {
      text: `🎬 Found: ${searchResult.title}\n📥 Downloading video file...`
    }, { quoted: msg });

    const downloadResult = await downloadVideo(searchResult.url);
    
    if (!downloadResult.success) {
      await sock.sendMessage(chatId, {
        text: `❌ Download failed: ${downloadResult.error}`
      }, { quoted: msg });
      return;
    }

    try {
      if (!fs.existsSync(downloadResult.path)) {
        throw new Error('Downloaded file not found');
      }

      const videoBuffer = fs.readFileSync(downloadResult.path);
      
      await sock.sendMessage(chatId, {
        document: videoBuffer,
        mimetype: 'video/mp4',
        fileName: `${downloadResult.title}.mp4`
      }, { quoted: msg });

      cleanupTempFile(downloadResult.path);
      
      await sock.sendMessage(chatId, {
        text: `✅ Successfully sent video file: ${downloadResult.title}`
      }, { quoted: msg });
    } catch (error) {
      cleanupTempFile(downloadResult.path);
      await sock.sendMessage(chatId, {
        text: `❌ Error sending video file: ${error.message}`
      }, { quoted: msg });
    }
  }
};
