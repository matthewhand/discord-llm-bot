"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertIMessageToChatParam = convertIMessageToChatParam;
/**
 * Converts an `IMessage` object to OpenAI's `ChatCompletionMessageParam` format.
 *
 * Key Features:
 * - **Type Mapping**: Converts `IMessage` to `ChatCompletionMessageParam`.
 *   - Expected OpenAI type `ChatCompletionMessageParam`:
 *     - `role: 'system' | 'user' | 'assistant'`
 *     - `content: string`
 *     - `name?: string`
 *
 * @param msg - The `IMessage` object to be converted.
 * @returns The converted `ChatCompletionMessageParam` object.
 */
function convertIMessageToChatParam(msg) {
    // Ensure the role is valid
    if (!['system', 'user', 'assistant'].includes(msg.role)) {
        throw new Error(`Invalid role: ${msg.role}`);
    }
    return {
        role: msg.role,
        content: msg.getText(),
        name: msg.getAuthorName() || 'unknown',
    };
}
