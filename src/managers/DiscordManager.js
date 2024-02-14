// src/managers/DiscordManager.js
const { Client, GatewayIntentBits } = require('discord.js');
const logger = require('../utils/logger');
const configurationManager = require('../config/configurationManager');

class DiscordManager {
    constructor() {
        if (DiscordManager.instance) {
            return DiscordManager.instance;
        }

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ],
        });

        this.initialize();
        DiscordManager.instance = this;
    }

    initialize() {
        this.client.once('ready', () => {
            logger.info(`Logged in as ${this.client.user.tag}!`);
            this.postInitialization();
        });

        const token = configurationManager.getConfig('DISCORD_TOKEN');
        if (!token) {
            logger.error('DISCORD_TOKEN is not defined in the configuration.');
            process.exit(1);
        }

        this.client.login(token);
    }

    postInitialization() {
        // Setup event handlers and any other necessary post-initialization logic here
        // For example, registering command handlers or setting up listeners for other events
    }

    async fetchMessages(channelId, limit = 10) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            const messages = await channel.messages.fetch({ limit });
            return messages.map(msg => ({
                content: msg.content,
                authorId: msg.author.id,
                timestamp: msg.createdTimestamp,
            }));
        } catch (error) {
            logger.error(`Error fetching messages from Discord: ${error}`);
            return [];
        }
    }

    async sendResponse(channelId, message) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            await channel.send(message);
        } catch (error) {
            logger.error(`Error sending response to Discord: ${error}`);
        }
    }

    static getInstance() {
        if (!DiscordManager.instance) {
            DiscordManager.instance = new DiscordManager();
        }
        return DiscordManager.instance;
    }
}

module.exports = DiscordManager;