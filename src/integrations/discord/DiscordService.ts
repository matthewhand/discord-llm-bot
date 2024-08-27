import { Client, GatewayIntentBits, Message, TextChannel } from 'discord.js';
import { initializeClient } from './interaction/initializeClient';
import Debug from 'debug';
import { IMessage } from '@src/message/interfaces/IMessage';
import DiscordMessage from '@src/integrations/discord/DiscordMessage'; // Import your DiscordMessage implementation

const log = Debug('app:discord-service');

/**
 * DiscordService Class
 *
 * Manages Discord interactions, including message handling, voice channel connections,
 * and AI response processing. This service is implemented as a singleton to ensure
 * consistent and centralized management of the Discord client.
 *
 * Key Features:
 * - Singleton pattern for centralized client management
 * - Handles message interactions and responses
 * - Supports sending messages to channels and managing voice states
 */
export class DiscordService {
  private client: Client;
  private static instance: DiscordService;
  private messageHandler: ((message: IMessage) => void) | null = null;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes the Discord client with the necessary intents.
   */
  private constructor() {
    log('Initializing Client with intents: Guilds, GuildMessages, GuildVoiceStates');
    this.client = initializeClient();
    log('Client initialized successfully');
  }

  /**
   * Returns the singleton instance of DiscordService, creating it if necessary.
   * @returns The singleton instance of DiscordService.
   */
  public static getInstance(): DiscordService {
    if (!DiscordService.instance) {
      log('Creating a new instance of DiscordService');
      DiscordService.instance = new DiscordService();
    }
    return DiscordService.instance;
  }

  /**
   * Sets a custom message handler for processing incoming messages.
   * @param handler - The function to handle incoming messages.
   */
  public setMessageHandler(handler: (message: IMessage) => void): void {
    this.messageHandler = handler;
  }

  /**
   * Initializes the Discord service by logging in and setting up event handlers.
   */
  public async initialize(token?: string): Promise<void> {
    try {
      token = token || process.env.DISCORD_TOKEN;
      if (!token) {
        throw new Error('DISCORD_TOKEN is not set');
      }
      await this.client.login(token);
      this.client.once('ready', () => {
        log(`Logged in as ${this.client.user?.tag}!`);
      });

      // Set up the message event handler if provided
      if (this.messageHandler) {
        log('Setting up custom message handler');
        this.client.on('messageCreate', (message: Message<boolean>) => {
          log(`Received a message with ID: ${message.id}`);

          // Convert the Discord.js message to your IMessage implementation
          const iMessage: IMessage = new DiscordMessage(message);

          // Call the handler with the converted IMessage
          this.messageHandler!(iMessage);
        });
      } else {
        log('No custom message handler set');
      }
    } catch (error: any) {
      log('Failed to start DiscordService: ' + error.message);
      process.exit(1);
    }
  }

  /**
   * Starts the Discord service, initializing the client.
   * @param token - The Discord bot token.
   */
  public async start(token: string): Promise<void> {
    await this.initialize(token);
  }

  /**
   * Sends a message to a specified channel.
   * @param {string} channelId - The ID of the channel to send the message to.
   * @param {string} message - The message content to send.
   * @returns {Promise<void>} A promise that resolves when the message is sent.
   */
  public async sendMessageToChannel(channelId: string, message: string): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) {
        throw new Error('Channel not found');
      }
      log(`Sending message to channel ${channelId}: ${message}`);
      await channel.send(message);
      log(`Message sent to channel ${channelId} successfully`);
    } catch (error: any) {
      log(`Failed to send message to channel ${channelId}: ` + error.message);
      throw error;
    }
  }
}
