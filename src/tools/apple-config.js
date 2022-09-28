const { getClient } = require('../db');
const { EmbedBuilder } = require('discord.js');
const { readFileSync, writeFileSync } = require('fs');
const { get, post } = require('axios');
const md5 = require('md5');
const https = require('https');
const { lang } = require("../i18n");
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const checkFile = async (file) => {
    /*
    await get(`https://smp-device-content.apple.com/static/region/v2/${file}`, {
        httpsAgent,
        responseType: 'json'
    }).then(res => {
        const encoded = md5(JSON.stringify(res.data) + country);
        const cache = JSON.parse(readFileSync(cacheFile, 'utf-8') || '{}');
        if (cache && cache[file] !== encoded) {
            const json = res.data
            const chile = json.SupportedRegions[country];
            if (chile) {
                let networks = chile.PaymentSetupFeaturedNetworksV3 || [];
                if (networks.length > 0) {
                    const updateChannels = JSON.parse(readFileSync(notificationChannelsCache, 'utf8')) || {};
                    for (let guildId of Object.keys(updateChannels.update_channels || {})) {
                        const server = client.guilds.cache.get(guildId);
                        const channel = server.channels.cache.get(updateChannels.update_channels[guildId]);
                        if (channel) {
                            const embed = new EmbedBuilder()
                                .setTitle('Apple Pay ha llegado! (apple.com)')
                                .setDescription(`De acuerdo a la api de Apple (${file}), Apple Pay ha llegado a Chile! Puedes pagar con los siguientes tipos de tarjeta: \n` + networks.join(', '))
                                .setTimestamp()
                            channel.send({embeds: [embed]});
                        }
                    }

                    cache[file] = encoded;
                    writeFileSync(cacheFile, JSON.stringify(cache), 'utf-8');
                }
            }
        }
    }).catch(e => {
        console.error(e);
    });
     */
};

const check = async () => {

    const client = await getClient();
    console.log('Checking for ApplePay updates...');
    // Update the wolfmeister cache
    console.log('Checking with wolfmeister')
    let url = 'https://www.wolfmeister.dev/api/v1/wallets/apple/payments'
    let res = await get(url, {
        httpsAgent
    }).catch(err => {
        console.error(err);
    })

    if(res && res.data){
        try {
            const json = res.data;
            const encoded = new Buffer.from(JSON.stringify(json), 'utf-8').toString('base64');
            // Select from cached_sites in db
            const cached = await client.query('SELECT encoded FROM cached_sites WHERE url = $1 LIMIT 1', ['wolfmeister']);
            if ((cached.rows[0] || {}).encoded !== encoded) {
                // get watchers from applepay_watcher
                const watchers_query = await client.query('SELECT guild_id, country FROM applepay_watcher');
                for(let row of watchers_query.rows){
                    const country = row.country;
                    const guild_id = row.guild_id;
                    const data = json.find(it => it.countryCode === country);
                    const langRes = await lang(guild_id);
                    if(data){
                        const updateChannel = await client.query('SELECT channel_id FROM update_channel WHERE guild_id = $1 LIMIT 1', [guild_id]);
                        if(updateChannel.rows.length > 0){
                            const channel = client.channels.cache.get(updateChannel.rows[0].channel_id);
                            if(channel){
                                const guildCache = await client.query('SELECT last from watchers_cache WHERE guild_id = $1 LIMIT 1', [guild_id]);
                                const encodedData = new Buffer.from(JSON.stringify(data), 'utf-8').toString('base64');
                                if(guildCache.rows.length > 0) {
                                    // Check if new data is different from the last one
                                    if(guildCache.rows[0].last !== encodedData){
                                        const previousDecoded = JSON.parse(new Buffer.from(guildCache.rows[0].last, 'base64').toString('utf-8'));
                                        res = await post('https://hastebin.com/documents', JSON.stringify(previousDecoded), {
                                            httpsAgent
                                        }).catch(err => {
                                            console.error(err);
                                        })

                                        if(res && res.data) {
                                            const previousKey = res.data.key;

                                            res = await post('https://hastebin.com/documents', JSON.stringify(data), {
                                                httpsAgent
                                            }).catch(err => {
                                                console.error(err);
                                            });

                                            if(res && res.data) {
                                                const newKey = res.data.key;
                                                // Then send the message
                                                const embed = new EmbedBuilder()
                                                    .setTitle(langRes.apple_pay.updated)
                                                    .setDescription(langRes.apple_pay.updated_description.replace('{0}', 'wolfmeister.dev').replace('{1}', country).replace('{2}', `https://hastebin.com/raw/${previousKey}`).replace('{3}', `https://hastebin.com/raw/${newKey}`).replace('{4}', data.supportedNetworks.map(it => `\n- **${it}**`)))
                                                    .setTimestamp()
                                                channel.send({embeds: [embed]});
                                                watcherCache[guildId].last = data;
                                            }
                                        }
                                    }
                                } else {
                                    // First timer
                                    const embed = new EmbedBuilder()
                                        .setTitle(langRes.apple_pay.arrived)
                                        .setDescription(langRes.apple_pay.arrived_description.replace('{0}', 'wolfmeister.dev').replace('{1}', country).replace('{2}', data.supportedNetworks.map(it => `\n- **${it}**`)))
                                        .setTimestamp()
                                    channel.send({embeds: [embed]});
                                    await client.query('INSERT INTO watchers_cache (guild_id, is_first, last) VALUES ($1, $2, $3)', [guild_id, false, encodedData]);
                                }
                            }
                        }
                    }
                }
            }

            // Update cache
            await client.query('UPDATE cached_sites SET encoded = $1 WHERE url = $2', [encoded, url]);
        }catch (e) {
            console.error(e);
        }
    }

    await client.end();
};

check().then(() => setInterval(check, 1000 * 60 * 5)); // Run interval every 5 minutes after first check

module.exports = {
    check,
}