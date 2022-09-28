const { execute } = require('./db');
const { Routes } = require('discord.js');
const fs = require('fs');

const commands = [];

const init = (rest) => {
    fs.readdirSync('./src/commands').filter(it => it.endsWith('.js')).forEach((file) => {
        const nameWithoutExtension = file.substring(0, file.length - 3);
        const command = require(`./commands/${nameWithoutExtension}`);
        if(command.name && command.description && typeof command.onExecute === 'function') {
            commands.push(command);
        }
    });

    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            const res = await execute('SELECT guild_id FROM guilds_lang;');
            for(const row of res.rows) {
                await rest.put(Routes.applicationCommands(process.env.CLIENT_ID, row.guild_id), { body: commands });
            }

            commands.forEach(it => {
                console.log('Registered command: /' + it.name);
            })

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();
};

module.exports = {
    initCommands: init,
    getCommandMeta: (name) => commands.find(it => it.name.toLowerCase() === name.toLowerCase())
}
