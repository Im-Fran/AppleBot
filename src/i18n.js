const { getClient } = require('pg');
const client = getClient();

const langId = async (guildId) => {
    const query = `SELECT lang_id FROM guilds_lang WHERE guild_id = $1`;
    const res = await client.query(query, [guildId]);
    if (res.rowCount === 1) {
        return res.rows[0].lang_id;
    } else {
        const insertQuery = `INSERT INTO guilds_lang (guild_id, lang_id) VALUES ($1, $2)`;
        await client.query(insertQuery, [guildId, 'en']);
    }

    return 'en';
};

const setLang = async (guildId, langId) => {
    const query = `UPDATE guilds_lang SET lang_id = $1 WHERE guild_id = $2`;
    await client.query(query, [langId, guildId]);
    return langId;
}

const lang = async (guildId) => {
    let lang_id = await langId(guildId);
    return require(`./lang/${lang_id}.json`);
}

module.exports = { langId, setLang, lang };