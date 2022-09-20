const {SlashCommandBuilder} = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!');

data.onExecute = async (interaction) => {
    await interaction.reply({ content: 'Pong!', ephemeral: false });
};

module.exports = data;
