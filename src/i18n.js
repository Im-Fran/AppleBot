const fs = require('fs');
const langConfig = rootDir + '/lang.json'
let cached = {}
const content = fs.readFileSync(langConfig, 'utf8');
cached = content.length === 0 ? {} : JSON.parse(content);

module.exports = {
    langId: (guildId) => {
        if(!cached[guildId]) {
            cached[guildId] = 'en';
            fs.writeFileSync(langConfig, JSON.stringify(cached, null, 4));
        }
        return cached[guildId];
    },
    lang: (guildId) => {
        if(!cached[guildId]) {
            cached[guildId] = 'en';
            fs.writeFileSync(langConfig, JSON.stringify(cached, null, 4));
        }
        return JSON.parse(fs.readFileSync(`${rootDir}/lang/${cached[guildId]}.json`, 'utf8'));
    },
    setLang(guildId, langId) {
        cached[guildId] = langId;
        fs.writeFileSync(langConfig, JSON.stringify(cached, null, 4));
        return cached[guildId];
    },
}