const { getClient } = require('pg');
const { lang } = require("../i18n");
const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('set-applepay-watcher')
    .setDescription('Configures the apple pay watcher for this server')
    .addStringOption(option => option.setName('country').setDescription('The country code of the country you want to watch').setRequired(true))

data.onExecute = async (interaction) => {
    await interaction.deferReply()
    const country = interaction.options.getString('country');
    const guildId = interaction.guild.id;
    const client = getClient();
    const upsertQuery = `INSERT INTO applepay_watcher (guild_id, country) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET country = $2`;
    const res = await client.query(upsertQuery, [guildId, country]);
    if (res.rowCount === 1) {
        const langRes = await lang(guildId);
        await interaction.editReply(langRes.applepay_watcher.watching.replace('{0}', country));
    } else {
        await interaction.editReply(langRes.global.error_notified);
    }

};

module.exports = data;
