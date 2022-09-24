const {getCommandMeta} = require("./commands");
const {lang} = require("./i18n");


client.on('interactionCreate', async interaction => {
    try {
        const start = Date.now();
        if(interaction.isChatInputCommand()){
            const meta = getCommandMeta(interaction.commandName);
            if (typeof meta.onExecute === 'function') {
                await meta.onExecute(interaction);
            } else {
                await interaction.reply({ content: lang(interaction.guildId).global.command_not_implemented.replace('{0}', interaction.commandName), ephemeral: true });
            }
        }

        const end = Date.now();
        const diffInMillis = end - start;
        if(diffInMillis > 300) {
            console.log(`Command ${interaction.commandName} took ${diffInMillis}ms to execute.`);
        }
    }catch (e) {
        console.log(e);
        try {
            await interaction.reply({ content: lang(interaction.guildId).global.error_notified, ephemeral: true });
        }catch (e) {
            try {
                await interaction.editReply({ content: lang(interaction.guildId).global.error_notified, ephemeral: true });
            } catch (e2) {
                console.log(e2);
            }
        }
    }
});