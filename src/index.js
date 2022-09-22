require('./env'); // Load the .env file
const fs = require('fs');
global.srcDir = __dirname;
global.rootDir = fs.realpathSync(__dirname + '/../') + '/';
global.cacheDir = rootDir + 'cache/';
global.cacheFile =  rootDir + 'cache.json';
global.updatesCacheFile = `${cacheDir}/updates.json`;
global.notificationChannelsCache = `${cacheDir}/notification_channels.json`;

[cacheFile, updatesCacheFile, notificationChannelsCache].forEach(it => {
    if(!fs.existsSync(it)){
        fs.writeFileSync(it, '');
    }
})

console.log('Cache file: ' + cacheFile);
const { lang } = require('./i18n');
const { initUpdateChecker } = require('./apple');
initUpdateChecker(); // Start the apple update checker

const { initCommands, getCommandMeta } = require('./commands'); // Get command methods
const { REST } = require('@discordjs/rest'); // Discord REST API
const { Client, GatewayIntentBits } = require('discord.js'); // Discord.js
const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN); // Create a new REST instance
initCommands(rest);
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessageReactions],
    partials: [ 'CHANNEL' ],
})
global.client = client;
global.rest = rest;

client.on('ready', () => {
    console.log('Client ready');
})

client.on('interactionCreate', async interaction => {
    try {
        const start = Date.now();
        if(interaction.isChatInputCommand()){
            const meta = getCommandMeta(interaction.commandName.toLowerCase());
            if (typeof meta.onExecute === 'function') {
                await meta.onExecute(interaction);
            } else {
                await interaction.reply({ content: lang(interaction.guildId).global.command_not_implemented.replace('{0}', interaction.commandName), ephemeral: true });
            }
        }

        const end = Date.now();
        const diffInMillis = end - start;
        if(diffInMillis > 300) {
            console.log(`Command ${interaction.commandName} took ${diffInMillis}ms to execute.`);
        }
    }catch (e) {
        console.log(e);
        try {
            await interaction.reply({ content: lang(interaction.guildId).global.error_notified, ephemeral: true });
        }catch (e) {
            try {
                await interaction.editReply({ content: lang(interaction.guildId).global.error_notified, ephemeral: true });
            } catch (e2) {
                console.log(e2);
            }
        }
    }
});

client.login(process.env.BOT_TOKEN).then(() => console.log(`Client logged in as ${client.user.tag}`));
