const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const config = require('../../config/config');
const embeds = require('../../utils/embeds');
const { sendLog } = require('../../utils/helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('حذف عدد من الرسائل')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption((o) => o.setName('amount').setDescription('عدد الرسائل (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
    .addUserOption((o) => o.setName('user').setDescription('حذف رسائل عضو معيّن فقط')),
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    const channel = interaction.channel;

    if (!channel?.isTextBased() || !channel.bulkDelete) {
      return interaction.reply({ embeds: [embeds.error('لا يمكن الحذف في هذا الروم.')], flags: MessageFlags.Ephemeral });
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let messages = await channel.messages.fetch({ limit: user ? 100 : amount });
    if (user) messages = messages.filter((m) => m.author.id === user.id);
    const list = [...messages.values()].slice(0, amount);
    const deleted = await channel.bulkDelete(list, true);

    await interaction.editReply({ embeds: [embeds.success(`تم حذف **${deleted.size}** رسالة. (الرسائل الأقدم من 14 يوماً لا تُحذف)`)] });
    await sendLog(interaction.guild, embeds.base(config.colors.accent)
      .setTitle('🧹 حذف رسائل')
      .addFields(
        { name: 'المشرف', value: `${interaction.user}`, inline: true },
        { name: 'الروم', value: `${channel}`, inline: true },
        { name: 'العدد', value: `${deleted.size}`, inline: true },
      ));
  },
};
