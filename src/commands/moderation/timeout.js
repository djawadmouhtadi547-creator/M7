const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { checkHierarchy, sendLog, modLogEmbed, dmUser, parseDuration, formatDuration } = require('../../utils/helpers');

const MAX = 28 * 864e5;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('كتم عضو مؤقتاً (Timeout)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('member').setDescription('العضو').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('المدة: 30s / 10m / 2h / 1d / 1w — أو 0 لإزالة الكتم').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('السبب').setMaxLength(500)),
  async execute(interaction) {
    const member = interaction.options.getMember('member');
    const reason = interaction.options.getString('reason') || 'لم يُذكر سبب';
    const ms = parseDuration(interaction.options.getString('duration'));

    if (!member) return interaction.reply({ embeds: [embeds.error('هذا العضو غير موجود في السيرفر.')], flags: MessageFlags.Ephemeral });
    if (ms === null) return interaction.reply({ embeds: [embeds.error('مدة غير صالحة. أمثلة: `30s` `10m` `2h` `1d` `1w` أو `0` للإزالة.')], flags: MessageFlags.Ephemeral });
    if (ms > MAX) return interaction.reply({ embeds: [embeds.error('أقصى مدة للكتم هي 28 يوماً.')], flags: MessageFlags.Ephemeral });

    const err = checkHierarchy(interaction, member);
    if (err) return interaction.reply({ embeds: [embeds.error(err)], flags: MessageFlags.Ephemeral });
    if (!member.moderatable) return interaction.reply({ embeds: [embeds.error('لا أستطيع كتم هذا العضو.')], flags: MessageFlags.Ephemeral });

    await interaction.deferReply();
    if (ms === 0) {
      await member.timeout(null, reason);
      await interaction.editReply({ embeds: [embeds.success(`تمت إزالة الكتم عن ${member.user}.`)] });
      return sendLog(interaction.guild, modLogEmbed({ action: 'إزالة كتم', target: member.user, moderator: interaction.user, reason }));
    }

    await member.timeout(ms, `${interaction.user.username}: ${reason}`);
    await dmUser(member.user, embeds.base().setTitle(`🔇 تم كتمك في ${interaction.guild.name}`).setDescription(`**المدة:** ${formatDuration(ms)}\n**السبب:** ${reason}`));
    await interaction.editReply({ embeds: [embeds.success(`تم كتم ${member.user} لمدة **${formatDuration(ms)}** • السبب: ${reason}`)] });
    await sendLog(interaction.guild, modLogEmbed({
      action: 'كتم مؤقت', target: member.user, moderator: interaction.user, reason,
      fields: [{ name: 'المدة', value: formatDuration(ms), inline: true }],
    }));
  },
};
