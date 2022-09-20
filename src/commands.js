const { Routes } = require('discord.js');

const commands = [
    {
        name:  'ping',
        description:  'Replies with Pong!',
    }
];

const init = (rest) => {
    (async () => {
        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    })();
};

module.exports = {
    initCommands: init,
}