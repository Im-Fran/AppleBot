const appleConfig = require('../apple/config.json')
const { getAppleUpdate } = require('../apple');
const {SlashCommandBuilder} = require('discord.js');

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
            return interaction.editReply('Invalid OS');
        }


        const update = await getAppleUpdate(audience, os, !!beta);
        console.log(update);
        if(update) {
            return interaction.editReply(`**${os} ${update.os_version} (${update.os_build})**\n${update.os_changelog}\n${update.os_download}`);
        } else {
            return interaction.editReply('No update found');
        }
    }catch (e) {
        console.log(e);
        return interaction.editReply('An error occurred');
    }

};

module.exports = data;
