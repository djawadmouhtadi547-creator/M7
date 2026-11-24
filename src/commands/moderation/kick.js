const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { checkHierarchy, sendLog, modLogEmbed, dmUser } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('طرد عضو من السيرفر')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('member').setDescription('العضو').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('سبب الطرد').setMaxLength(500)),
  async execute(interaction) {
    const member = interaction.options.getMember('member');
    const reason = interaction.options.getString('reason') || 'لم يُذكر سبب';
    if (!member) return interaction.reply({ embeds: [embeds.error('هذا العضو غير موجود في السيرفر.')], flags: MessageFlags.Ephemeral });

    const err = checkHierarchy(interaction, member);
    if (err) return interaction.reply({ embeds: [embeds.error(err)], flags: MessageFlags.Ephemeral });
    if (!member.kickable) return interaction.reply({ embeds: [embeds.error('لا أستطيع طرد هذا العضو.')], flags: MessageFlags.Ephemeral });

    await interaction.deferReply();
    await dmUser(member.user, embeds.base().setTitle(`👢 تم طردك من ${interaction.guild.name}`).setDescription(`**السبب:** ${reason}`));
    await member.kick(`${interaction.user.username}: ${reason}`);

    await interaction.editReply({ embeds: [embeds.success(`تم طرد ${member.user} • السبب: ${reason}`)] });
    await sendLog(interaction.guild, modLogEmbed({ action: 'طرد', target: member.user, moderator: interaction.user, reason }));
  },
};
