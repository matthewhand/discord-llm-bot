// src/managers/DiscordManager.js
const { Client, GatewayIntentBits } = require('discord.js');
const logger = require('../utils/logger');
const configurationManager = require('../config/configurationManager');
const discordUtils = require('../utils/discordUtils');
const DiscordMessage = require('../models/DiscordMessage');
const constants = require('../config/constants');

class DiscordManager {
    static instance;
    client;

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
            logger.info(`Bot connected as ${this.client.user.tag}`);
            this.setupEventHandlers();
        });

        const token = configurationManager.getConfig('DISCORD_TOKEN');
        if (!token) {
            logger.error('DISCORD_TOKEN is not defined in the configuration. Exiting...');
            process.exit(1);
        } else {
            this.client.login(token).then(() => {
                logger.info(`Bot login attempt successful as ${this.client.user.tag}.`);
            }).catch(error => {
                logger.error('Error logging into Discord:', error);
                process.exit(1);
            });
        }
    }

    // Inside DiscordManager class
    setupEventHandlers() {
        this.client.on('messageCreate', async (discordMessage) => {
            try {
                let repliedMessage = null;

                // Check if the discordMessage is a reply
                if (discordMessage.reference && discordMessage.reference.messageId) {
                    // Fetch the replied-to message
                    repliedMessage = await this.client.channels.cache
                        .get(discordMessage.channelId)
                        .messages.fetch(discordMessage.reference.messageId)
                        .catch(error => logger.error(`Failed to fetch replied-to message: ${error}`));
                }

                // Construct the processedMessage with the possibly fetched repliedMessage
                const processedMessage = new DiscordMessage(discordMessage, repliedMessage);

                if (this.messageHandler) {
                    console.log(Object.getOwnPropertyNames(processedMessage.__proto__));
                    await this.messageHandler(processedMessage);
                } else {
                    logger.warn('Message handler not set in DiscordManager.');
                }
            } catch (error) {
                logger.error(`Error processing message: ${error}`, { errorDetail: error });
            }
        });
    }

    setMessageHandler(messageHandlerCallback) {
        if (typeof messageHandlerCallback !== 'function') {
            throw new Error("messageHandlerCallback must be a function");
        }
        this.messageHandler = messageHandlerCallback;
    }

    /**
     * Fetches messages from a specified Discord channel and returns them as DiscordMessage instances.
    * @param {string} channelId - The ID of the channel from which messages are fetched.
    * @param {number} [limit=20] - The maximum number of messages to fetch.
    * @returns {Promise<DiscordMessage[]>} - A promise that resolves to an array of DiscordMessage instances.
    */
    async fetchMessages(channelId, limit = 20) {
        const messages = await discordUtils.fetchMessages(this.client, channelId, limit);
        return messages.reverse(); // Reverse the order of messages to oldest first (top of list)
    }
    
    async sendResponse(channelId, messageText) {
        return discordUtils.sendResponse(this.client, channelId, messageText);
    }

    async startTyping(channelId) {
        try {
            const channel = await this.client.channels.fetch(channelId)
                .then(channel => {
                    logger.debug(`Start typing in channel ${channel.name} (${channelId})`);
                    return channel; // Make sure to return the channel for further processing
                })
                .catch(error => {
                    logger.error(`Failed to fetch channel: ${error}`);
                    throw error; // Re-throw the error to be caught by the outer try/catch
                });
    
            if (channel && channel.isText()) { // Check if the channel is a text channel (not voice)
                channel.startTyping();
            } else {
                logger.warn(`Channel ${channelId} does not support typing indicators.`);
            }
        } catch (error) {
            // Handle any errors that were thrown in the try block or re-thrown by the .catch()
            logger.error(`Error in startTyping: ${error}`);
        }
    }
    
    stopTyping(channelId) {
        const channel = this.client.channels.cache.get(channelId);
        // if (channel) channel.stopTyping(true);
    }

    static getInstance() {
        if (!DiscordManager.instance) {
            DiscordManager.instance = new DiscordManager();
        }
        return DiscordManager.instance;
    }

    async getBotId() {
        return constants.CLIENT_ID;
    }

    /**
     * Fetches the topic of a specified channel.
     * @param {string} channelId - The ID of the channel for which to fetch the topic.
     * @returns {Promise<string>} The topic of the channel or 'No topic set' if not available.
     */
    async getChannelTopic(channelId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel.isText()) {
                logger.warn(`Channel ${channelId} is not a text channel.`);
                return 'No topic set'; // Adjust based on your handling of non-text channels
            }
            return channel.topic || 'No topic set';
        } catch (error) {
            logger.error(`Error fetching channel topic for channel ID ${channelId}: ${error}`);
            return 'No topic set'; // Fallback topic in case of an error
        }
    }

}

module.exports = DiscordManager;
