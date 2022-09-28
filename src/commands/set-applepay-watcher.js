const { getClient } = require('../db');
const { lang } = require("../i18n");
const { SlashCommandBuilder } = require('discord.js');

const data = new SlashCommandBuilder()
    .setName('set-applepay-watcher')
    .setDescription('Configures the apple pay watcher for this server')
    .addStringOption(option => option.setName('country').setDescription('The country code of the country you want to watch').setRequired(true))

data.onExecute = async (interaction) => {
    const country = interaction.options.getString('country');
    const guildId = interaction.guild.id;
    const client = await getClient();
    const upsertQuery = `INSERT INTO applepay_watcher (guild_id, country) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET country = $2`;
    const res = await client.query(upsertQuery, [guildId, country]);
    const langRes = await lang(guildId);
    if (res.rowCount === 1) {
        await interaction.editReply(langRes.apple_pay.watching.replace('{0}', country));
    } else {
        await interaction.editReply(langRes.global.error_notified);
    }

    await client.end();
};

module.exports = data;
