require('./env'); // Load the .env file
require('./bootstrap');

const { prepared } = require('./db'); // Prepared statement
const DiscordRest = require('@discordjs/rest'); // Discord REST API
const { Client, GatewayIntentBits, ActivityType } = require('discord.js'); // Discord.js

const { initUpdateChecker } = require('./apple/apple');
const { initCommands } = require('./commands'); // Get command methods
const rest = new DiscordRest.REST({ version: '10' }).setToken(process.env.BOT_TOKEN); // Create a new REST instance

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
    // List all guilds to make sure they're in our database.
    console.log('Adding missing guilds to database...')
    client.guilds.cache.forEach(async (guild) => {
        const guildId = guild.id;
        const res = await prepared('SELECT COUNT(guild_id) AS amount FROM guilds_lang WHERE guild_id=$1', [guildId]);
        if((res.rows[0] || {}).amount === '0') {
            // Insert to db the default lang
            await prepared('INSERT INTO guilds_lang (guild_id, lang_id) VALUES ($1,$2) ON CONFLICT (guild_id) DO NOTHING RETURNING guild_id, lang_id;', [guildId, 'en'])
        }
    });
    initUpdateChecker(); // Start the apple update checker
    require('./tools/apple-config') // Load the apple pay checker
    initCommands(rest); // Load the commands

    setInterval(async () => {
        const servers = await prepared('SELECT COUNT(guild_id) as amount FROM guilds_lang;');
        if(servers.rows[0]) {
            const amount = servers.rows[0].amount;
            client.user.setPresence({ activities: [{ name: `${amount} servers!`, type: ActivityType.Watching }], status: 'online' });
        }
    }, 1000 * 15);
});