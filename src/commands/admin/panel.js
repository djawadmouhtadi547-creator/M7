const {
  SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ChannelType, MessageFlags,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');
const config = require('../../config/config');
const embeds = require('../../utils/embeds');
const storage = require('../../utils/storage');
const { isAssignable } = require('../../utils/helpers');

const textTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement];
const chOpt = (o) => o.setName('channel').setDescription('الروم (الافتراضي: الحالي)').addChannelTypes(...textTypes);

const builder = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('إرسال لوحات التذاكر والقوانين والرتب (للمدراء)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((s) => s.setName('ticket').setDescription('إرسال لوحة التذاكر').addChannelOption(chOpt))
  .addSubcommand((s) => s.setName('rules').setDescription('إرسال القوانين مع زر الموافقة')
    .addRoleOption((o) => o.setName('role').setDescription('رتبة العضوية (الافتراضي: الرتبة التلقائية)'))
    .addChannelOption(chOpt))
  .addSubcommand((s) => {
    s.setName('roles').setDescription('إرسال لوحة رتب اختيارية')
      .addRoleOption((o) => o.setName('role1').setDescription('الرتبة 1').setRequired(true))
      .addStringOption((o) => o.setName('style').setDescription('الشكل').addChoices({ name: 'أزرار', value: 'buttons' }, { name: 'قائمة منسدلة', value: 'menu' }))
      .addStringOption((o) => o.setName('title').setDescription('عنوان اللوحة').setMaxLength(200))
      .addChannelOption(chOpt);
    for (let i = 2; i <= 5; i++) s.addRoleOption((o) => o.setName(`role${i}`).setDescription(`الرتبة ${i}`));
    return s;
  });

module.exports = {
  data: builder,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const err = (t) => interaction.reply({ embeds: [embeds.error(t)], flags: MessageFlags.Ephemeral });

    const perms = channel.permissionsFor(guild.members.me);
    if (!perms?.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) return err('ليست لدي صلاحية الإرسال في هذا الروم.');

    // ---------- لوحة التذاكر ----------
    if (sub === 'ticket') {
      if (!storage.getGuild(guild.id).ticketCategory) return err('نفّذ `/setup tickets` أولاً لتحديد قسم التذاكر.');
      const embed = embeds.base()
        .setTitle('🎫 مركز الدعم — M 7')
        .setDescription('هل تحتاج مساعدة؟ اختر نوع التذكرة من القائمة بالأسفل وسيتم فتح روم خاص بك مع الفريق المختص.\n\n' +
          Object.values(config.ticketTypes).map((t) => `${t.emoji} **${t.label}** — ${t.description}`).join('\n'));
      const menu = new StringSelectMenuBuilder()
        .setCustomId('ticket:open')
        .setPlaceholder('اختر نوع التذكرة...')
        .addOptions(Object.entries(config.ticketTypes).map(([value, t]) => ({ label: t.label, value, description: t.description, emoji: t.emoji })));
      await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
      return interaction.reply({ embeds: [embeds.success(`تم إرسال لوحة التذاكر في ${channel}.`)], flags: MessageFlags.Ephemeral });
    }

    // ---------- لوحة القوانين ----------
    if (sub === 'rules') {
      const role = interaction.options.getRole('role');
      const s = storage.getGuild(guild.id);
      const finalRole = role || (s.memberRole && guild.roles.cache.get(s.memberRole));
      if (!finalRole) return err('حدد رتبة العضوية، أو فعّل `/setup welcome` لإنشاء الرتبة الأساسية.');
      if (!finalRole.editable) return err('رتبة البوت يجب أن تكون أعلى من رتبة العضوية.');
      storage.setGuild(guild.id, { rulesRole: finalRole.id });

      const embed = embeds.base()
        .setTitle('📜 قوانين سيرفر M 7')
        .setDescription(config.rules.map((r, i) => `**${i + 1}.** ${r}`).join('\n\n') +
          `\n\nبالضغط على الزر بالأسفل فإنك توافق على القوانين وتحصل على رتبة ${finalRole}.`);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('rules:accept').setLabel('أوافق على القوانين').setEmoji('✅').setStyle(ButtonStyle.Danger),
      );
      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ embeds: [embeds.success(`تم إرسال القوانين في ${channel}.`)], flags: MessageFlags.Ephemeral });
    }

    // ---------- لوحة الرتب ----------
    if (sub === 'roles') {
      const roles = [...new Map(
        [1, 2, 3, 4, 5].map((i) => interaction.options.getRole(`role${i}`)).filter(Boolean).map((r) => [r.id, r]),
      ).values()];
      const bad = roles.filter((r) => !isAssignable(guild, r));
      if (bad.length) return err(`لا يمكن استخدام: ${bad.map((r) => r.name).join('، ')}\nالرتبة يجب أن تكون أقل من رتبة البوت، وليست رتبة بوت، ولا تحتوي على صلاحيات إدارية.`);

      const style = interaction.options.getString('style') || 'buttons';
      const title = interaction.options.getString('title') || '🎭 اختر رتبك';
      const embed = embeds.base().setTitle(title)
        .setDescription('اضغط لإضافة الرتبة أو إزالتها:\n\n' + roles.map((r) => `• ${r}`).join('\n'));

      let row;
      if (style === 'menu') {
        row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder().setCustomId('roles:menu').setPlaceholder('اختر رتبك...')
            .setMinValues(0).setMaxValues(roles.length)
            .addOptions(roles.map((r) => ({ label: r.name.slice(0, 100), value: r.id }))),
        );
      } else {
        row = new ActionRowBuilder().addComponents(
          roles.map((r) => new ButtonBuilder().setCustomId(`roles:t:${r.id}`).setLabel(r.name.slice(0, 80)).setStyle(ButtonStyle.Secondary)),
        );
      }
      await channel.send({ embeds: [embed], components: [row] });
      return interaction.reply({ embeds: [embeds.success(`تم إرسال لوحة الرتب في ${channel}.`)], flags: MessageFlags.Ephemeral });
    }
  },
};
