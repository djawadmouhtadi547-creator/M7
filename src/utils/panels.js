const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const config = require('../config/config');
const embeds = require('./embeds');
const storage = require('./storage');
const { unix } = require('./helpers');

async function sendRulesPanel(channel, role) {
  const embed = embeds.base()
    .setTitle('📜 قوانين سيرفر M 7')
    .setDescription(config.rules.map((r, i) => `**${i + 1}.** ${r}`).join('\n\n') +
      `\n\nبالضغط على الزر بالأسفل فإنك توافق على القوانين وتحصل على رتبة ${role}.`);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('rules:accept').setLabel('أوافق على القوانين').setEmoji('✅').setStyle(ButtonStyle.Danger),
  );
  return channel.send({ embeds: [embed], components: [row] });
}

async function sendTicketPanel(channel) {
  const embed = embeds.base()
    .setTitle('🎫 مركز الدعم — M 7')
    .setDescription('هل تحتاج مساعدة؟ اختر نوع التذكرة من القائمة بالأسفل وسيتم فتح روم خاص بك مع الفريق المختص.\n\n' +
      Object.values(config.ticketTypes).map((t) => `${t.emoji} **${t.label}** — ${t.description}`).join('\n'));
  const menu = new StringSelectMenuBuilder().setCustomId('ticket:open').setPlaceholder('اختر نوع التذكرة...')
    .addOptions(Object.entries(config.ticketTypes).map(([value, t]) => ({ label: t.label, value, description: t.description, emoji: t.emoji })));
  return channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
}

async function sendRolesPanel(channel, roles, title = '🎭 اختر رتبك') {
  const embed = embeds.base().setTitle(title).setDescription('اضغط لإضافة الرتبة أو إزالتها:\n\n' + roles.map((r) => `• ${r}`).join('\n'));
  const row = new ActionRowBuilder().addComponents(
    roles.slice(0, 5).map((r) => new ButtonBuilder().setCustomId(`roles:t:${r.id}`).setLabel(r.name.slice(0, 80)).setStyle(ButtonStyle.Secondary)),
  );
  return channel.send({ embeds: [embed], components: [row] });
}

async function sendWelcomePanel(channel) {
  const embed = embeds.base()
    .setTitle('✦ أهلاً بك في M 7 ✦')
    .setDescription('سيرفر بطابع داكن وفخم.\n\n**للدخول:** اذهب إلى روم القوانين واضغط على زر الموافقة لتفتح لك باقي الرومات.\n**للمساعدة:** افتح تذكرة من روم الدعم.');
  return channel.send({ embeds: [embed] });
}

/** لوحة التحكم (تعتمد على حالة الصيانة الحالية) */
function controlPayload(guild) {
  const m = storage.getMaintenance(guild.id);
  const embed = embeds.base()
    .setTitle('🎛️ لوحة تحكم M 7')
    .setDescription('تحكم بالسيرفر عبر الأزرار بالأسفل. (للإدارة فقط)')
    .addFields(
      { name: 'الحالة', value: m?.active ? `🔴 **وضع الصيانة مفعّل** منذ <t:${unix(m.since)}:R>` : '🟢 السيرفر يعمل بشكل طبيعي', inline: false },
      { name: 'الأعضاء', value: `${guild.memberCount}`, inline: true },
      { name: 'التذاكر المفتوحة', value: `${storage.countTickets(guild.id)}`, inline: true },
    );
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ctrl:maint').setLabel(m?.active ? 'إنهاء الصيانة' : 'وضع الصيانة').setEmoji('🔧')
      .setStyle(m?.active ? ButtonStyle.Success : ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ctrl:announce').setLabel('إعلان').setEmoji('📢').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ctrl:status').setLabel('الحالة').setEmoji('📊').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ctrl:backup').setLabel('نسخة احتياطية').setEmoji('💾').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ctrl:refresh').setLabel('تحديث').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
  );
  return { embeds: [embed], components: [row] };
}

const sendControlPanel = (channel) => channel.send(controlPayload(channel.guild));

module.exports = { sendRulesPanel, sendTicketPanel, sendRolesPanel, sendWelcomePanel, controlPayload, sendControlPanel };
