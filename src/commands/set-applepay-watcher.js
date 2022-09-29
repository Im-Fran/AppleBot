const { prepared } = require('../db');
const { lang } = require("../i18n");
const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('set-applepay-watcher')
    .setDescription('Configures the apple pay watcher for this server')
    .addStringOption(option => option.setName('country').setDescription('The country code of the country you want to watch').setRequired(true))

data.onExecute = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const country = interaction.options.getString('country');
    const guildId = interaction.guild.id;
    const langRes = await lang(guildId);
    if(interaction.memberPermissions.has('ADMINISTRATOR')) {
        const upsertQuery = `INSERT INTO applepay_watcher (guild_id, country) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET country = $2`;
        const res = await prepared(upsertQuery, [guildId, country]);
        if (res.rowCount === 1) {
            await interaction.editReply({content: langRes.apple_pay.watching.replace('{0}', country), ephemeral: true})
        } else {
            await interaction.editReply({content: langRes.global.error_notified, ephemeral: true})
        }
    } else {
        await interaction.editReply({content: langRes.global.no_perms, ephemeral: true})
    }
};

module.exports = data;
