const {SlashCommandBuilder} = require('discord.js');
const { readFileSync, writeFileSync } = require('fs');
const {lang} = require("../i18n");

const data = new SlashCommandBuilder()
    .setName('set-applepay-watcher')
    .setDescription('Configures the apple pay watcher for this server')
    .addStringOption(option => option.setName('country').setDescription('The country code of the country you want to watch').setRequired(true))

data.onExecute = async (interaction) => {
    await interaction.deferReply()
    const country = interaction.options.getString('country');
    const guildId = interaction.guild.id;
    const content = readFileSync(applePayWatcherCache, 'utf-8')
    const cache = content.length === 0 ? {} : JSON.parse(content);
    cache[guildId] = {
        country,
    }
    writeFileSync(applePayWatcherCache, JSON.stringify(cache), 'utf-8');
    await interaction.editReply({content: lang(guildId).apple_pay.watching.replace('{0}', country), ephemeral: true});
};

module.exports = data;
