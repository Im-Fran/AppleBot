const {SlashCommandBuilder} = require('discord.js');
const { getClient } = require('../db');

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

data.onExecute = async (interaction) => {
    const now = Date.now();
    const client = await getClient();
    await client.query('SELECT 1');
    await client.end();
    await interaction.editReply({ content: `Pong!\n\n_The current ping is about ${Date.now() - now}ms (This information doesn't count discord's server ping, is the connection between the database and the bot)._`, ephemeral: false });
};

module.exports = data;
