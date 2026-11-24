const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const storage = require('../../utils/storage');
const { sendLog, modLogEmbed } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('حذف تحذير من عضو')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('member').setDescription('العضو').setRequired(true))
    .addIntegerOption((o) => o.setName('warn_id').setDescription('رقم التحذير (من /warnings)').setMinValue(1).setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('member');
    const id = interaction.options.getInteger('warn_id');
    const ok = storage.removeWarn(interaction.guild.id, user.id, id);
    if (!ok) return interaction.reply({ embeds: [embeds.error('لم يتم العثور على هذا التحذير.')], flags: MessageFlags.Ephemeral });

    await interaction.reply({ embeds: [embeds.success(`تم حذف التحذير **#${id}** عن ${user}.`)] });
    await sendLog(interaction.guild, modLogEmbed({ action: 'حذف تحذير', target: user, moderator: interaction.user, reason: `التحذير #${id}` }));
  },
};
