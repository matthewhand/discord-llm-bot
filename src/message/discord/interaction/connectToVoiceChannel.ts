import { Client } from "discord.js"; import { VoiceConnection } from "@discordjs/voice"; import Debug from "debug"; const logger = Debug("app");; import { setupVoiceChannel } from "../voice/setupVoiceChannel"; import { playWelcomeMessage } from "../voice/playWelcomeMessage"; export async function connectToVoiceChannel(client: Client, channelId: string): Promise<VoiceConnection> { logger.info(`DiscordManager: Connecting to voice channel ID: ${channelId}`); const connection = await setupVoiceChannel(client); logger.info("DiscordManager: Playing welcome message"); if (connection) { playWelcomeMessage(connection); } return connection!; }
