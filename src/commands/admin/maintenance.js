const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const storage = require('../../utils/storage');
const maintenance = require('../../utils/maintenance');
const { controlPayload } = require('../../utils/panels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('maintenance')
    .setDescription('وضع الصيانة')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((s) => s.setName('on').setDescription('تفعيل الصيانة: إخفاء كل الرومات وإنشاء روم صيانة'))
    .addSubcommand((s) => s.setName('off').setDescription('إنهاء الصيانة واسترجاع كل شيء'))
    .addSubcommand((s) => s.setName('roles').setDescription('تحديد رتب الإدارة التي تظل ترى الرومات أثناء الصيانة')
      .addRoleOption((o) => o.setName('role1').setDescription('الرتبة 1').setRequired(true))
      .addRoleOption((o) => o.setName('role2').setDescription('الرتبة 2'))
      .addRoleOption((o) => o.setName('role3').setDescription('الرتبة 3'))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const eph = { flags: MessageFlags.Ephemeral };
    const { guild } = interaction;

    if (sub === 'roles') {
      const ids = [1, 2, 3].map((i) => interaction.options.getRole(`role${i}`)).filter(Boolean).map((r) => r.id);
      storage.setGuild(guild.id, { staffRoles: ids });
      return interaction.reply({ embeds: [embeds.success(`رتب الصيانة: ${ids.map((id) => `<@&${id}>`).join(' ')}\n(الرتب التي فيها Administrator تظل ترى دائماً)`)], ...eph });
    }

    await interaction.deferReply(eph);
    try {
      if (sub === 'on') {
        const r = await maintenance.enable(guild, interaction.user);
        await interaction.editReply({ embeds: [embeds.success(`تم تفعيل وضع الصيانة. (${r.done} روم${r.failed ? ` • فشل ${r.failed}` : ''})`)] });
      } else {
        const r = await maintenance.disable(guild);
        await interaction.editReply({ embeds: [embeds.success(`تم إنهاء الصيانة واسترجاع ${r.restored} روم${r.failed ? ` • فشل ${r.failed}` : ''}.`)] });
      }
      // تحديث لوحة التحكم إن وُجدت
      const s = storage.getGuild(guild.id);
      const ch = s.controlChannel && guild.channels.cache.get(s.controlChannel);
      if (ch) {
        const msgs = await ch.messages.fetch({ limit: 20 }).catch(() => null);
        const panel = msgs?.find((m) => m.author.id === guild.client.user.id && m.components.some((r) => r.components.some((c) => c.customId === 'ctrl:maint')));
        if (panel) await panel.edit(controlPayload(guild)).catch(() => {});
      }
    } catch (e) {
      await interaction.editReply({ embeds: [embeds.error(e.message)] });
    }
  },
};
