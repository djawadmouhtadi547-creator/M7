const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { checkHierarchy, sendLog, modLogEmbed, dmUser } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('حظر عضو من السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('العضو').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('سبب الحظر').setMaxLength(500))
    .addIntegerOption((o) => o.setName('delete_days').setDescription('حذف رسائل آخر (أيام) 0-7').setMinValue(0).setMaxValue(7)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'لم يُذكر سبب';
    const days = interaction.options.getInteger('delete_days') ?? 0;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member) {
      const err = checkHierarchy(interaction, member);
      if (err) return interaction.reply({ embeds: [embeds.error(err)], flags: MessageFlags.Ephemeral });
      if (!member.bannable) return interaction.reply({ embeds: [embeds.error('لا أستطيع حظر هذا العضو.')], flags: MessageFlags.Ephemeral });
    } else if (user.id === interaction.user.id) {
      return interaction.reply({ embeds: [embeds.error('لا يمكنك حظر نفسك.')], flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply();
    await dmUser(user, embeds.base().setTitle(`🔨 تم حظرك من ${interaction.guild.name}`).setDescription(`**السبب:** ${reason}`));
    await interaction.guild.members.ban(user, { deleteMessageSeconds: days * 86400, reason: `${interaction.user.username}: ${reason}` });

    await interaction.editReply({ embeds: [embeds.success(`تم حظر ${user} • السبب: ${reason}`)] });
    await sendLog(interaction.guild, modLogEmbed({ action: 'حظر', target: user, moderator: interaction.user, reason }));
  },
};
