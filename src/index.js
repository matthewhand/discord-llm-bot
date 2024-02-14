const logger = require('./utils/logger');
const DiscordManager = require('./managers/DiscordManager');
const setupEventHandlers = require('./eventhandlers');
const { registerCommands } = require('./handlers/slashCommandHandler');
const { startWebhookServer } = require('./handlers/webhookHandler');
const { debugEnvVars } = require('./utils/environmentUtils');
const configurationManager = require('./config/configurationManager');

debugEnvVars();

// Constants and initialization settings
const discordSettings = {
    disableUnsolicitedReplies: false,
    unsolicitedChannelCap: 5,
    ignore_dms: true,
};

async function initialize() {
    try {
        logger.info('Initialization started.');
        const discordManager = DiscordManager.getInstance();

        // Wait for the client to be ready
        await new Promise(resolve => discordManager.client.once('ready', resolve));

        logger.info(`Logged in as ${discordManager.client.user.tag}!`);

        // Now that the client is ready, proceed with setting up the rest of the bot
        const webhookPort = process.env.WEB_SERVER_PORT || 3000;
        startWebhookServer(webhookPort);
        logger.info(`Webhook server started on port: ${webhookPort}`);

        await registerCommands(discordManager.client);
        logger.info('Commands registered successfully.');

        // Setup event handlers after the client is ready
        setupEventHandlers(discordManager.client);
    } catch (error) {
        logger.error('Error during initialization:', error);
        process.exit(1);
    }
}

initialize().catch(error => logger.error('Unhandled error during initialization:', error));
