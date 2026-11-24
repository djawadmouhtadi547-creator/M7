const {
  SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, MessageFlags,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const { isBuilding } = require('../../utils/builder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rebuild')
    .setDescription('⚠️ حذف كل الرومات وإعادة بناء السيرفر بالكامل (Administrator)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .addBooleanOption((o) => o.setName('reset_roles').setDescription('حذف الرتب القديمة وإنشاء رتب جديدة (الافتراضي: نعم)'))
    .addBooleanOption((o) => o.setName('assign_members').setDescription('إعطاء رتبة M7 Member لكل الأعضاء الحاليين (الافتراضي: نعم)')),
  async execute(interaction) {
    const { guild, user } = interaction;
    const eph = { flags: MessageFlags.Ephemeral };
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [embeds.error('هذا الأمر للمدراء فقط.')], ...eph });
    }
    if (!guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [embeds.error('أحتاج صلاحية **Administrator** لأتمكن من إعادة البناء. أعطني إياها ثم أعد المحاولة.')], ...eph });
    }
    if (isBuilding(guild.id)) return interaction.reply({ embeds: [embeds.error('هناك عملية بناء تعمل حالياً.')], ...eph });

    const reset = interaction.options.getBoolean('reset_roles') ?? true;
    const assign = interaction.options.getBoolean('assign_members') ?? true;

    const embed = embeds.base()
      .setTitle('⚠️ تحذير: إعادة بناء السيرفر')
      .setDescription(
        `سيتم **حذف جميع الرومات (${guild.channels.cache.filter((c) => !c.isThread()).size})** نهائياً` +
        `${reset ? ` و**الرتب القديمة (${guild.roles.cache.size - 1})**` : ''} ثم بناء هيكلة M 7 الجديدة مع كل الأنظمة.\n\n` +
        '• تُرسل لك نسخة احتياطية (JSON) في الخاص قبل الحذف.\n' +
        '• الرسائل المحذوفة **لا يمكن استرجاعها**.\n' +
        `• ${reset ? 'الأعضاء سيفقدون رتبهم القديمة ويحصلون على رتبة M7 Member.' : 'الرتب القديمة ستبقى كما هي.'}\n\n` +
        'اضغط **متابعة** ثم اكتب كلمة التأكيد.');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`rebuild:go:${user.id}:${reset ? 1 : 0}:${assign ? 1 : 0}`).setLabel('متابعة').setEmoji('⚠️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`rebuild:cancel:${user.id}`).setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
    );
    await interaction.reply({ embeds: [embed], components: [row], ...eph });
  },
};
