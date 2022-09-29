const { prepared } = require('../db');
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
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guildId;

    const langRes = await lang(guildId);

    if(interaction.memberPermissions.has('ADMINISTRATOR')) {
        const upsertQuery = `INSERT INTO update_channel (guild_id, channel_id) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET channel_id = $2`;
        const res = await prepared(upsertQuery, [guildId, channel.id]);
        if (res.rowCount === 1) {
            await interaction.editReply({ content: langRes.global.registered_for_updates.replace('{0}', channel.toString()), ephemeral: true });
        } else {
            await interaction.editReply({ content: langRes.global.error_notified, ephemeral: true });
        }
    } else {
        await interaction.editReply({ content: langRes.global.no_perms, ephemeral: true })
    }
};

module.exports = data;
