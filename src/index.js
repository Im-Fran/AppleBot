require('./env'); // Load the .env file
require('./bootstrap')

console.log('Cache file: ' + cacheFile);
const { lang } = require('./i18n');
const { initUpdateChecker } = require('./apple');

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

client.login(process.env.BOT_TOKEN).then(() => console.log(`Client logged in as ${client.user.tag}`));
require('./listener');

client.on('ready', () => {
    console.log('Client ready');
    initUpdateChecker(); // Start the apple update checker
    require('./tools/apple-config') // Load the apple pay checker
})
