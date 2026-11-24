const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { sendControlPanel } = require('../../utils/panels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('control')
    .setDescription('إرسال لوحة تحكم الإدارة في هذا الروم')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    await sendControlPanel(interaction.channel);
    await interaction.reply({ embeds: [embeds.success('تم إرسال لوحة التحكم.')], flags: MessageFlags.Ephemeral });
  },
};
