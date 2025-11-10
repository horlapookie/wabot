import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

export async function searchXvideos(query) {
  try {
    const searchUrl = `https://www.xvideos.com/?k=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl);
    if (!res.ok) {
      throw new Error('Failed to fetch results from Xvideos.');
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const results = [];

    async function fetchAlternateLink(videoPageUrl, originalHref) {
      try {
        const res = await fetch(videoPageUrl);
        if (!res.ok) return null;
        const html = await res.text();
        const $ = cheerio.load(html);

        let altLink = null;
        const canonical = $('link[rel="canonical"]').attr('href');
        if (canonical && canonical !== videoPageUrl) {
          altLink = canonical;
        }

        if (!altLink) {
          const ogUrl = $('meta[property="og:url"]').attr('content');
          if (ogUrl && ogUrl !== videoPageUrl) altLink = ogUrl;
        }

        return altLink;
      } catch {
        return null;
      }
    }

    const thumbBlocks = $('.mozaique .thumb-block').slice(0, 10);

    for (let i = 0; i < thumbBlocks.length; i++) {
      const el = thumbBlocks[i];
      const title = $(el).find('p.title a').text().trim();
      const href = $(el).find('p.title a').attr('href');
      if (!title || !href) continue;

      const mainLink = `https://www.xvideos.com${href}`;
      const altLink = await fetchAlternateLink(mainLink, href);

      let numLink = null;
      let dotLink = null;

      const numMatch = href.match(/^\/video(\d+)\/.+$/i);
      const dotMatch = href.match(/^\/video\.([a-z0-9]+)\/.+$/i);

      if (numMatch) {
        numLink = mainLink;
        if (altLink && altLink !== mainLink) dotLink = altLink;
      } else if (dotMatch) {
        dotLink = mainLink;
        if (altLink && altLink !== mainLink) numLink = altLink;
      } else {
        numLink = mainLink;
      }

      let text = `*${i + 1}.* ${title}\n`;
      if (numLink) text += `${numLink}\n`;
      if (dotLink) text += `${dotLink}\n`;

      results.push(text.trim());
    }

    return results;
  } catch (err) {
    throw new Error(`Search failed: ${err.message}`);
  }
}

export async function downloadXvideo(link) {
  try {
    if (!/^https:\/\/(www\.)?xvideos\.com\/video(\.|)\w+/i.test(link)) {
      throw new Error('Invalid Xvideos link format.');
    }

    const res = await fetch(link);
    if (!res.ok) throw new Error('Failed to fetch video page.');

    const html = await res.text();
    const $ = cheerio.load(html);

    let videoUrl = $('video > source').attr('src') || $('#html5video_base source').attr('src');

    if (!videoUrl) {
      const scripts = $('script').get();
      for (const script of scripts) {
        const scriptContent = $(script).html();
        if (!scriptContent) continue;

        // Try multiple patterns
        let match = scriptContent.match(/setVideoUrlHigh\(['"](.+?)['"]\)/);
        if (match && match[1]) {
          videoUrl = match[1];
          break;
        }

        match = scriptContent.match(/setVideoUrlLow\(['"](.+?)['"]\)/);
        if (match && match[1]) {
          videoUrl = match[1];
          break;
        }

        match = scriptContent.match(/setVideoHLS\(['"](.+?)['"]\)/);
        if (match && match[1]) {
          videoUrl = match[1];
          break;
        }

        match = scriptContent.match(/html5player\.setVideoUrl\(['"](.+?)['"]\)/);
        if (match && match[1]) {
          videoUrl = match[1];
          break;
        }

        // Look for direct .mp4 URLs in script
        match = scriptContent.match(/(https?:\/\/[^\s'"]+\.mp4[^\s'"]*)/);
        if (match && match[1]) {
          videoUrl = match[1];
          break;
        }
      }
    }

    if (!videoUrl) {
      console.error('[xmedia] Failed to find video URL in page');
      throw new Error('Failed to extract video URL. The website structure may have changed.');
    }

    const title = $('h2.page-title').text().trim() || 'xvideos_download';

    const fileRes = await fetch(videoUrl);
    if (!fileRes.ok) throw new Error('Failed to download video file.');

    const buffer = await fileRes.buffer();

    const cleanTitle = title.replace(/[^\w\s]/gi, '').slice(0, 30);
    const filename = path.join(tmpdir(), `${cleanTitle}.mp4`);

    await writeFile(filename, buffer);

    return {
      filename,
      title,
      link
    };
  } catch (err) {
    throw new Error(`Download failed: ${err.message}`);
  }
}
