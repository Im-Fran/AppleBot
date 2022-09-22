const appleConfig = require('../apple/config.json')
const { getAppleUpdate } = require('../apple');
const { post } = require('../embed');
const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { brightColor } = require('randomcolor')
const {lang} = require("../i18n");

const data = new SlashCommandBuilder()
    .setName('apple-update')
    .setDescription('Gets an apple update')
    .addStringOption(option =>
        option.setName('os')
            .setDescription('The operating system to get the update for')
            .setRequired(true)
            .addChoices(
                { name: 'iOS', value: 'iOS' },
                { name: 'iPadOS', value: 'iPadOS' },
                { name: 'macOS', value: 'macOS' },
                { name: 'watchOS', value: 'watchOS' },
            )
    ).addBooleanOption(option =>
        option.setName('beta')
            .setDescription('Whether to get the beta update or not')
            .setRequired(false)
    )

data.onExecute = async (interaction) => {
    try {
        await interaction.deferReply();
        const guildId = interaction.guildId;
        const os = interaction.options.getString('os');
        const beta = interaction.options.getBoolean('beta');
        let audience;
        switch (os) {
            case 'iOS':
                audience = beta ? appleConfig.audiences.ios_16_beta : appleConfig.audiences.ios_release;
                break;
            case 'iPadOS':
                audience = beta ? appleConfig.audiences.ipados_16_beta : appleConfig.audiences.ipados_release;
                break;
            case 'macOS':
                audience = beta ? appleConfig.audiences.macos_13_beta : appleConfig.audiences.macos_release;
                break;
            case 'watchOS':
                audience = beta ? appleConfig.audiences.watchos_9_beta : appleConfig.audiences.watchos_release;
                break;
            default:
                audience = null;
                break;
        }
        if(audience == null) {
            return interaction.editReply(lang(guildId).apple_update.invalid_os);
        }

        const update = await getAppleUpdate(audience, os, !!beta);
        if(update) {
            const embed = await post(update, os, guildId);
            const embeds = [embed];
            if(update.os_changelog !== '--') {
                embeds.push(new EmbedBuilder().setColor(brightColor()).setTitle(lang(guildId).apple_update.changelog).setDescription(update.os_changelog).setTimestamp());
            }
            return interaction.editReply({ embeds });
        } else {
            return interaction.editReply(lang(guildId).apple_update.no_update_found);
        }
    }catch (e) {
        console.log(e);
        return interaction.editReply(lang(guildId).global.error_notified);
    }

};

module.exports = data;
