import axios from 'axios';
import ytdl from '@distube/ytdl-core';

export function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (let pattern of patterns) {
        if (pattern.test(url)) return url.match(pattern)[1];
    }
    return null;
}

export async function downloadMusicAPI(videoUrl) {
    const apikey = process.env.PRINCE_API_KEY || 'prince';
    const params = new URLSearchParams({ apikey, url: videoUrl });
    const url = `https://api.princetechn.com/api/download/ytmp3?${params.toString()}`;

    const { data } = await axios.get(url, {
        timeout: 20000,
        headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' }
    });
    
    if (data?.success && data?.result?.download_url) {
        return {
            status: true,
            result: {
                title: data.result.title,
                type: 'audio',
                format: 'm4a',
                thumbnail: data.result.thumbnail,
                download: data.result.download_url,
                id: data.result.id
            }
        };
    }
    return { status: false };
}

export async function downloadVideoAPI(videoUrl) {
    const apikey = process.env.PRINCE_API_KEY || 'prince';
    const params = new URLSearchParams({ apikey, url: videoUrl });
    const url = `https://api.princetechn.com/api/download/ytmp4?${params.toString()}`;

    const { data } = await axios.get(url, {
        timeout: 20000,
        headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' }
    });
    
    if (data?.success && data?.result?.download_url) {
        return {
            status: true,
            result: {
                title: data.result.title,
                type: 'video',
                format: 'mp4',
                thumbnail: data.result.thumbnail,
                download: data.result.download_url,
                id: data.result.id
            }
        };
    }
    return { status: false };
}

export async function downloadWithYtdl(videoUrl, audioOnly = false) {
    const ytHeaders = {
        'cookie': 'VISITOR_INFO1_LIVE=; PREF=f1=50000000&tz=UTC; YSC=',
        'user-agent': 'Mozilla/5.0'
    };
    
    const options = {
        quality: audioOnly ? 'highestaudio' : 'highest',
        filter: audioOnly ? 'audioonly' : 'audioandvideo',
        highWaterMark: 1 << 25,
        requestOptions: { headers: ytHeaders }
    };
    
    return ytdl(videoUrl, options);
}
