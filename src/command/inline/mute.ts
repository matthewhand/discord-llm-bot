import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import { getRandomErrorMessage } from '../../utils/errorMessages';
import logger from '../../logging/logger';

export const data = new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutes a user')
    .addUserOption(option => 
        option.setName('target')
            .setDescription('The user to mute')
            .setRequired(true));

export async function execute(interaction: CommandInteraction): Promise<void> {
    const target = interaction.options.getUser('target');
    if (!target) {
        await interaction.reply({ content: getRandomErrorMessage(), ephemeral: true });
        return;
    }

    try {
        // Mute logic here
        logger.info('User ' + target.tag + ' has been muted.');
        await interaction.reply('User ' + target.tag + ' has been muted.');
    } catch (error: any) {
        logger.error('Error muting user: ' + error.message);
        await interaction.reply({ content: getRandomErrorMessage(), ephemeral: true });
    }
}