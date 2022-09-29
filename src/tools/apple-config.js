const { prepared } = require('../db');
const { EmbedBuilder } = require('discord.js');
const { readFileSync, writeFileSync } = require('fs');
const brightColor = require('randomcolor');
const { get, post } = require('axios');
const md5 = require('md5');
const https = require('https');
const { lang } = require("../i18n");
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const checkFile = async (file) => {
    // First we get the latest apple config
    let url = `https://smp-device-content.apple.com/static/region/v2/${file}`;
    let res = await get(url, {
        httpsAgent,
    }).catch(err => {
        console.error(err);
    })

    if (res && res.data) {
        const json = res.data
        const supportedRegions = json.SupportedRegions
        const encoded = new Buffer.from(JSON.stringify(json), 'utf-8').toString('base64');
        const cached = await prepared('SELECT encoded FROM cached_sites WHERE url = $1', [url])
        if((cached.rows[0] || {}).encoded !== encoded){
            // We have a new config! Now let's check for every country that we're watching
            const watchers = await prepared('SELECT guild_id,country FROM applepay_watcher;');
            for(let watcher of watchers.rows){
                const country = watcher.country;
                const data = supportedRegions[country];
                if(data) {
                    const guildId = watcher.guild_id;
                    // Check if it's the first time seeing it
                    const encodedData = new Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
                    const previousData = await prepared('SELECT last FROM watchers_cache WHERE id = $1', [guildId + '-' + url]);
                    const langRes = await lang(guildId);
                    let networks = data.PaymentSetupFeaturedNetworksV3 || [];
                    if(networks.length === 0) {
                        continue;
                    }

                    if(previousData.rows.length === 0){ // Just arrived!
                        // Fetch update channel
                        const updateChannel = await prepared('SELECT channel_id FROM update_channel WHERE guild_id = $1', [guildId]);
                        if(updateChannel.rows.length > 0) {
                            const channel = client.channels.cache.get(updateChannel.rows[0].channel_id);
                            if (channel) {
                                const embed = new EmbedBuilder()
                                    .setTitle(langRes.apple_pay.arrived)
                                    .setDescription(langRes.apple_pay.arrived_description.replace('{0}', url).replace('{1}', country).replace('{2}', networks.map(it => {
                                        return `\n- **${it}**`;
                                    })))
                                    .setTimestamp()
                                    .setColor(brightColor());
                                channel.send({embeds: [embed]});
                            }
                        }
                    } else {
                        if(previousData.rows[0].last !== encodedData){
                            // Fetch update channel
                            const updateChannel = await prepared('SELECT channel_id FROM update_channel WHERE guild_id = $1', [guildId]);
                            if(updateChannel.rows.length > 0){
                                const channel = client.channels.cache.get(updateChannel.rows[0].channel_id);
                                if(channel){
                                    // It's changed! So first we upload the previous data
                                    const previousDataJson = JSON.parse(new Buffer.from(previousData.rows[0].last, 'base64').toString('utf-8'));
                                    res = await post('https://hastebin.com/documents', previousDataJson, {
                                        httpsAgent,
                                    }).catch(err => {
                                        console.error(err);
                                    });

                                    if(res && res.data) {
                                        const previousKey = res.data.key;
                                        res = await post('https://hastebin.com/documents', data, {
                                            httpsAgent,
                                        }).catch(err => {
                                            console.error(err);
                                        });

                                        if(res && res.data) {
                                            const currentKey = res.data.key;
                                            const embed = new EmbedBuilder()
                                                .setTitle(langRes.apple_pay.updated)
                                                .setDescription(langRes.apple_pay.updated_description.replace('{0}', url).replace('{1}', country).replace('{2}', `https://hastebin.com/raw/${previousKey}`).replace('{3}', `https://hastebin.com/${currentKey}`).replace('{4}', networks.map(it => {
                                                    return `\n- **${it}**`;
                                                })))
                                                .setTimestamp()
                                                .setColor(brightColor());
                                            channel.send({embeds: [embed]});
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Update last data
                    await prepared('INSERT INTO watchers_cache (id, last) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET last = $2', [guildId + '-' + url, encodedData]);
                }
            }
        }
    }
};

const check = async () => {
    console.log('Checking for ApplePay updates...');

    await checkFile('config.json');
    await checkFile('config-alt.json');
};

check().then(() => setInterval(check, 1000 * 60 * 5)); // Run interval every 5 minutes after first check

module.exports = {
    check,
}