import Debug from "debug";
import { OpenAiService } from '@src/llm/openai/OpenAiService';
import { Message } from 'discord.js';

const debug = Debug('app:sendAiGeneratedMessage');

/**
 * Send AI-Generated Message
 *
 * Generates a response using OpenAiService based on a given prompt and sends it as a reply to the original message.
 * Ensures that the response is relevant and adds value, particularly where the AI can suggest useful commands or follow-up actions.
 *
 * Key Features:
 * - Generates AI responses using OpenAiService.
 * - Validates and replies to the original message with the generated content.
 * - Logs detailed information about the process and handles errors robustly.
 *
 * @param {OpenAiService} aiManager - The OpenAI manager instance.
 * @param {Message} originalMessage - The original message that triggered the AI response.
 * @param {string} prompt - The prompt for the AI to generate a response to.
 * @returns {Promise<void>} A promise that resolves when the AI response is sent.
 */
export async function sendAiGeneratedMessage(
  aiManager: OpenAiService,
  originalMessage: Message,
  prompt: string
): Promise<void> {
  try {
    // Generate a response using the OpenAiService
    const response = await aiManager.generateResponse(prompt);

    // Validate the AI response before proceeding
    if (!response || typeof response !== 'string' || response.trim() === '') {
      debug('Invalid AI response received.');
      return;
    }

    // Reply to the original message with the AI-generated response
    await originalMessage.reply(response);
    debug('AI-generated message sent: ' + response);
  } catch (error: any) {
    debug('Error sending AI-generated message: ' + (error instanceof Error ? error.message : String(error)));
  }
}
