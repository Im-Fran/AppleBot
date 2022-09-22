const axios = require('axios')
const admzip = require('adm-zip');
const sanitizeHTML = require('sanitize-html');
const config = require("./config.json");
const https = require('https');
const { v4 } = require('uuid');

/**
 * Used to fetch the changelog
 * @param audience the audience id to fetch the data for
 * @param model the model id to fetch the data for
 * @param documentationId the documentation id to fetch the data for
 * @param id macos, ios, watchos, tvos or ipados
 * @returns {Promise<string|null|string>} the changelog. null if no changelog is available or any error occurred
 */
const request_changelog = async (audience, model, documentationId, id) => {
    const uuid = v4();
    const postData = {
        AssetAudience: config.audiences[audience] || audience,
        HWModelStr: model,
        SUDocumentationID: documentationId,
        CertIssuanceDay: "2019-09-06",
        ClientVersion: 2,
        DeviceName: config.devices[id.toLowerCase()].name,
        AssetType: config.devices[id.toLowerCase()].doc_asset_type,
    };
    console.log(`${uuid} > CHANGELOG: https://gdmf.apple.com/v2/assets POST: ${JSON.stringify(postData)}`)
    const agent = new https.Agent({
        rejectUnauthorized: false,
    })
    const res = await axios.post('https://gdmf.apple.com/v2/assets', postData, {
        httpsAgent: agent
    }).catch(err => {
        console.log(`${uuid} >  Failed to fetch ${id} Changelog: ${err}`)
        console.log({
            uuid,
            method: `request_changelog(${id})`,
            audience,
            model,
            documentationId,
            id
        })
    })

    if(!res) return null;
    let data = res.data.split('.')[1]
    let buff = new Buffer.from(data, 'base64');
    let json = JSON.parse(buff.toString('utf-8'))

    if(!json.Assets[0])
        return '--';
    const url = `${json.Assets[0].__BaseURL}${json.Assets[0].__RelativePath}`
    const changelog = await axios.request({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        responseEncoding: null,
    }).catch(err => {
        console.log(`Failed to fetch ${id} Changelog: ${err}`)
        console.log({
            method: `request_changelog(${id})`,
            audience,
            model,
            documentationId,
            id
        })
    });
    if(!changelog) {
        return '--';
    }
    const zip = new admzip(changelog.data);
    let changelogText = zip.getEntries().map(entry => entry.entryName === 'AssetData/en.lproj/ReadMeSummary.html' ? entry : null).filter(it => !!it)[0];
    const sanitized = sanitizeHTML(changelogText.getData().toString('utf8'), {
        allowedTags: ['li'],
    }).split('\r\n').map(it => {
        return it.replace(/\t/g, '')
            .replace(/<li>/g, '')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .trimStart()
    }).join('\n').replace(/\n\s*\n\s*\n/g, '\n\n')
    return sanitized.length > 4000 ? sanitized.substring(0, 3900) + `...\n` : sanitized;
};

/**
 * Used to fetch the update data.
 * @param audience the audience id to fetch the data for
 * @param build the build id to fetch the data for
 * @param model the model id to fetch the data for
 * @param productType the product type id to fetch the data for
 * @param productVersion the product version id to fetch the data for
 * @param isBeta whether the update is a beta update or not
 * @param id a unique id to identify errors
 * @returns {Promise<null|{os_build: *, os_version: *, os_changelog: string, os_postdate: *, os_size: *, os_updateid}>} the update data. null if no update is available or any error occurred
 */
const request_update = async (audience, build, model, productType, productVersion, isBeta, id) => {
    const uuid = v4();
    const postData = {
        AssetAudience: config.audiences[audience] || audience,
        CertIssuanceDay: "2020-09-29",
        ClientVersion: 2,
        AssetType: id.toLowerCase() === 'macos' ? 'com.apple.MobileAsset.MacSoftwareUpdate' : "com.apple.MobileAsset.SoftwareUpdate",
        BuildVersion: config.devices[id.toLowerCase()].build,
        HWModelStr: config.devices[id.toLowerCase()].model,
        ProductType: config.devices[id.toLowerCase()].prodtype,
        ProductVersion: config.devices[id.toLowerCase()].version,
    };
    console.log(`${uuid} > UPDATE: https://gdmf.apple.com/v2/assets POST: ${JSON.stringify(postData)}`)
    const agent = new https.Agent({
        rejectUnauthorized: false,
    })
    let res = await axios.post('https://gdmf.apple.com/v2/assets', postData, { httpsAgent: agent }).catch(error => {
        console.log(`${uuid} > Failed to fetch ${id} Update: ${error}`)
        console.log({
            uuid,
            method: `request_update(${id})`,
            audience,
            build,
            model,
            productType,
            productVersion,
            isBeta,
            id
        })
    })


    if(!res) return null;

    let data = res.data.split('.')[1]
    let buff = new Buffer.from(data, 'base64');
    let json = JSON.parse(buff.toString('utf-8'))

    if(json.Assets[0]){
        let changelog = '--';
        if(!isBeta && id.toLowerCase() !== 'tvos'){
            changelog = await request_changelog(
                audience,
                model,
                json.Assets[0].SUDocumentationID,
                id,
            )
            if(changelog == null)
                changelog = '--';
        }
        return {
            os_version: json.Assets[0].OSVersion.replace('9.9.', ''),
            os_build: json.Assets[0].Build,
            os_size: json.Assets[0]._DownloadSize,
            os_updateid: json.Assets[0].SUDocumentationID,
            os_changelog: changelog,
            os_postdate: json.PostingDate,
            os_download: json.Assets[0].__BaseURL + json.Assets[0].__RelativePath
        };
    } else {
        console.log('No update asset found.')
        return null
    }
}

module.exports = {
    request_update,
}