import { IMessage } from '@src/message/interfaces/IMessage';
import { OpenAI } from 'openai';

/**
 * Converts an `IMessage` object to OpenAI's `ChatCompletionMessageParam` format.
 * 
 * Key Features:
 * - **Type Mapping**: Converts `IMessage` to `ChatCompletionMessageParam`.
 *   - Expected OpenAI type `ChatCompletionMessageParam`:
 *     - `role: 'system' | 'user' | 'assistant' | 'function'`
 *     - `content: string | ChatCompletionContentPart[]`
 *     - `name?: string`
 * 
 * @param msg - The `IMessage` object to be converted.
 * @returns The converted `ChatCompletionMessageParam` object.
 */
export function convertIMessageToChatParam(
    msg: IMessage
): OpenAI.Chat.ChatCompletionMessageParam {
    // Ensure the role is valid
    if (!['system', 'user', 'assistant', 'function'].includes(msg.role)) {
        throw new Error(`Invalid role: ${msg.role}`);
    }

    // Placeholder for handling 'function' role content
    const content = msg.role === 'function' ? '[Function Call Content Placeholder]' : msg.getText();

    return {
        role: msg.role as 'system' | 'user' | 'assistant' | 'function',
        content,
        name: msg.getAuthorName() || 'unknown',
    };
}
