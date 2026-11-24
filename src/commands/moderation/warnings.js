const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const storage = require('../../utils/storage');
const { unix } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('عرض تحذيرات عضو')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('member').setDescription('العضو').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('member');
    const list = storage.getWarns(interaction.guild.id, user.id);
    if (!list.length) return interaction.reply({ embeds: [embeds.info(`لا توجد تحذيرات على ${user}.`)], flags: MessageFlags.Ephemeral });

    const text = list.slice(-10).map((w) => `**#${w.id}** • <t:${unix(w.date)}:d> • <@${w.moderatorId}>\n↳ ${w.reason}`).join('\n\n');
    await interaction.reply({
      embeds: [embeds.base().setTitle(`⚠️ تحذيرات ${user.username} (${list.length})`).setDescription(text.slice(0, 4000))],
      flags: MessageFlags.Ephemeral,
    });
  },
};
