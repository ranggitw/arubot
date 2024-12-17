// Import library yang diperlukan 
const { google } = require('googleapis');
const youtube = google.youtube('v3');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Konfigurasi
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const API_KEY = process.env.API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_ID;

// File untuk menyimpan latestVideoId
const latestVideoFile = path.join(__dirname, 'latestVideoId.txt');

// Fungsi untuk membaca latestVideoId dari file
function getLatestVideoIdFromFile() {
    try {
        if (fs.existsSync(latestVideoFile)) {
            return fs.readFileSync(latestVideoFile, 'utf8').trim();
        }
    } catch (error) {
        console.error('Error reading latest video ID from file:', error.message);
    }
    return null;
}

// Fungsi untuk menyimpan latestVideoId ke file
function saveLatestVideoIdToFile(videoId) {
    try {
        fs.writeFileSync(latestVideoFile, videoId, 'utf8');
    } catch (error) {
        console.error('Error saving latest video ID to file:', error.message);
    }
}

// Baca latestVideoId saat bot dimulai
let latestVideoId = getLatestVideoIdFromFile() || null;

// Inisialisasi Discord Client
const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent, // Dibutuhkan untuk membaca pesan
] });

client.once('ready', () => {
    console.log(`✅ ${client.user.tag} is online!`);
});

// Event untuk menyambut anggota baru
client.on('guildMemberAdd', async (member) => {
    try {
        const welcomeChannel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

        // Kirim pesan sambutan di channel welcome
        if (welcomeChannel) {
            const embed = {
                color: 0x82d1ff,
                title: `🎉 Welcome to ${member.guild.name}, Yuuser! 👾`,
                description: `YohoHaloo ${member}! 🥳🫶\n\nMake sure to check out the <#1316738976165400647> and enjoy your stay!`,
                image: { url: member.user.displayAvatarURL({ dynamic: true, size: 512 }) },
                footer: { text: `Yuuser number #${member.guild.memberCount}` },
                timestamp: new Date(),
            };

            welcomeChannel.send({ embeds: [embed] });
        } else {
            console.log('Welcome channel not found!');
        }

        // Berikan role "Yuuser" kepada anggota baru
        const yuuserRole = member.guild.roles.cache.find(role => role.name === 'Yuuser');
        if (yuuserRole) {
            await member.roles.add(yuuserRole);
            console.log(`Role "Yuuser" berhasil diberikan kepada ${member.user.tag}.`);
        } else {
            console.log('Role "Yuuser" tidak ditemukan di server.');
        }
    } catch (error) {
        console.error('Error welcoming new member or assigning role:', error.message);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Command !notify
    if (message.content === '!notify') {
        const gameMasterRole = message.guild.roles.cache.find(role => role.name === 'Game Master');

        if (!gameMasterRole) {
            return message.reply('Role "Game Master" tidak ditemukan. 🚫');
        }

        if (!message.member.roles.cache.has(gameMasterRole.id)) {
            return message.reply('Kamu tidak memiliki izin untuk menggunakan perintah ini. 🚫');
        }

        let notifyCounter = 0;
        const maxChecks = 3; // Total 3 kali request (6 menit)
        const intervalTime = 2 * 60 * 1000; // 2 menit

        message.reply('Notifikasi diaktifkan selama 6 menit. 🔔');

        const interval = setInterval(async () => {
            try {
                await checkLatestVideo();
                notifyCounter++;

                if (notifyCounter >= maxChecks) {
                    clearInterval(interval); // Hentikan interval
                    message.channel.send('Notifikasi dinonaktifkan. 🚫');
                }
            } catch (error) {
                console.error('Error during !notify interval:', error.message);
                message.channel.send('Terjadi kesalahan saat memeriksa video. 😢');
            }
        }, intervalTime);
    }

    // Command !notifynow
    if (message.content === '!notifynow') {
        const gameMasterRole = message.guild.roles.cache.find(role => role.name === 'Game Master');

        if (!gameMasterRole) {
            return message.reply('Role "Game Master" tidak ditemukan. 🚫');
        }

        if (!message.member.roles.cache.has(gameMasterRole.id)) {
            return message.reply('Kamu tidak memiliki izin untuk menggunakan perintah ini. 🚫');
        }

        try {
            await checkLatestVideo();
            message.reply('Video terakhir sudah diperiksa. ✅');
        } catch (error) {
            console.error('Error during !notifynow:', error.message);
            message.reply('Terjadi kesalahan saat memeriksa video. 😢');
        }
    }
});

// Fungsi untuk memeriksa video terbaru
async function checkLatestVideo() {
    try {
        console.log('Fetching latest video with params:', {
            channelId: CHANNEL_ID,
            part: 'snippet',
            order: 'date',
            maxResults: 1,
        });

        const res = await youtube.search.list({
            key: API_KEY,
            channelId: CHANNEL_ID,
            part: 'snippet',
            order: 'date',
            maxResults: 1,
        });

        if (res.data.items.length > 0) {
            const video = res.data.items[0];

            if (!video.id || !video.id.videoId) {
                throw new Error('Video ID is missing or invalid.');
            }

            const videoId = video.id.videoId;
            const { title, thumbnails, liveBroadcastContent } = video.snippet;

            if (videoId !== latestVideoId) {
                latestVideoId = videoId;
                saveLatestVideoIdToFile(videoId);

                const discordChannel = client.channels.cache.get(DISCORD_CHANNEL_ID);

                if (discordChannel) {
                    const embed = {
                        color: 0x82d1ff,
                        title: `👾 ${video.snippet.channelTitle} uploaded something new!`,
                        description: `**[${title}](https://www.youtube.com/watch?v=${videoId})**`,
                        image: { url: thumbnails.high.url },
                        timestamp: new Date(),
                        footer: { text: 'Happy Watching Yuuser!' },
                    };

                    if (liveBroadcastContent === 'live') {
                        embed.description = `📡 **Live streaming now!**\n[${title}](https://www.youtube.com/watch?v=${videoId})`;
                    } else if (liveBroadcastContent === 'upcoming') {
                        embed.description = `⏰ **Upcoming live streaming!**\n[${title}](https://www.youtube.com/watch?v=${videoId})`;
                    }

                    discordChannel.send({ embeds: [embed] });
                }
            } else {
                console.log('No new video detected.');
            }
        } else {
            console.log('No videos found for this channel.');
        }
    } catch (error) {
        console.error('Error fetching YouTube videos:', error.message);
    }
}

// Login ke Discord
client.login(TOKEN);
