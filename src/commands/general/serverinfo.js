const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { serverInfoEmbed } = require('../../utils/infoEmbeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('عرض معلومات السيرفر')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    await interaction.reply({ embeds: [serverInfoEmbed(interaction.guild)] });
  },
};
