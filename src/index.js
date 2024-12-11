// Import library yang diperlukan
const { google } = require('googleapis');
const youtube = google.youtube('v3');
const { Client, GatewayIntentBits } = require('discord.js');

// Konfigurasi
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const API_KEY = process.env.API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// Variabel untuk melacak video terbaru
let latestVideoId = null;

// Inisialisasi Discord Client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online!`);

    // Jalankan pengecekan video setiap 10 menit
    setInterval(checkLatestVideo, 10 * 60 * 1000);
});

async function checkLatestVideo() {
    try {
        // Debugging informasi parameter
        console.log('API Key:', API_KEY);
        console.log('Channel ID:', CHANNEL_ID);
        console.log('Request Params for search:', {
            key: API_KEY,
            channelId: CHANNEL_ID,
            part: 'snippet',
            order: 'date',
            maxResults: 1,
        });

        // Request ke YouTube API untuk mendapatkan video terbaru
        const res = await youtube.search.list({
            key: API_KEY,
            channelId: CHANNEL_ID,
            part: 'snippet',
            order: 'date',
            maxResults: 1,
        });

        console.log('Response from YouTube search.list:', res.data);

        if (res.data.items.length > 0) {
            const video = res.data.items[0];

            if (!video.id || !video.id.videoId) {
                console.error('Video ID is missing or invalid:', video);
                throw new Error('Video ID is missing or invalid.');
            }

            console.log('Video found:', video);

            // Request ke YouTube API untuk mendapatkan detail video
            const videoDetails = await youtube.videos.list({
                key: API_KEY,
                id: video.id.videoId,
                part: 'contentDetails',
            });

            console.log('Response from YouTube videos.list:', videoDetails.data);

            if (videoDetails.data.items.length === 0) {
                throw new Error('Video details not found.');
            }

            const videoDuration = videoDetails.data.items[0].contentDetails.duration;
            console.log('Video Duration:', videoDuration);

            const isShorts = videoDuration.includes('PT') && parseInt(videoDuration.replace(/\D/g, '')) < 60;

            if (video.id.videoId !== latestVideoId) {
                latestVideoId = video.id.videoId;
                console.log('New video detected:', latestVideoId);

                const discordChannel = client.channels.cache.get(DISCORD_CHANNEL_ID);

                if (discordChannel) {
                    let message = `🎉 Video baru dari channel: ${video.snippet.title}\nhttps://www.youtube.com/watch?v=${video.id.videoId}`;
                    if (isShorts) message += `\n🎬 Ini adalah YouTube Shorts!`;
                    discordChannel.send(message);
                }
            } else {
                console.log('No new video detected.');
            }
        } else {
            console.log('No videos found for this channel.');
        }
    } catch (error) {
        console.error('Error fetching YouTube videos:', error.message);
        console.error('Stack Trace:', error.stack);
    }
}


// Login ke Discord
client.login(TOKEN);
