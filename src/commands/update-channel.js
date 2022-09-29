const { getClient } = require('../db');
const { SlashCommandBuilder } = require('discord.js');
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
    const client = await getClient();
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;

    const langRes = await lang(guildId);
    const upsertQuery = `INSERT INTO update_channel (guild_id, channel_id) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET channel_id = $2`;
    const res = await client.query(upsertQuery, [guildId, channel.id]);
    if (res.rowCount === 1) {
        await interaction.editReply(langRes.global.registered_for_updates.replace('{0}', channel.toString()));
    } else {
        await interaction.editReply(langRes.global.error_notified);
    }
    await client.end();
};

module.exports = data;
