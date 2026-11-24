const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('عرض سرعة استجابة البوت')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    await interaction.deferReply();
    const latency = Date.now() - interaction.createdTimestamp;
    const embed = embeds.base()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: 'استجابة البوت', value: `\`${latency}ms\``, inline: true },
        { name: 'اتصال API', value: `\`${Math.round(interaction.client.ws.ping)}ms\``, inline: true },
      );
    await interaction.editReply({ embeds: [embed] });
  },
};
