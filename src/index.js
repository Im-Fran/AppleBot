require('./env'); // Load the .env file
require('./bootstrap');

const { REST } = require('@discordjs/rest'); // Discord REST API
const { Client, GatewayIntentBits } = require('discord.js'); // Discord.js

const { initUpdateChecker } = require('./apple/apple');
const { initCommands } = require('./commands'); // Get command methods
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
});
