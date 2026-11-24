const {
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits: P, MessageFlags,
} = require('discord.js');
const config = require('../config/config');
const embeds = require('../utils/embeds');
const storage = require('../utils/storage');
const logger = require('../utils/logger');
const { buildTranscript } = require('../utils/transcript');

const EPH = MessageFlags.Ephemeral;
const pad = (n) => String(n).padStart(4, '0');

function ticketEmbed(t) {
  const type = config.ticketTypes[t.type];
  return embeds.base()
    .setTitle(`🎫 تذكرة ${type.label} #${pad(t.number)}`)
    .setDescription(`أهلاً <@${t.ownerId}>، تم فتح تذكرتك بنجاح.\nاشرح مشكلتك بالتفصيل وسيرد عليك الفريق المختص في أقرب وقت.`)
    .addFields(
      { name: 'النوع', value: `${type.emoji} ${type.label}`, inline: true },
      { name: 'صاحب التذكرة', value: `<@${t.ownerId}>`, inline: true },
      { name: 'المستلم', value: t.claimedBy ? `<@${t.claimedBy}>` : 'لم تُستلم بعد', inline: true },
    );
}

function ticketRows(claimed) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:close').setLabel('إغلاق').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:claim').setLabel(claimed ? 'تم الاستلام' : 'استلام').setEmoji('🙋').setStyle(ButtonStyle.Success).setDisabled(claimed),
    new ButtonBuilder().setCustomId('ticket:transcript').setLabel('حفظ السجل').setEmoji('📄').setStyle(ButtonStyle.Secondary),
  )];
}

const isStaff = (member, t) =>
  member.permissions.has(P.ManageChannels) || t.staffRoleIds.some((id) => member.roles.cache.has(id));

async function sendTicketLog(guild, payload) {
  const s = storage.getGuild(guild.id);
  const id = s.ticketLogChannel || s.logChannel;
  if (!id) return;
  const ch = guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(() => null);
  if (ch?.isTextBased()) await ch.send(payload).catch((e) => logger.warn('تعذر إرسال سجل التذكرة:', e.message));
}

// ================= فتح تذكرة =================
async function open(interaction) {
  await interaction.deferReply({ flags: EPH });
  const { guild, user, client } = interaction;
  const fail = (t) => interaction.editReply({ embeds: [embeds.error(t)] });

  // إعادة ضبط القائمة (إزالة الاختيار الظاهر)
  interaction.message.edit({ components: interaction.message.components }).catch(() => {});

  const typeKey = interaction.values[0];
  const type = config.ticketTypes[typeKey];
  if (!type) return fail('نوع تذكرة غير معروف.');

  const s = storage.getGuild(guild.id);
  const category = s.ticketCategory && (guild.channels.cache.get(s.ticketCategory) || await guild.channels.fetch(s.ticketCategory).catch(() => null));
  if (!category) return fail('نظام التذاكر غير مُعد بعد. تواصل مع الإدارة.');

  // حد التذاكر المفتوحة + تنظيف التذاكر التي حُذف روماتها
  const existing = [];
  for (const t of storage.findTicketsByUser(guild.id, user.id)) {
    if (guild.channels.cache.has(t.channelId)) existing.push(t);
    else storage.deleteTicket(t.channelId);
  }
  if (existing.length >= config.maxOpenTicketsPerUser) return fail(`لديك تذكرة مفتوحة بالفعل: <#${existing[0].channelId}>`);

  const staffRoleIds = [...new Set([s[type.roleKey], s.adminRole].filter((id) => id && guild.roles.cache.has(id)))];
  const number = storage.nextTicketNumber(guild.id);

  const allowStaff = [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks, P.ManageMessages];
  const channel = await guild.channels.create({
    name: `ticket-${typeKey}-${pad(number)}`,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `ticket-owner:${user.id}`,
    reason: `M 7 • تذكرة ${type.label} من ${user.username}`,
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [P.ViewChannel] },
      { id: user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles, P.EmbedLinks] },
      ...staffRoleIds.map((id) => ({ id, allow: allowStaff })),
      { id: client.user.id, allow: [...allowStaff, P.ManageChannels] },
    ],
  });

  const ticket = {
    channelId: channel.id, guildId: guild.id, ownerId: user.id, type: typeKey,
    number, staffRoleIds, claimedBy: null, createdAt: Date.now(),
  };
  storage.saveTicket(ticket);

  await channel.send({
    content: `${user} ${staffRoleIds.map((id) => `<@&${id}>`).join(' ')}`.trim(),
    embeds: [ticketEmbed(ticket)],
    components: ticketRows(false),
    allowedMentions: { users: [user.id], roles: staffRoleIds },
  });

  await sendTicketLog(guild, { embeds: [embeds.base().setTitle('🎫 تذكرة جديدة')
    .setDescription(`${channel} • ${type.emoji} ${type.label}\nالعضو: ${user} • \`${user.id}\``)] });
  await interaction.editReply({ embeds: [embeds.success(`تم فتح تذكرتك: ${channel}`)] });
}

// ================= استلام =================
async function claim(interaction) {
  const t = storage.getTicket(interaction.channelId);
  const reply = (e) => interaction.reply({ embeds: [e], flags: EPH });
  if (!t) return reply(embeds.error('هذه ليست تذكرة مسجلة.'));
  if (!isStaff(interaction.member, t)) return reply(embeds.error('هذا الزر للطاقم المختص فقط.'));
  if (t.claimedBy) return reply(embeds.error(`التذكرة مستلمة مسبقاً من <@${t.claimedBy}>.`));

  t.claimedBy = interaction.user.id;
  storage.saveTicket(t);
  await interaction.update({ embeds: [ticketEmbed(t)], components: ticketRows(true) });
  await interaction.channel.send({ embeds: [embeds.info(`🙋 تم استلام التذكرة بواسطة ${interaction.user}.`)] });
}

// ================= سجل المحادثة =================
async function transcript(interaction) {
  const t = storage.getTicket(interaction.channelId);
  if (!t) return interaction.reply({ embeds: [embeds.error('هذه ليست تذكرة مسجلة.')], flags: EPH });
  if (!isStaff(interaction.member, t)) return interaction.reply({ embeds: [embeds.error('هذا الزر للطاقم المختص فقط.')], flags: EPH });
  await interaction.deferReply({ flags: EPH });
  const file = await buildTranscript(interaction.channel, t);
  await interaction.editReply({ embeds: [embeds.success('تم إنشاء سجل المحادثة.')], files: [file] });
}

// ================= إغلاق =================
async function close(interaction) {
  const t = storage.getTicket(interaction.channelId);
  if (!t) return interaction.reply({ embeds: [embeds.error('هذه ليست تذكرة مسجلة.')], flags: EPH });
  if (interaction.user.id !== t.ownerId && !isStaff(interaction.member, t)) {
    return interaction.reply({ embeds: [embeds.error('لا تملك صلاحية إغلاق هذه التذكرة.')], flags: EPH });
  }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:confirm').setLabel('تأكيد الإغلاق').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket:cancel').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
  );
  await interaction.reply({ embeds: [embeds.info('⚠️ هل أنت متأكد من إغلاق التذكرة؟ سيتم حفظ السجل ثم حذف الروم.')], components: [row], flags: EPH });
}

async function confirm(interaction) {
  const t = storage.getTicket(interaction.channelId);
  if (!t) return interaction.update({ embeds: [embeds.error('التذكرة مغلقة بالفعل.')], components: [] });
  if (interaction.user.id !== t.ownerId && !isStaff(interaction.member, t)) {
    return interaction.update({ embeds: [embeds.error('لا تملك صلاحية إغلاق هذه التذكرة.')], components: [] });
  }
  await interaction.update({ embeds: [embeds.info('⏳ جاري حفظ السجل وإغلاق التذكرة...')], components: [] });

  const { channel, guild, user } = interaction;
  const type = config.ticketTypes[t.type];
  storage.deleteTicket(channel.id);

  try {
    const file = await buildTranscript(channel, t);
    const logEmbed = embeds.base().setTitle(`🔒 تذكرة مغلقة #${pad(t.number)}`).addFields(
      { name: 'النوع', value: `${type.emoji} ${type.label}`, inline: true },
      { name: 'صاحب التذكرة', value: `<@${t.ownerId}>`, inline: true },
      { name: 'أغلقها', value: `${user}`, inline: true },
      { name: 'المستلم', value: t.claimedBy ? `<@${t.claimedBy}>` : 'لا أحد', inline: true },
    );
    await sendTicketLog(guild, { embeds: [logEmbed], files: [file] });

    const owner = await interaction.client.users.fetch(t.ownerId).catch(() => null);
    if (owner) {
      const dmFile = await buildTranscript(channel, t);
      await owner.send({ embeds: [embeds.base().setTitle(`🔒 تم إغلاق تذكرتك في ${guild.name}`).setDescription('نرفق لك سجل المحادثة.')], files: [dmFile] }).catch(() => {});
    }
  } catch (e) {
    logger.error('خطأ أثناء حفظ سجل التذكرة:', e);
  }

  await channel.send({ embeds: [embeds.info('🗑️ سيتم حذف هذا الروم خلال 5 ثوانٍ...')] }).catch(() => {});
  setTimeout(() => channel.delete(`M 7 • إغلاق التذكرة بواسطة ${user.username}`).catch((e) => logger.warn('تعذر حذف روم التذكرة:', e.message)), 5000);
}

module.exports = {
  name: 'ticket',
  async execute(interaction, args) {
    switch (args[0]) {
      case 'open': return open(interaction);
      case 'claim': return claim(interaction);
      case 'transcript': return transcript(interaction);
      case 'close': return close(interaction);
      case 'confirm': return confirm(interaction);
      case 'cancel': return interaction.update({ embeds: [embeds.info('تم إلغاء الإغلاق.')], components: [] });
    }
  },
};
