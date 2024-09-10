import { OpenAI } from 'openai';
import openaiConfig from '@integrations/openai/interfaces/openaiConfig';
import { IMessage } from '@src/message/interfaces/IMessage';

interface ChatCompletionMessageParam {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name: string; // Name is always required now
}

/**
 * Converts IMessage instances into OpenAI-compatible ChatCompletionMessageParams.
 * Adds a 'name' field for all roles (necessary for OpenAI API).
 * @param historyMessages - The message history to convert.
 * @returns An array of ChatCompletionMessageParams.
 */
function convertIMessageToChatParam(historyMessages: IMessage[]): ChatCompletionMessageParam[] {
    return historyMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'function',
        content: msg.content,
        name: msg.role === 'function' ? 'FunctionName' : msg.role // Ensure name is filled for all roles
    }));
}

/**
 * Creates a chat completion using OpenAI's API.
 * It prepends a system message and passes a conversation history.
 * @param openai - The OpenAI instance.
 * @param historyMessages - The array of past conversation messages.
 * @param systemMessageContent - A system message to initialize the chat.
 * @param maxTokens - The maximum tokens for the completion.
 * @returns A promise resolving to the generated completion text.
 */
export async function createChatCompletion(
    openai: OpenAI,
    historyMessages: IMessage[],
    systemMessageContent: string,
    maxTokens: number
): Promise<string> {
    const messages = convertIMessageToChatParam(historyMessages);
    messages.unshift({ role: 'system', content: systemMessageContent, name: 'system' });

    // Fix: Provide defaults for model and temperature
    const model = openaiConfig.get('OPENAI_MODEL') || 'gpt-3.5-turbo';
    const temperature = openaiConfig.get('OPENAI_TEMPERATURE') || 0.7;

    // Improvement: Add validation and debug logging
    if (!messages.length || !messages[0].role || !messages[0].content) {
        throw new Error('Invalid message format');
    }

    if (!model || !temperature) {
        throw new Error('Missing OpenAI configuration values.');
    }

    if (typeof maxTokens !== 'number' || maxTokens <= 0) {
        throw new Error('Invalid maxTokens value.');
    }

    if (!systemMessageContent) {
        throw new Error('System message content is required.');
    }

    // Debug: Log configuration and message structure before making API call
    console.debug('OpenAI Model:', model);
    console.debug('Temperature Setting:', temperature);
    console.debug('Messages for OpenAI Completion:', JSON.stringify(messages, null, 2));

    const response = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
    });

    if (!response || !response.choices || response.choices.length === 0) {
        console.warn('OpenAI returned no choices.');
        return '';
    }

    // Debug: Log API response
    console.debug('OpenAI API Response:', JSON.stringify(response, null, 2));

    return response.choices[0].message?.content?.trim() || '';
}