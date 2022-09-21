const rest = require('./apple/rest');
const config = require('./apple/config.json')

/**
 * Gets an apple update
 * @param audience {string} The audience to get the update for
 * @param os The operating system
 * @param isBeta Whether to get the beta update or not
 * @returns {Promise<{os_build: *, os_version: *, os_changelog: string, os_postdate: *, os_size: *, os_updateid}|null>}
 */
const getUpdate = async (audience, os, isBeta) => {
    return await rest.request_update(
        audience,
        config.devices[os.toLowerCase()].build,
        config.devices[os.toLowerCase()].model,
        config.devices[os.toLowerCase()].prodtype,
        config.devices[os.toLowerCase()].version,
        isBeta,
        os
    );
}

const postUpdateNotification = async (update, os) => {

}

const initUpdateChecker = () => {
    setInterval(async () => {
        const ios_release = await getUpdate(config.audiences.ios_release, 'iOS', false)
        if(ios_release){

        }
    }, (5 * 60 * 1000)); // 5 minutes
};

module.exports = {
    getAppleUpdate: getUpdate,
    initUpdateChecker,
}
