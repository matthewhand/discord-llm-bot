import { CommandInteraction, MessageEmbed } from 'discord.js';
import { ConfigurationManager } from '@config/ConfigurationManager';
import { SlashCommandBuilder } from '@discordjs/builders';

export const setLlmProviderCommand = new SlashCommandBuilder()
  .setName('llm:setProvider')
  .setDescription('Set the LLM provider for the current channel')
  .addStringOption(option =>
    option
      .setName('provider')
      .setDescription('The LLM provider to set (e.g., openai, flowise)')
      .setRequired(true)
  );

export async function handleSetLlmProvider(interaction: CommandInteraction) {
  const provider = interaction.options.getString('provider');
  const channelId = interaction.channelId;
  const configManager = ConfigurationManager.getInstance();

  if (provider !== 'openai' && provider !== 'flowise') {
    await interaction.reply('⚠️ Invalid provider. Choose either "openai" or "flowise".');
    return;
  }

  configManager.setSession('llm', channelId, { provider });

  // Create a flashy Discord-style embed
  const embed = new MessageEmbed()
    .setColor(provider === 'openai' ? '#5865F2' : '#F47B67') // OpenAI color or Flowise color
    .setTitle('🔮 The Prophecy Has Shifted!')
    .setDescription(`Behold! The LLM provider has now been set to **${provider.toUpperCase()}**! Brace yourself for a new age of AI-powered responses...`)
    .addField('🌀 Power Level Increased', `Your channel will now benefit from the immense wisdom of **${provider === 'openai' ? 'OpenAI\'s vast knowledge' : 'Flowise\'s arcane chatflow mastery'}**.`)
    .setFooter({ text: 'Remember, with great power comes great responses!' });

  // Adding absurd reactions for fun
  const message = await interaction.reply({ embeds: [embed], fetchReply: true });
  if (message) {
    await message.react('⚡'); // Lightning bolt for power
    await message.react('🎉'); // Party popper for celebration
  }
}
