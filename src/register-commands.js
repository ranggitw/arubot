require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
    {
        name: 'embed',
        description: 'Sends an embed!',
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
      const commandId = '1315193615697313793'; // Ganti dengan ID command yang ingin dihapus
      await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, commandId));
  
      console.log(`Successfully deleted command with ID ${commandId}`);
    } catch (error) {
      console.error('Error deleting command:', error);
    }
  })();