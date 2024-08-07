/**
 * Retrieves the last typing timestamp for a specified channel.
 * @param {Map} typingTimestamps - Map to store typing timestamps.
 * @param {string} channelId - The ID of the channel to query.
 * @returns {number} The timestamp of the last typing event, or the current time if none is recorded.
 */
function getLastTypingTimestamp(typingTimestamps, channelId) {
    return typingTimestamps.get(channelId) || Date.now();
}

/**
 * Retrieves the last message timestamp for a specified channel.
 * @param {Map} messageTimestamps - Map to store message timestamps.
 * @param {string} channelId - The ID of the channel to query.
 * @returns {number} The timestamp of the last message event, or 0 if none is recorded.
 */
function getLastMessageTimestamp(messageTimestamps, channelId) {
    return messageTimestamps.get(channelId) || 0;
}

/**
 * Records the timestamp of a sent message.
 * @param {Map} messageTimestamps - Map to store message timestamps.
 * @param {string} channelId - The ID of the channel where the message was sent.
 */
function logMessageTimestamp(messageTimestamps, channelId) {
    messageTimestamps.set(channelId, Date.now());
}

module.exports = {
    getLastTypingTimestamp,
    getLastMessageTimestamp,
    logMessageTimestamp
};
