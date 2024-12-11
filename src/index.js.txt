require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on('ready', (c) => {
    console.log(`✅ ${c.user.tag} is online.`)
});

client.on('interactionCreate', (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'embed') {
        const embed = new EmbedBuilder()
            .setTitle('Tiktok Updates!')
            .setDescription('New Post')
            .setColor(0x82d1ff)
            .addFields({
                name: 'Title', 
                value: 'Some random value', 
                inLine: true,
            }
        );
        interaction.reply({ embeds: [embed] });
    }
}); 

client.on('messageCreate', (message) => {
    if (message.content === 'embed') {
        const embed = new EmbedBuilder()
            .setTitle('Tiktok Updates!')
            .setDescription('New Post')
            .setColor(0x82d1ff)
            .addFields({
                name: 'Title', 
                value: 'Some random value', 
                inLine: true,
            }
        );

        message.channel.send({ embeds: [embed]});
    }
})



client.login(process.env.TOKEN);
