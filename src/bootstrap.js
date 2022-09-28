const fs = require('fs');
const { getClient } = require('./db');
global.srcDir = __dirname;
global.rootDir = fs.realpathSync(__dirname + '/../') + '/';
global.langDir = rootDir + 'lang/';

(async () => {
    const client = await getClient();

    // Create tables if they don't exist
    const res = await client.query(
        'CREATE TABLE IF NOT EXISTS guilds_lang (guild_id text PRIMARY KEY, lang_id text NOT NULL);' +
        'CREATE TABLE IF NOT EXISTS applepay_watcher (guild_id text PRIMARY KEY, country text NOT NULL);' +
        'CREATE TABLE IF NOT EXISTS update_channel (guild_id text PRIMARY KEY, channel_id text NOT NULL UNIQUE);' +
        'CREATE TABLE IF NOT EXISTS software_updates (audience text PRIMARY KEY, encoded text NOT NULL);' +
        'CREATE TABLE IF NOT EXISTS cached_sites (url text PRIMARY KEY, encoded text NOT NULL);' +
        'CREATE TABLE IF NOT EXISTS watchers_cache (guild_id text PRIMARY KEY, last text NOT NULL);' +
        'SELECT \'Tables created successfully\'::text as message;'
    );
    console.log(res[res.length-1].rows[0].message);
    await client.end();
})();