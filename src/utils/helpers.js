const { PermissionFlagsBits: P } = require('discord.js');
const config = require('../config/config');
const storage = require('./storage');
const logger = require('./logger');
const embeds = require('./embeds');

const DANGEROUS = [
  P.Administrator, P.ManageGuild, P.ManageRoles, P.ManageChannels, P.BanMembers,
  P.KickMembers, P.ModerateMembers, P.ManageMessages, P.ManageWebhooks, P.MentionEveryone,
];

/** هل يمكن إعطاء هذه الرتبة عبر البوت بأمان؟ */
function isAssignable(guild, role) {
  const me = guild.members.me;
  return !!role && role.id !== guild.id && !role.managed &&
    role.position < me.roles.highest.position && !role.permissions.any(DANGEROUS);
}

/** فحص تسلسل الرتب قبل تنفيذ عقوبة. يرجع نص الخطأ أو null */
function checkHierarchy(interaction, target) {
  const me = interaction.guild.members.me;
  const mod = interaction.member;
  if (target.id === interaction.user.id) return 'لا يمكنك تنفيذ هذا الإجراء على نفسك.';
  if (target.id === interaction.client.user.id) return 'لا يمكنك تنفيذ هذا الإجراء على البوت.';
  if (target.id === interaction.guild.ownerId) return 'لا يمكن تنفيذ الإجراء على مالك السيرفر.';
  if (interaction.guild.ownerId !== mod.id && target.roles.highest.position >= mod.roles.highest.position)
    return 'رتبة العضو أعلى من رتبتك أو مساوية لها.';
  if (target.roles.highest.position >= me.roles.highest.position)
    return 'رتبة العضو أعلى من رتبة البوت أو مساوية لها.';
  return null;
}

/** يحوّل 10m / 2h / 1d / 1w إلى ميلي ثانية. "0" = إزالة. null = غير صالح */
function parseDuration(str) {
  const s = String(str).trim().toLowerCase();
  if (s === '0') return 0;
  const m = s.match(/^(\d+)\s*(s|m|h|d|w)$/);
  if (!m) return null;
  const mult = { s: 1e3, m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[m[2]];
  return Number(m[1]) * mult;
}

function formatDuration(ms) {
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24;
  const m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
  const parts = [];
  if (d) parts.push(`${d} يوم`);
  if (h) parts.push(`${h} ساعة`);
  if (m) parts.push(`${m} دقيقة`);
  if (s) parts.push(`${s} ثانية`);
  return parts.join(' و ') || '0 ثانية';
}

const unix = (date) => Math.floor(new Date(date).getTime() / 1000);

/** إرسال إيمبد لروم السجلات (لا يرمي أخطاء) */
async function sendLog(guild, embed) {
  try {
    const { logChannel } = storage.getGuild(guild.id);
    if (!logChannel) return;
    const ch = guild.channels.cache.get(logChannel) || (await guild.channels.fetch(logChannel).catch(() => null));
    if (ch?.isTextBased()) await ch.send({ embeds: [embed] });
  } catch (e) {
    logger.warn('تعذر إرسال السجل:', e.message);
  }
}

function modLogEmbed({ action, target, moderator, reason, fields = [] }) {
  return embeds.base(config.colors.accent)
    .setTitle(`⚖️ ${action}`)
    .addFields(
      { name: 'العضو', value: `${target} • \`${target.id}\``, inline: true },
      { name: 'المشرف', value: `${moderator} • \`${moderator.id}\``, inline: true },
      ...fields,
      { name: 'السبب', value: String(reason).slice(0, 1000) },
    );
}

async function dmUser(user, embed) {
  try { await user.send({ embeds: [embed] }); return true; } catch { return false; }
}

module.exports = { isAssignable, checkHierarchy, parseDuration, formatDuration, unix, sendLog, modLogEmbed, dmUser };
