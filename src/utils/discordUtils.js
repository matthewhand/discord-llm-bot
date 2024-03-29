const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const DiscordMessage = require('../models/DiscordMessage');
require('dotenv').config(); // Ensures environment variables are loaded, especially for CLIENT_ID

/**
 * Collects slash command definitions from command files within a specified directory.
 * @param {string} commandsPath - The path to the directory containing command files.
 * @returns {Object[]} An array of command definitions ready to be registered with Discord.
 */
function collectSlashCommands(commandsPath) {
    const commands = [];
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.data) commands.push(command.data.toJSON());
    }

    return commands;
}

/**
 * Registers slash commands with Discord for a specific guild.
 * @param {string} token - The bot token used for authentication with the Discord API.
 * @param {string} guildId - The ID of the guild where commands will be registered.
 * @param {Object[]} commands - The commands to be registered.
 */
async function registerSlashCommands(token, guildId, commands) {
    const clientId = process.env.CLIENT_ID;
    const rest = new REST({ version: '9' }).setToken(token);

    try {
        logger.info(`Registering ${commands.length} slash commands.`);
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        logger.info('Successfully registered slash commands.');
    } catch (error) {
        logger.error('Failed to register slash commands:', error);
    }
}

/**
 * Fetches messages from a specified Discord channel.
 * @param {Discord.Client} client - The Discord client instance.
 * @param {string} channelId - The ID of the channel from which messages are fetched.
 * @param {number} limit - The maximum number of messages to fetch.
 * @returns {Promise<DiscordMessage[]>} An array of messages in a generic format.
 */
async function fetchMessages(client, channelId, limit = 20) {
    try {
        const channel = await client.channels.fetch(channelId);
        const fetchedMessages = await channel.messages.fetch({ limit });
        const messages = fetchedMessages.map(message => new DiscordMessage(message));
        logger.debug(`Fetched ${messages.length} messages from channel ID: ${channelId}`);
        return messages;
    } catch (error) {
        logger.error(`Error fetching messages from Discord for channel ID ${channelId}:`, error);
        return [];
    }
}

/**
 * Sends a response message to a specified Discord channel.
 * @param {Discord.Client} client - The Discord client instance.
 * @param {string} channelId - The ID of the channel where the message will be sent.
 * @param {string} messageText - The content of the message to be sent.
 */
async function sendResponse(client, channelId, messageText) {
    try {
        const channel = await client.channels.fetch(channelId);
        await channel.send(messageText);
        logger.debug(`Message sent to channel ID: ${channelId} with content: "${messageText}"`);
    } catch (error) {
        logger.error(`Error sending response to Discord for channel ID ${channelId}:`, error);
    }
}


/**
 * Splits a message into chunks that are within Discord's character limit.
 * @param {string} messageText - The content of the message to be sent.
 * @returns {string[]} An array of message parts, each within the character limit.
 */
function splitMessage(messageText, maxLength = 1997) {
    const parts = [];
    while (messageText.length > 0) {
        if (messageText.length <= maxLength) {
            // If the remaining message is within the limit, add it without modification
            parts.push(messageText);
            break; // Exit the loop as the entire message has been processed
        } else {
            // Find a suitable split point
            let splitAt = messageText.lastIndexOf(' ', maxLength);
            if (splitAt === -1) splitAt = maxLength; // Fallback in case of a very long word

            // Add ellipsis to indicate continuation except for the first part
            let part = messageText.substring(0, splitAt).trim();
            if (parts.length) part = "..." + part; // Add ellipsis at the beginning for continuation
            parts.push(part);

            // Prepare the remaining text, adding ellipsis at the end for continuation if needed
            messageText = "..." + messageText.substring(splitAt).trim();
        }
    }
    // Ensure the last part doesn't end with ellipsis
    if (parts.length > 1) {
        parts[parts.length - 1] = parts[parts.length - 1].replace(/...\s*$/, '');
    }
    return parts;
}


/**
 * Sends a response message to a specified Discord channel, handling long messages.
 * @param {Discord.Client} client - The Discord client instance.
 * @param {string} channelId - The ID of the channel where the message will be sent.
 * @param {string} messageText - The content of the message to be sent.
 */
async function sendResponse(client, channelId, messageText) {
    const messageParts = splitMessage(messageText);
    const channel = await client.channels.fetch(channelId);
    
    for (const part of messageParts) {
        await channel.send(part).catch(error => {
            logger.error(`Error sending part of the response to Discord for channel ID ${channelId}:`, error);
        });
    }
}

/**
 * Processes a Discord message and converts it to a generic format.
 * @param {Discord.Message} message - The Discord message to process.
 * @returns {Promise<DiscordMessage>} A promise that resolves to an instance of DiscordMessage.
 */
async function processDiscordMessage(message) {
    return new DiscordMessage(message);
}

module.exports = {
    processDiscordMessage,
    collectSlashCommands,
    registerSlashCommands,
    fetchMessages,
    sendResponse,
};
