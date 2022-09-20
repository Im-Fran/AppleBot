require('./env'); // Load the .env file

const { initCommands } = require('./commands');
const { Client, REST, GatewayIntentBits } = require('discord.js');
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
const client = new Client({ intents: [GatewayIntentBits] })

initCommands(rest);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
})

client.on('interactionCreate', async interaction => {
    if(!interaction.isChatInputCommand()) return;

    if(interaction.commandName === 'ping'){
        await interaction.reply('Pong!');
    }

});
