const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');
const { lang } = require('../i18n');

const data = new SlashCommandBuilder()
    .setName('update-channel')
    .setDescription('Registers a channel to receive update notifications.')
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('The channel to register.')
            .setRequired(true)
    );

data.onExecute = async (interaction) => {
    await interaction.deferReply();
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;
    const content = fs.readFileSync(notificationChannelsCache, 'utf-8');
    const cache = content.length === 0 ? {} : JSON.parse(content);
    const update_channels = cache.update_channels || {};
    update_channels[guildId] = channel.id;
    cache.update_channels = update_channels;
    fs.writeFileSync(notificationChannelsCache, JSON.stringify(cache));
    await interaction.editReply(lang(guildId).global.registered_for_updates.replace('{0}', `<#${channel.id}>`));
};

module.exports = data;
