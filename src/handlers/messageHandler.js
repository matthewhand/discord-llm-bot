// src/handlers/messageHandler.js
const DiscordManager = require('../managers/DiscordManager');
const logger = require('../utils/logger');
const constants = require('../config/constants');

// Function to dynamically select and instantiate the LM manager
function getLmManager() {
    switch (constants.LLM_PROVIDER) {
        case 'OpenAI':
            const OpenAiManager = require('../managers/oaiApiManager');
            return new OpenAiManager();
        // Extend with additional cases as necessary
        default:
            logger.error('Unsupported LLM Provider specified in constants');
            throw new Error('Unsupported LLM Provider');
    }
}

const llmManager = getLmManager();
const discordManager = DiscordManager.getInstance(); // Assuming DiscordManager is implemented as a singleton

async function messageHandler(message) {
    if (message.author.bot || !message.content.trim()) {
        logger.debug('Ignoring bot message or empty message.');
        return;
    }

    try {
        logger.info('Generating dynamic response...');

        let history = [];
        if (llmManager.requiresHistory && llmManager.requiresHistory()) {
            history = await discordManager.fetchMessages(message.channel.id);
            logger.debug(`Fetched history: ${JSON.stringify(history)}`);
        }

        const requestBody = llmManager.buildRequestBody ? llmManager.buildRequestBody(history, message.content) : message.content;
        logger.debug(`Request body: ${JSON.stringify(requestBody)}`);
        
        const response = await llmManager.sendRequest(requestBody);
        logger.debug(`LM response: ${JSON.stringify(response)}`);

        if (response && response.choices && response.choices.length > 0) {
            const replyText = response.choices[0].text;
            logger.debug(`Sending reply: ${replyText}`);
            await discordManager.sendResponse(message.channel.id, replyText);
        } else {
            logger.debug('No response generated by LM.');
        }
        
        logger.info('Dynamic response sent or not generated.');
    } catch (error) {
        logger.error(`Error processing message: ${error}`);
        await discordManager.sendResponse(message.channel.id, 'Sorry, I encountered an error.');
    }
}

module.exports = { messageHandler };
