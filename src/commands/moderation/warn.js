const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const storage = require('../../utils/storage');
const { checkHierarchy, sendLog, modLogEmbed, dmUser } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('تحذير عضو')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('member').setDescription('العضو').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('سبب التحذير').setMaxLength(500).setRequired(true)),
  async execute(interaction) {
    const member = interaction.options.getMember('member');
    const reason = interaction.options.getString('reason');
    if (!member) return interaction.reply({ embeds: [embeds.error('هذا العضو غير موجود في السيرفر.')], flags: MessageFlags.Ephemeral });

    const err = checkHierarchy(interaction, member);
    if (err) return interaction.reply({ embeds: [embeds.error(err)], flags: MessageFlags.Ephemeral });

    const list = storage.addWarn(interaction.guild.id, member.id, { reason, moderatorId: interaction.user.id });
    await dmUser(member.user, embeds.base().setTitle(`⚠️ تحذير في ${interaction.guild.name}`).setDescription(`**السبب:** ${reason}\n**عدد تحذيراتك:** ${list.length}`));

    await interaction.reply({ embeds: [embeds.success(`تم تحذير ${member.user} (التحذير رقم **${list.length}**) • السبب: ${reason}`)] });
    await sendLog(interaction.guild, modLogEmbed({
      action: 'تحذير', target: member.user, moderator: interaction.user, reason,
      fields: [{ name: 'إجمالي التحذيرات', value: `${list.length}`, inline: true }],
    }));
  },
};
