const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ChannelType, MessageFlags } = require('discord.js');
const config = require('../../config/config');
const embeds = require('../../utils/embeds');
const storage = require('../../utils/storage');

const textTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement];
const show = (v, p) => (v ? `${p}${v}${p === '<#' || p === '<@&' ? '>' : ''}` : '`غير محدد`');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('إعداد أنظمة البوت (للمدراء)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((s) => s.setName('welcome').setDescription('تفعيل الترحيب + الرتبة التلقائية')
      .addChannelOption((o) => o.setName('channel').setDescription('روم الترحيب').addChannelTypes(...textTypes).setRequired(true))
      .addRoleOption((o) => o.setName('role').setDescription('الرتبة التلقائية (الافتراضي: M7 Member وتُنشأ تلقائياً)')))
    .addSubcommand((s) => s.setName('welcome-off').setDescription('إيقاف الترحيب والرتبة التلقائية'))
    .addSubcommand((s) => s.setName('leave').setDescription('تحديد روم رسائل المغادرة')
      .addChannelOption((o) => o.setName('channel').setDescription('روم المغادرة').addChannelTypes(...textTypes).setRequired(true)))
    .addSubcommand((s) => s.setName('logs').setDescription('تحديد روم السجلات')
      .addChannelOption((o) => o.setName('channel').setDescription('روم السجلات').addChannelTypes(...textTypes).setRequired(true)))
    .addSubcommand((s) => s.setName('tickets').setDescription('إعداد نظام التذاكر')
      .addChannelOption((o) => o.setName('category').setDescription('القسم (Category) الذي تُنشأ فيه التذاكر').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
      .addChannelOption((o) => o.setName('log_channel').setDescription('روم سجلات التذاكر (Transcripts)').addChannelTypes(...textTypes))
      .addRoleOption((o) => o.setName('tech_role').setDescription('رتبة الدعم الفني'))
      .addRoleOption((o) => o.setName('complaint_role').setDescription('رتبة الشكاوى'))
      .addRoleOption((o) => o.setName('admin_role').setDescription('رتبة الإدارة (ترى كل التذاكر)')))
    .addSubcommand((s) => s.setName('show').setDescription('عرض الإعدادات الحالية')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const reply = (e) => interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });

    if (sub === 'welcome') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      const channel = interaction.options.getChannel('channel');
      let role = interaction.options.getRole('role') || guild.roles.cache.find((r) => r.name === config.memberRoleName);
      if (!role) {
        role = await guild.roles.create({ name: config.memberRoleName, color: config.colors.primary, reason: 'M 7 • رتبة العضو الأساسية' }).catch(() => null);
      }
      if (!role) return interaction.editReply({ embeds: [embeds.error('تعذر إنشاء الرتبة. أعطني صلاحية Manage Roles.')] });
      if (!role.editable) return interaction.editReply({ embeds: [embeds.error('رتبة البوت يجب أن تكون أعلى من رتبة الأعضاء المختارة.')] });
      storage.setGuild(guild.id, { welcomeEnabled: true, welcomeChannel: channel.id, memberRole: role.id });
      return interaction.editReply({ embeds: [embeds.success(`تم تفعيل الترحيب في ${channel} وسيحصل الأعضاء الجدد على ${role}.`)] });
    }
    if (sub === 'welcome-off') {
      storage.setGuild(guild.id, { welcomeEnabled: false });
      return reply(embeds.success('تم إيقاف الترحيب والرتبة التلقائية.'));
    }
    if (sub === 'leave') {
      const channel = interaction.options.getChannel('channel');
      storage.setGuild(guild.id, { leaveChannel: channel.id });
      return reply(embeds.success(`تم تحديد ${channel} لرسائل المغادرة.`));
    }
    if (sub === 'logs') {
      const channel = interaction.options.getChannel('channel');
      storage.setGuild(guild.id, { logChannel: channel.id });
      return reply(embeds.success(`تم تحديد ${channel} كروم للسجلات.`));
    }
    if (sub === 'tickets') {
      const o = interaction.options;
      const patch = { ticketCategory: o.getChannel('category').id };
      if (o.getChannel('log_channel')) patch.ticketLogChannel = o.getChannel('log_channel').id;
      if (o.getRole('tech_role')) patch.techRole = o.getRole('tech_role').id;
      if (o.getRole('complaint_role')) patch.complaintRole = o.getRole('complaint_role').id;
      if (o.getRole('admin_role')) patch.adminRole = o.getRole('admin_role').id;
      storage.setGuild(guild.id, patch);
      return reply(embeds.success('تم حفظ إعدادات التذاكر. استخدم `/panel ticket` لإرسال لوحة التذاكر.'));
    }
    if (sub === 'show') {
      const s = storage.getGuild(guild.id);
      const e = embeds.base().setTitle('⚙️ إعدادات M 7').addFields(
        { name: 'الترحيب', value: s.welcomeEnabled ? `✅ ${show(s.welcomeChannel, '<#')}` : '❌ متوقف', inline: true },
        { name: 'الرتبة التلقائية', value: show(s.memberRole, '<@&'), inline: true },
        { name: 'المغادرة', value: show(s.leaveChannel, '<#'), inline: true },
        { name: 'السجلات', value: show(s.logChannel, '<#'), inline: true },
        { name: 'قسم التذاكر', value: show(s.ticketCategory, '<#'), inline: true },
        { name: 'سجل التذاكر', value: show(s.ticketLogChannel, '<#'), inline: true },
        { name: 'دعم فني', value: show(s.techRole, '<@&'), inline: true },
        { name: 'شكاوى', value: show(s.complaintRole, '<@&'), inline: true },
        { name: 'إدارة', value: show(s.adminRole, '<@&'), inline: true },
        { name: 'رتبة القوانين', value: show(s.rulesRole || s.memberRole, '<@&'), inline: true },
      );
      return reply(e);
    }
  },
};
