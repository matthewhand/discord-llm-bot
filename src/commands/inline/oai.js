const Command = require('../../utils/Command');
const logger = require('../../utils/logger');
const { getRandomErrorMessage } = require('../../config/errorMessages');
const { splitMessage } = require('../../utils/common');
const fetchConversationHistory = require('../../utils/fetchConversationHistory');
const oaiApi = require('../../services/oaiApi');

class OaiCommand extends Command {
    constructor() {
        super('oai', 'Interact with OpenAI models. Usage: !oai:[model] [query]');
    }

    async execute(message, args) {
        try {
            if (!args || args.trim() === '') {
                logger.warn('[oai] No arguments provided to oai command.');
                return await message.reply('Error: No arguments provided.');
            }

            const argsSplit = args.split(' ');
            const action = argsSplit[0] || 'gpt-3.5-turbo';
            const userMessage = argsSplit.slice(1).join(' ');

            logger.debug(`[oai] Action: ${action}, User Message: ${userMessage}`);

            const historyMessages = await fetchConversationHistory(message.channel);
            if (!historyMessages || historyMessages.length === 0) {
                logger.warn('[oai] No history messages found.');
                return await message.reply('Error: Unable to fetch conversation history.');
            }

            const requestBody = oaiApi.buildRequestBody(historyMessages, userMessage, action);
            logger.debug(`[oai] Request body: ${JSON.stringify(requestBody)}`);

            const responseData = await oaiApi.sendRequest(requestBody);
            logger.debug(`[oai] Response Data: ${JSON.stringify(responseData)}`);

            const replyContent = this.processResponse(responseData);
            logger.debug(`[oai] Reply Content: ${replyContent}`);

            if (replyContent) {
                const messagesToSend = splitMessage(replyContent, 2000);
                for (const msg of messagesToSend) {
                    await message.channel.send(msg);
                }
            } else {
                logger.warn('[oai] No reply content received');
                await message.reply('No response received from OpenAI.');
            }
        } catch (error) {
            logger.error(`[oai] Error in execute: ${error.message}`, error);
            await message.reply(getRandomErrorMessage());
        }
    }

    processResponse(data) {
        if (data && data.choices && data.choices.length > 0) {
            let content = data.choices[0].message.content.trim();
            const pattern = /^<@\w+>: /;
            if (pattern.test(content)) {
                content = content.replace(pattern, '');
            }
            return content;
        }
        logger.warn('[oai] No valid response from the server.');
        return 'No response from the server.';
    }
}

module.exports = new OaiCommand();
