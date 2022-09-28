const { Client } = require('pg');

const getClient = async () => {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    })

    await client.connect();
    return client;

};

const execute = async (query) => {
    if(process.env.DEBUG) {
        console.log(query);
    }
    const client = await getClient();
    try {
        return await client.query(query);
    } catch (error) {
        console.error(error.stack);
        return false;
    } finally {
        await client.end();
    }
};

const prepared = async (query, values) => {
    if(process.env.DEBUG) {
        console.log(query, values);
    }
    const client = await getClient();
    try {
        return await client.query(query, values);
    } catch (error) {
        console.error(error.stack);
        return false;
    } finally {
        await client.end();
    }
};

module.exports = {
    getClient,
    execute,
    prepared,
};