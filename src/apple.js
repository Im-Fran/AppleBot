const { post } = require('./embed');
const rest = require('./apple/rest');
const config = require('./apple/config.json')
const fs = require('fs');
let cache = {};
const content = fs.readFileSync(cacheFile, 'utf-8')
cache = content.length === 0 ? {} : JSON.parse(content);

/**
 * Gets an Apple update
 * @param audience {string} The audience to get the update for
 * @param os The operating system
 * @param isBeta Whether to get the beta update or not
 * @returns {Promise<{os_build: *, os_version: *, os_changelog: string, os_postdate: *, os_size: *, os_updateid}|null>}
 */
const getUpdate = async (audience, os, isBeta) => {
    const data = await rest.request_update(
        audience,
        config.devices[os.toLowerCase()].build,
        config.devices[os.toLowerCase()].model,
        config.devices[os.toLowerCase()].prodtype,
        config.devices[os.toLowerCase()].version,
        isBeta,
        os,
    );
    if(data){
        data.is_beta = isBeta;
    }
    return data;
}

const postUpdateNotification = async (update, os) => {
    // Update cache
    const content = fs.readFileSync(cacheFile, 'utf-8')
    cache = content.length === 0 ? {} : JSON.parse(content);
    Object.keys(cache.update_channels || {}).forEach(guildId => {
        const channel = client.channels.cache.get(cache.update_channels[guildId]);
        if(channel){
            post(update, os, guildId).then(embed => {
                channel.send({ embeds: [embed]});
            })
        }
    })

}

const checkUpdates = async () => {
    const content = fs.readFileSync(cacheFile, 'utf-8')
    cache = content.length === 0 ? {} : JSON.parse(content);
    if(!cache.updateChecks){
        cache.updateChecks = {};
    }
    const now = new Date();
    const lastCheck = cache.lastCheck;
    if(lastCheck-now < (5 * 60 * 1000)) {
        return;
    }

    const audiences = Object.keys(config.audiences);
    const audienceDisplay = ['iOS', 'iPadOS', 'watchOS', 'tvOS', 'macOS', 'audioOS']; // Display needs to be added through ipsw.me

    for (let audience of audiences) { // For every audience (ex: ios_release)
        const display = audienceDisplay.find(a => a.toLowerCase() === audience.split('_')[0]); // Get the display, ex: 'iOS'
        if(display){
            const update = await getUpdate(audience, display, audience.toLowerCase().includes('beta')); // Get the update
            if(update){
                const encoded = Buffer.from(JSON.stringify(update)).toString('base64')
                if(!cache.updateChecks[audience]){ // If the update wasn't already sent
                    await postUpdateNotification(update, display);
                    cache.updateChecks[audience] = encoded;
                }
            }
        }
    }

    // Update last check
    cache.lastCheck = now;
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
}
const initUpdateChecker = () => {
    checkUpdates().then(() => {
        setInterval(checkUpdates, (15 * 60 * 1000)); // Every 15 minutes after the first check
    })
};

module.exports = {
    getAppleUpdate: getUpdate,
    initUpdateChecker,
}
