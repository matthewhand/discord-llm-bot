import { IMessage } from './IMessage';

/**
 * IMessengerService provides a platform-agnostic interface for messaging services,
 * allowing interactions such as sending messages, fetching message history, and
 * registering custom message handlers.
 */
export interface IMessengerService {
  /**
   * Sends a message to a specified channel.
   * @param channelId - The ID of the channel to send the message to.
   * @param message - The content of the message to send.
   */
  sendMessageToChannel(channelId: string, message: string): Promise<void>;

  /**
   * Fetches messages from a specified channel.
   * @param channelId - The ID of the channel to fetch messages from.
   * @param limit - Optional number of messages to fetch (default: 10).
   */
  getMessagesFromChannel(channelId: string, limit?: number): Promise<IMessage[]>;

  /**
   * Sets a custom message handler for processing incoming messages.
   * @param handler - The function that handles incoming messages.
   */
  setMessageHandler(handler: (message: IMessage, historyMessages: IMessage[]) => void): void;

  /**
   * Sends a public service announcement to the channel. The platform may format the announcement differently.
   * @param channelId - The channel to send the announcement to.
   * @param announcement - The announcement content (can be rich embeds or simple text based on the platform).
   */
  sendPublicAnnouncement(channelId: string, announcement: any): Promise<void>;

  /**
   * Retrieves the client ID for the bot on the respective platform.
   * @returns {string} The client ID of the bot.
   */
  getClientId(): string;
}
