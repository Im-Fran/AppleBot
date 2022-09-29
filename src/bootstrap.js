const fs = require('fs');
const { execute, prepared } = require('./db');
global.srcDir = __dirname;
global.rootDir = fs.realpathSync(__dirname + '/../') + '/';
global.langDir = rootDir + 'lang/';

(async () => {
    // Create tables if they don't exist
    await execute('CREATE TABLE IF NOT EXISTS guilds_lang (guild_id text PRIMARY KEY, lang_id text NOT NULL);');
    await execute('CREATE TABLE IF NOT EXISTS applepay_watcher (guild_id text PRIMARY KEY, country text NOT NULL);');
    await execute('CREATE TABLE IF NOT EXISTS update_channel (guild_id text PRIMARY KEY, channel_id text NOT NULL UNIQUE);');
    await execute('CREATE TABLE IF NOT EXISTS software_updates (audience text PRIMARY KEY, encoded text NOT NULL);');
    await execute('CREATE TABLE IF NOT EXISTS cached_sites (url text PRIMARY KEY, encoded text NOT NULL);');
    await execute('CREATE TABLE IF NOT EXISTS watchers_cache (id text PRIMARY KEY, last text NOT NULL);');
    const res = await prepared('SELECT $1::text as message;', ['Connected to DataBase!']);
    console.log(res.rows[0].message);
})();