const {SlashCommandBuilder} = require('discord.js');
const fs = require('fs');
const { lang, setLang } = require("../i18n");

const data = new SlashCommandBuilder()
    .setName('set-lang')
    .setDescription('Sets the language for the server!')
    .addStringOption(option =>
        option.setName('language')
            .setDescription('The language to set!')
            .setRequired(true)
            .addChoices(
                { name: 'Español', value: 'es' },
                { name: 'English', value: 'en' },
            )
    )

data.onExecute = async (interaction) => {
    await interaction.deferReply()
    const langId = interaction.options.getString('language');
    const guildId = interaction.guildId;
    if (!fs.existsSync(langDir + langId + '.json')) {
        return interaction.editReply({
            content: lang(guildId).global.invalid_lang,
            ephemeral: true,
        });
    }

    const newLang = await setLang(guildId, langId)
    const langRes = await lang(guildId);

    await interaction.editReply({
        content: langRes.global.lang_set.replace('{0}', newLang),
        ephemeral: true,
    });
};

module.exports = data;
