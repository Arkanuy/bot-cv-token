require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

async function deployCommands() {
    try {
        console.log('Started refreshing application (/) commands...');
        
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        
        const data = await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    console.log(`⚙️ Auto Retry: ${process.env.AUTO_RETRY || 3} attempts`);
    console.log(`🧵 Max Threads: ${process.env.MAX_THREADS || 100}`);
    await deployCommands();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Command execution error:', error);
        const errorMessage = 'There was an error while executing this command!';
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }
});

// Prevent crashes from unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
    console.error('Stack:', error.stack);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    console.error('Stack:', error.stack);
});

// Keep bot alive with heartbeat
setInterval(() => {
    console.log(`💓 Bot heartbeat - Status: ${client.ws.status} - Uptime: ${Math.floor(process.uptime())}s`);
}, 60000); 

client.on('disconnect', () => {
    console.error('⚠️ Bot disconnected! Attempting to reconnect...');
});

client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
});

client.on('warn', (warning) => {
    console.warn('⚠️ Discord warning:', warning);
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await client.destroy();
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);