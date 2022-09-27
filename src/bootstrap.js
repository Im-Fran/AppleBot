const fs = require('fs');
const { Client } = require('pg');
global.srcDir = __dirname;
global.rootDir = fs.realpathSync(__dirname + '/../') + '/';
global.langDir = rootDir + 'lang/';

(async () => {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    })

    await client.connect();
    const res = await client.query('SELECT $1::text as connected', ['Connection to postgres successful!']);
    console.log(res.rows[0].connected);

    // Create tables if they don't exist
    await client.query('CREATE TABLE IF NOT EXISTS applepay_watcher (guild_id text PRIMARY KEY, country text NOT NULL);');
    await client.query('CREATE TABLE IF NOT EXISTS update_channel (guild_id text PRIMARY KEY, channel_id text NOT NULL UNIQUE);');
    await client.query('CREATE TABLE IF NOT EXISTS software_updates (audience text PRIMARY KEY, encoded text NOT NULL);');
    await client.query('CREATE TABLE IF NOT EXISTS cached_sites (url text PRIMARY KEY, encoded text NOT NULL);');
    await client.query('CREATE TABLE IF NOT EXISTS watchers_cache (guild_id text PRIMARY KEY, last text NOT NULL);');

    await client.end();
})();