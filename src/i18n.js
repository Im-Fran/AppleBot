const { getClient } = require('./db');

const langId = async (guildId) => {
    const client = await getClient();
    const query = `SELECT lang_id FROM guilds_lang WHERE guild_id = $1`;
    const res = await client.query(query, [guildId]);
    if (res.rowCount === 1) {
        return res.rows[0].lang_id;
    } else {
        const insertQuery = `INSERT INTO guilds_lang (guild_id, lang_id) VALUES ($1, $2)`;
        await client.query(insertQuery, [guildId, 'en']);
    }
    await client.end();

    return 'en';
};

const setLang = async (guildId, langId) => {
    const client = await getClient();
    const query = `UPDATE guilds_lang SET lang_id = $1 WHERE guild_id = $2`;
    await client.query(query, [langId, guildId]);
    await client.end();
    return langId;
}

const lang = async (guildId) => {
    try {
        let lang_id = await langId(guildId);
        return require(langDir + lang_id + '.json');
    } catch (e){
        console.log(e);
        return require(langDir + 'en.json');
    }
}

module.exports = { langId, setLang, lang };