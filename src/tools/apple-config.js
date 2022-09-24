const { EmbedBuilder } = require('discord.js');
const { readFileSync, writeFileSync } = require('fs');
const { get, post } = require('axios');
const md5 = require('md5');
const https = require('https');
const {lang} = require("../i18n");
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

const checkFile = async (file) => {
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
};

const check = async () => {
    console.log('Checking for ApplePay updates...');
    // First retrieve cache files
    const watcherCacheContent = readFileSync(applePayWatcherCache, 'utf-8');
    let watcherCache = watcherCacheContent.length === 0 ? {} : JSON.parse(watcherCacheContent);

    const notificationChannelsContent = readFileSync(notificationChannelsCache, 'utf-8');
    const notificationChannels = (notificationChannelsContent.length === 0 ? {} : JSON.parse(notificationChannelsContent)).update_channels;

    const cacheContent = readFileSync(cacheFile, 'utf-8');
    const cache = cacheContent.length === 0 ? {} : JSON.parse(cacheContent);

    // Then update the wolfmeister cache
    console.log('Checking with wolfmeister')
    let res = await get('https://www.wolfmeister.dev/api/v1/wallets/apple/payments', {
        httpsAgent
    }).catch(err => {
        console.error(err);
    })

    if(res && res.data){
        try {
            const json = res.data;
            const encoded = md5(JSON.stringify(json));
            if(cache.wolfmeister !== encoded){
                // For every watcher
                for (let guildId of Object.keys(watcherCache)) {
                    const country = watcherCache[guildId].country;
                    const data = json.find(it => it.countryCode === country);
                    if(data) {
                        const channel = client.channels.cache.get(notificationChannels[guildId]);
                        if (channel) {
                            if(!watcherCache[guildId].first){
                                const embed = new EmbedBuilder()
                                    .setTitle(lang(guildId).apple_pay.arrived)
                                    .setDescription(lang(guildId).apple_pay.arrived_description.replace('{0}', 'wolfmeister.dev').replace('{1}', country).replace('{2}', data.supportedNetworks.map(it => `\n- **${it}**`)))
                                    .setTimestamp()
                                channel.send({embeds: [embed]});
                                watcherCache[guildId].first = true;
                                watcherCache[guildId].last = data;
                            } else {
                                if(md5(JSON.stringify(data)) !== md5(JSON.stringify(watcherCache[guildId].last))){
                                    // First upload the previous data to `https://hastebin.com/documents`
                                    const previous = watcherCache[guildId].last;
                                    res = await post('https://hastebin.com/documents', JSON.stringify(previous), {
                                        httpsAgent
                                    }).catch(err => {
                                        console.error(err);
                                    })

                                    if(res && res.data){
                                        const previousKey = res.data.key;
                                        // Then upload the new data to `https://hastebin.com/documents`
                                        res = await post('https://hastebin.com/documents', JSON.stringify(data), {
                                            httpsAgent
                                        }).catch(err => {
                                            console.error(err);
                                        })

                                        if(res && res.data){
                                            const newKey = res.data.key;
                                            // Then send the message
                                            const embed = new EmbedBuilder()
                                                .setTitle(lang(guildId).apple_pay.updated)
                                                .setDescription(lang(guildId).apple_pay.updated_description.replace('{0}', 'wolfmeister.dev').replace('{1}', country).replace('{2}', `https://hastebin.com/raw/${previousKey}`).replace('{3}', `https://hastebin.com/raw/${newKey}`).replace('{4}', data.supportedNetworks.map(it => `\n- **${it}**`)))
                                                .setTimestamp()
                                            channel.send({embeds: [embed]});
                                            watcherCache[guildId].last = data;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            cache.wolfmeister = encoded;
        }catch (e) {
            console.error(e);
        }
    }

    writeFileSync(applePayWatcherCache, JSON.stringify(watcherCache), 'utf-8');
    writeFileSync(cacheFile, JSON.stringify(cache), 'utf-8');
};

check().then(() => setInterval(check, 1000 * 60 * 5)); // Run interval every 5 minutes after first check

module.exports = {
    check,
}