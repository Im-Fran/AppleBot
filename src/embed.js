const axios = require('axios');
const https = require('https');
const { EmbedBuilder } = require('discord.js');
const {prettyBytes} = require('./pretty-bytes');
const brightColor = require('randomcolor');
const {lang, langId} = require("./i18n");

module.exports = {
    /**
     * generate the embed for the update command
     * @param update the update object
     * @param os the os name
     * @param guildId the guild id for the language selection
     * @returns {Promise<EmbedBuilder>}
     */
    post: async (update, os, guildId) => {
        const lang_id = await langId(guildId);
        const langRes = await lang(guildId);

        const embed = new EmbedBuilder()
            .setTitle((update.is_beta ? langRes.apple_update.beta : langRes.apple_update.public).replace('{0}', os))
            .addFields(
                { name: langRes.apple_update.version, value: `${update.os_version}`, inline: true },
                { name: langRes.apple_update.build, value: update.os_build, inline: true },
                { name: langRes.apple_update.size, value: prettyBytes(update.os_size), inline: true },
                { name: langRes.apple_update.post_date, value: new Date(update.os_postdate).toLocaleString(new Intl.Locale(lang_id)), inline: true },
            )
            .setColor(brightColor())
        let thumbnailLink = `https://minh-ton.github.io/apple-updates/icons/${os.toLowerCase()}${(update.os_version || '').split('.')[0]}.png`;
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false
        });
        try {
            if((await axios.get(thumbnailLink, {
                httpsAgent,
            })).status === 200){
                embed.setThumbnail(thumbnailLink);
            }
        }catch (_) {}
        embed.setTimestamp();
        return embed;
    }
}