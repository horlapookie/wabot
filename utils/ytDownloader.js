import axios from 'axios';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, '../temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export async function searchYouTube(query, type = 'video') {
  try {
    const { videos } = await yts(query);
    
    if (!videos || videos.length === 0) {
      return {
        success: false,
        error: 'No results found'
      };
    }

    const video = videos[0];
    
    return {
      success: true,
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail,
      duration: video.timestamp,
      views: video.views
    };
  } catch (error) {
    console.error('[YouTube Search Error]:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlink(filePath, () => {});
        downloadFile(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filePath, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      file.close();
      fs.unlink(filePath, () => {});
      reject(err);
    });
    
    request.setTimeout(60000, () => {
      request.destroy();
      file.close();
      fs.unlink(filePath, () => {});
      reject(new Error('Download timeout'));
    });
  });
}

export async function downloadAudio(url) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    console.log('[Audio] Using noobs-api for:', videoId);
    
    let downloadUrl = null;
    let videoTitle = 'audio';
    
    try {
      const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(videoId)}&format=mp3`;
      const response = await axios.get(apiURL, {
        timeout: 60000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300
      });
      
      if (response.data && response.data.downloadLink) {
        downloadUrl = response.data.downloadLink;
        videoTitle = response.data.title || videoTitle;
        console.log('[Audio] Got download link from noobs-api');
      } else {
        throw new Error('No download link from primary API');
      }
    } catch (primaryError) {
      console.log('[Audio] Primary API failed, trying fallback...');
      
      try {
        const fallbackURL = `https://api.agatz.xyz/api/ytmp3?url=https://youtube.com/watch?v=${videoId}`;
        const fallbackResponse = await axios.get(fallbackURL, { timeout: 45000 });
        
        if (fallbackResponse.data && fallbackResponse.data.data && fallbackResponse.data.data.download) {
          downloadUrl = fallbackResponse.data.data.download;
          videoTitle = fallbackResponse.data.data.title || videoTitle;
          console.log('[Audio] Got download link from fallback API');
        } else {
          throw new Error('No download link from fallback API');
        }
      } catch (fallbackError) {
        throw new Error('Both APIs failed: ' + fallbackError.message);
      }
    }

    if (!downloadUrl) {
      throw new Error('Failed to get download URL');
    }

    const title = videoTitle.replace(/[^\w\s]/gi, '').substring(0, 50);
    const fileName = `${title}_${Date.now()}.mp3`;
    const filePath = path.join(TEMP_DIR, fileName);

    console.log('[Audio] Downloading from:', downloadUrl);
    await downloadFile(downloadUrl, filePath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1024) {
      throw new Error('Downloaded file is invalid or too small');
    }

    return {
      success: true,
      path: filePath,
      title: videoTitle,
      duration: null
    };
  } catch (error) {
    console.error('[Audio Download Error]:', error);
    return {
      success: false,
      error: error.message || 'Download failed'
    };
  }
}

export async function downloadVideo(url) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    console.log('[Video] Using noobs-api for:', videoId);
    
    let downloadUrl = null;
    let videoTitle = 'video';
    
    try {
      const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(videoId)}&format=mp4`;
      const response = await axios.get(apiURL, {
        timeout: 60000,
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 300
      });
      
      if (response.data && response.data.downloadLink) {
        downloadUrl = response.data.downloadLink;
        videoTitle = response.data.title || videoTitle;
        console.log('[Video] Got download link from noobs-api');
      } else {
        throw new Error('No download link from primary API');
      }
    } catch (primaryError) {
      console.log('[Video] Primary API failed, trying fallback...');
      
      try {
        const fallbackURL = `https://api.agatz.xyz/api/ytmp4?url=https://youtube.com/watch?v=${videoId}`;
        const fallbackResponse = await axios.get(fallbackURL, { timeout: 45000 });
        
        if (fallbackResponse.data && fallbackResponse.data.data && fallbackResponse.data.data.download) {
          downloadUrl = fallbackResponse.data.data.download;
          videoTitle = fallbackResponse.data.data.title || videoTitle;
          console.log('[Video] Got download link from fallback API');
        } else {
          throw new Error('No download link from fallback API');
        }
      } catch (fallbackError) {
        throw new Error('Both APIs failed: ' + fallbackError.message);
      }
    }

    if (!downloadUrl) {
      throw new Error('Failed to get download URL');
    }

    const title = videoTitle.replace(/[^\w\s]/gi, '').substring(0, 50);
    const fileName = `${title}_${Date.now()}.mp4`;
    const filePath = path.join(TEMP_DIR, fileName);

    console.log('[Video] Downloading from:', downloadUrl);
    await downloadFile(downloadUrl, filePath);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1024) {
      throw new Error('Downloaded file is invalid or too small');
    }

    return {
      success: true,
      path: filePath,
      title: videoTitle,
      duration: null
    };
  } catch (error) {
    console.error('[Video Download Error]:', error);
    return {
      success: false,
      error: error.message || 'Download failed'
    };
  }
}

export function cleanupTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[Cleanup] Deleted: ${filePath}`);
    }
  } catch (error) {
    console.error('[Cleanup Error]:', error.message);
  }
}

export function extractVideoId(url) {
  try {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}
