/**
 * shouldReplyToMessage.ts
 * 
 * This module determines whether the bot should reply to an incoming message based on various factors such as
 * message content, mentions, channel activity, and configured probabilities.
 * It ensures that the bot responds appropriately without overwhelming channels or interacting unnecessarily.
 */

import Debug from 'debug';

const debug = Debug('app:shouldReplyToMessage');

// In-memory store for tracking channels where the bot has spoken with timestamps
const channelsWithBotInteraction = new Map<string, number>();

/**
 * Marks a channel as having had bot interaction by storing the current timestamp.
 * @param channelId - The ID of the channel to mark.
 */
export function markChannelAsInteracted(channelId: string): void {
    channelsWithBotInteraction.set(channelId, Date.now());
    debug(`Channel ${channelId} marked as interacted at ${Date.now()}.`);
}

/**
 * Determines whether the bot should reply to a message based on various factors.
 * @param message - The incoming message object.
 * @param botId - The bot's user ID.
 * @param integration - The name of the integration (e.g., 'discord').
 * @param activityTimeWindow - The time window for activity decay in milliseconds.
 * @returns Whether the bot should reply to the message.
 */
export function shouldReplyToMessage(
    message: any,
    botId: string,
    integration: string,
    activityTimeWindow: number = 300000 // 5 minutes in milliseconds
): boolean {
    const channelId = message.getChannelId();
    debug(`Evaluating message in channel: ${channelId}`);

    // Check if the bot has spoken before in the channel
    const lastInteractionTime = channelsWithBotInteraction.get(channelId) || 0;
    const currentTime = Date.now();
    const timeSinceLastActivity = currentTime - lastInteractionTime;
    debug(`Time since last activity in channel ${channelId}: ${timeSinceLastActivity}ms`);

    // Check if the message is a direct query (mentions or replies to the bot)
    let isDirectQuery = false;
    if (typeof message.mentionsUsers === 'function') {
        isDirectQuery = message.mentionsUsers(botId) || message.isReplyToBot();
        debug(`Is direct query: ${isDirectQuery}`);
    } else {
        debug('Message mentionsUsers method is undefined.');
    }

    if (!lastInteractionTime && !isDirectQuery) {
        debug('Bot has not interacted before and the message is not a direct query.');
        // Optionally, allow unsolicited responses by not returning here
    }

    const chance = calculateBaseChance(message, timeSinceLastActivity, activityTimeWindow);
    debug(`Calculated chance to respond: ${chance}`);

    const randomValue = Math.random();
    const decision = randomValue < chance;
    debug(`Random value: ${randomValue} < Chance: ${chance} => Should respond: ${decision}`);

    return decision;
}

/**
 * Calculates the base chance of responding to a message.
 * @param message - The incoming message object.
 * @param timeSinceLastActivity - Time since the last activity in milliseconds.
 * @param activityTimeWindow - The time window for activity decay.
 * @returns The calculated chance (0 to 1).
 */
function calculateBaseChance(message: any, timeSinceLastActivity: number, activityTimeWindow: number): number {
    // Prevent the bot from responding to its own messages
    if (message.getAuthorId() === process.env.DISCORD_CLIENT_ID) {
        debug('Not responding to self-generated messages.');
        return 0;
    }

    let chance = 0.2;
    const text = message.getText().toLowerCase();
    debug(`Message text: "${text}"`);

    // Handle wakewords
    const wakewords = process.env.MESSAGE_WAKEWORDS
        ? process.env.MESSAGE_WAKEWORDS.split(',').map(w => w.trim())
        : ['!help', '!ping'];
    debug(`Configured wakewords: ${wakewords.join(', ')}`);

    if (wakewords.some((wakeword) => text.startsWith(wakeword))) {
        debug('Wakeword detected. Setting chance to 1.');
        return 1;
    }

    // Bonus for interrobang punctuation
    if (/[!?]/.test(text.slice(1))) {
        const interrobangBonus = parseFloat(process.env.MESSAGE_INTERROBANG_BONUS || '0.2');
        chance += interrobangBonus;
        debug(`Interrobang detected. Added bonus: ${interrobangBonus}. Current chance: ${chance}`);
    }

    // Bonus for bot mention
    if (typeof message.mentionsUsers === 'function' && message.mentionsUsers(process.env.DISCORD_CLIENT_ID || '')) {
        const mentionBonus = parseFloat(process.env.MESSAGE_MENTION_BONUS || '0.8');
        chance += mentionBonus;
        debug(`Bot mentioned. Added bonus: ${mentionBonus}. Current chance: ${chance}`);
    }

    // Modifier for messages from other bots
    if (message.isFromBot()) {
        const botModifier = parseFloat(process.env.MESSAGE_BOT_RESPONSE_MODIFIER || '-1.0');
        chance += botModifier;
        debug(`Message from another bot. Applied modifier: ${botModifier}. Current chance: ${chance}`);
    }

    // Bonus for priority channels
    const priorityChannel = process.env.MESSAGE_PRIORITY_CHANNEL;
    if (priorityChannel && message.getChannelId() === priorityChannel) {
        const priorityBonus = parseFloat(process.env.MESSAGE_PRIORITY_CHANNEL_BONUS || '1.1');
        chance += priorityBonus;
        debug(`Priority channel detected. Added bonus: ${priorityBonus}. Current chance: ${chance}`);
    }

    // // Apply decay based on recent activity
    // const recentActivityDecayRate = parseFloat(
    //     process.env.MESSAGE_RECENT_ACTIVITY_DECAY_RATE || '0.5'
    // );
    // const decayFactor = Math.exp(
    //     -recentActivityDecayRate * (timeSinceLastActivity / activityTimeWindow)
    // );
    // debug(`Decay factor based on recent activity: ${decayFactor}`);
    // chance *= decayFactor;
    // debug(`Chance after applying decay: ${chance}`);

    // Cap the chance at 1
    const finalChance = Math.min(chance, 1);
    debug(`Final capped chance: ${finalChance}`);

    return finalChance;
}
