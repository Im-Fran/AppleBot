require('./env'); // Load the .env file

const { initCommands, getCommandMeta } = require('./commands'); // Get command methods
const { REST } = require('@discordjs/rest'); // Discord REST API
const { Client, GatewayIntentBits } = require('discord.js'); // Discord.js
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN); // Create a new REST instance
initCommands(rest);
const client = new Client({
    intents: [GatewayIntentBits.Guilds]
})

client.on('ready', () => {
    console.log('Client is ready!');
})

client.on('interactionCreate', async interaction => {
    try {
        const start = Date.now();
        if(!interaction.isChatInputCommand()) return;

        const meta = getCommandMeta(interaction.commandName.toLowerCase());
        if (typeof meta.onExecute === 'function') {
            await meta.onExecute(interaction);
            const end = Date.now();
            const diffInMillis = end - start;
            if(diffInMillis > 300) {
                console.log(`Command ${interaction.commandName} executed in ${diffInMillis}ms`);
            }
        } else {
            await interaction.reply({ content: 'This command is not yet implemented! Please try again later.', ephemeral: true });
        }
    }catch (e) {
        console.log(e)
        await interaction.reply({ content: 'An error occurred! The dev team was already informed.', ephemeral: true });
    }
});

client.login(process.env.BOT_TOKEN).then(() => console.log(`Logged in as ${client.user.tag}!`));
