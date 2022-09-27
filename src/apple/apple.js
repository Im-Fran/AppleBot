const { getClient } = require('pg');
const { post } = require('../embed');
const rest = require('./rest');
const config = require('./config.json')

const client = getClient();
let lastCheck = 0;

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
    // Select all channels and guilds from update_channel
    const query = await client.query('SELECT guild_id, channel_id FROM update_channel;');
    for (let row of query.rows) {
        const guild = await client.guilds.fetch(row.guild_id);
        if(guild){
            const channel = await guild.channels.cache.get(row.channel_id);
            if(channel){
                post(update, os, row.guild_id).then(embed => {
                    channel.send({ embeds: [embed]});
                })
            }
        }
    }
}

const checkUpdates = async () => {
    const now = new Date();
    if(lastCheck-now < (5 * 60 * 1000) && lastCheck !== 0){
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
                // Get the current update from `software_updates`
                const lastUpdate = await client.query('SELECT encoded FROM software_updates WHERE audience = $1', [audience]);
                if(lastUpdate.rows.length === 0 || lastUpdate.rows[0].encoded !== encoded){
                    // Update the update
                    await client.query('INSERT INTO software_updates (audience, encoded) VALUES ($1, $2) ON CONFLICT (audience) DO UPDATE SET encoded = $2', [audience, encoded]);
                    // Post the update
                    await postUpdateNotification(update, display);
                }
            }
        }
    }

    // Update last check
    lastCheck = new Date();
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
