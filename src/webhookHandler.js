const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');
const { predictionImageMap } = require('../utils/handleImageMessage');
const OpenAiManager = require('../managers/OpenAiManager');
const DiscordManager = require('../managers/DiscordManager');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

if (!process.env.DISCORD_TOKEN || !process.env.CHANNEL_ID) {
    console.error('Missing required environment variables: DISCORD_TOKEN and/or CHANNEL_ID');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Failed to login to Discord:', error.message);
    process.exit(1);
});

const startWebhookServer = (port) => {
    const app = express();
    app.use(express.json());

    app.post('/webhook', async (req, res) => {
        console.log('Received webhook:', req.body);

        const predictionId = req.body.id;
        const predictionResult = req.body;  // Adjust this line if necessary to obtain the prediction result
        const imageUrl = predictionImageMap.get(predictionId); // Retrieve the image URL using the prediction ID
        console.debug('Image URL: ' + imageUrl);

        const channelId = process.env.CHANNEL_ID;
        const channel = client.channels.cache.get(channelId);

        if (channel) {
            let resultMessage;
            if (predictionResult.status === 'succeeded') {
                const resultArray = predictionResult.output;
                const resultText = resultArray.join(' ');  // Join array elements into a single string
                // Include the image URL in the result message
                resultMessage = resultText + '\nImage URL: ' + imageUrl;
            } else if (predictionResult.status === 'processing') {
                console.debug('Processing: ' + predictionId);
            } else {
                resultMessage = 'Prediction ID: ' + predictionId + '\nStatus: ' + predictionResult.status;
            }

            await channel.send(resultMessage).catch(error => {
                console.error('Failed to send message to channel:', error.message);
            });

            // Remove the image URL from the map after sending the message
            predictionImageMap.delete(predictionId);
        } else {
            console.error('Channel not found');
        }

        res.setHeader('Content-Type', 'application/json');
        res.sendStatus(200);
    });

    app.get('/health', (req, res) => {
        console.debug('Received health probe');
        res.sendStatus(200);
    });

    app.get('/uptime', (req, res) => {
        console.debug('Received uptime probe');
        res.sendStatus(200);
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error('Unhandled Error:', err.message);
        console.debug('Next middleware function: ' + next);
        res.status(500).send({ error: 'Server Error' });
    });

    app.listen(port, () => {
        console.log('HTTP server listening at http://localhost:' + port);
    });

    /**
     * @route POST /post
     * @description Endpoint to post the message as-is to Discord.
     * @param {Object} req - The request object.
     * @param {Object} req.body - The body of the request.
     * @param {string} req.body.message - The message to be posted to Discord.
     * @param {Object} res - The response object.
     * @returns {void}
     */
    app.post('/post', async (req, res) => {
        const { message } = req.body;
        const discordManager = DiscordManager.getInstance();

        if (!message) {
            console.error('No message provided in request body');
            return res.status(400).send({ error: 'Message is required' });
        }

        try {
            await discordManager.sendResponse(process.env.CHANNEL_ID, message);
            console.debug('Message sent to Discord: ' + message);
            res.status(200).send({ message: 'Message sent to Discord.' });
        } catch (error) {
            console.error('Failed to send the message:', error);
            res.status(500).send({ error: 'Failed to send the message' });
        }
    });

    /**
     * @route POST /summarise-then-post
     * @description Endpoint to summarize the message using OpenAI and then post it to Discord.
     * @param {Object} req - The request object.
     * @param {Object} req.body - The body of the request.
     * @param {string} req.body.message - The message to be summarized and posted to Discord.
     * @param {Object} res - The response object.
     * @returns {void}
     */
    app.post('/summarise-then-post', async (req, res) => {
        const { message } = req.body;
        const openAiManager = OpenAiManager.getInstance();

        if (!message) {
            console.error('No message provided in request body');
            return res.status(400).send({ error: 'Message is required' });
        }

        try {
            console.debug('Received message for summarization: ' + message);
            const summarizedTexts = await openAiManager.summarizeText(message);
            const summarizedMessage = summarizedTexts.length > 0 ? summarizedTexts[0] : '';

            if (!summarizedMessage) {
                console.warn('Summarized message is empty');
                return res.status(500).send({ error: 'Failed to summarize the message' });
            }

            const discordManager = DiscordManager.getInstance();
            await discordManager.sendResponse(process.env.CHANNEL_ID, summarizedMessage);
            console.debug('Summarized message sent to Discord: ' + summarizedMessage);
            res.status(200).send({ message: 'Message summarized and sent to Discord.' });
        } catch (error) {
            console.error('Failed to summarize or send the message:', error);
            res.status(500).send({ error: 'Failed to summarize or send the message' });
        }
    });

};

client.once('ready', () => {
    console.log('Logged in as ' + client.user.tag);

    const port = process.env.WEB_SERVER_PORT || 3001;
    startWebhookServer(port);
});

module.exports = {
    startWebhookServer,
};
