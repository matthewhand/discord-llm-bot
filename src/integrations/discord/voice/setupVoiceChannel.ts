import ConfigurationManager from '@src/common/config/ConfigurationManager';

const configManager = ConfigurationManager.getInstance();

export function setupVoiceChannel() {
    const welcomeMessage = configManager.DISCORD_WELCOME_MESSAGE;
    const apiKey = configManager.OPENAI_API_KEY;
    const model = configManager.OPENAI_MODEL;

    // Logic to set up the voice channel using the configuration values
}
