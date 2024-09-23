/**
 * Main Application Entry Point
 * 
 * This module starts the bot service and optionally the webhook service based on configuration.
 * It integrates Discord, messaging, and webhook services under a unified Express application.
 */

import express from 'express';
require('dotenv/config');
require('module-alias/register');
import debug from 'debug';
import { DiscordService } from '../src/integrations/discord/DiscordService';
import { handleMessage } from '../src/message/handlers/messageHandler';
import { IMessengerService } from '../src/message/interfaces/IMessengerService';
import { webhookService } from '../src/webhook/webhookService';

const log = debug('app:index');
const defaultChannelId = 'default-channel';
const defaultPort = Number(process.env.WEBHOOK_PORT) || 80;
const messageProvider = process.env.MESSAGE_PROVIDER || 'Default Message Service';
const llmProvider = process.env.LLM_PROVIDER || 'Default LLM Service';
const isWebhookEnabled = process.env.MESSAGE_WEBHOOK_ENABLED === 'true';

// Health check route for monitoring the bot and server health
const app = express();
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

/**
 * Starts the bot service with the given messaging service.
 * @param messengerService The platform-agnostic messenger service (e.g., Discord)
 */
async function startBot(messengerService: IMessengerService) {
  if (!messengerService) {
    log('[ERROR] Messenger service is not available. Cannot start the bot.');
    return;
  }
  try {
    // Set the message handler for incoming messages
    messengerService.setMessageHandler(handleMessage);
    log(`[DEBUG] Message handler set up successfully for ${messengerService.constructor.name}.`);
  } catch (error) {
    log(`[ERROR] Failed to start the bot service: ${error.message}`);
  }
}

/**
 * Main function to initialize the bot service and optionally the webhook service.
 */
async function main() {
  log(`[INFO] Initializing bot with message provider: ${messageProvider}`);
  log(`[INFO] Initializing LLM provider: ${llmProvider}`);

  // Start the bot service with Discord
  const messengerService = DiscordService.getInstance();
  await startBot(messengerService);

  // Conditionally start the webhook service if enabled
  if (isWebhookEnabled) {
    log('[INFO] Webhook service is enabled, starting...');
    await webhookService.start(app, messengerService, defaultChannelId, defaultPort);
  } else {
    log('[INFO] Webhook service is disabled. No server will be started.');
  }
}

// Start the application with error handling
main().catch((error) => {
  log(`[ERROR] Unexpected error in main execution: ${error.message}`);
  process.exit(1);
});
