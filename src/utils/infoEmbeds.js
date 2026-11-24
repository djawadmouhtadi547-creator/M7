const { ChannelType } = require('discord.js');
const embeds = require('./embeds');
const { unix } = require('./helpers');

function userInfoEmbed(user, member) {
  const e = embeds.base()
    .setTitle(`👤 ${user.username}`)
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .addFields(
      { name: 'المعرّف', value: `\`${user.id}\``, inline: true },
      { name: 'النوع', value: user.bot ? '🤖 بوت' : '🙂 عضو', inline: true },
      { name: 'تاريخ إنشاء الحساب', value: `<t:${unix(user.createdAt)}:F>\n<t:${unix(user.createdAt)}:R>` },
    );
  if (member) {
    const roles = member.roles.cache
      .filter((r) => r.id !== member.guild.id)
      .sort((a, b) => b.position - a.position)
      .first(10).map((r) => r.toString()).join(' ') || 'لا يوجد';
    e.addFields(
      { name: 'تاريخ الانضمام', value: member.joinedAt ? `<t:${unix(member.joinedAt)}:F>\n<t:${unix(member.joinedAt)}:R>` : 'غير معروف' },
      { name: 'أعلى رتبة', value: `${member.roles.highest}`, inline: true },
      { name: 'الرتب', value: roles },
    );
    if (member.displayColor) e.setColor(member.displayColor);
  }
  return e;
}

function serverInfoEmbed(guild) {
  const ch = guild.channels.cache;
  const text = ch.filter((c) => [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(c.type)).size;
  const voice = ch.filter((c) => [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(c.type)).size;
  const cats = ch.filter((c) => c.type === ChannelType.GuildCategory).size;
  return embeds.base()
    .setTitle(`✦ ${guild.name}`)
    .setThumbnail(guild.iconURL({ size: 256 }))
    .addFields(
      { name: '👑 المالك', value: `<@${guild.ownerId}>`, inline: true },
      { name: '👥 الأعضاء', value: `${guild.memberCount}`, inline: true },
      { name: '🎭 الرتب', value: `${guild.roles.cache.size}`, inline: true },
      { name: '💬 الرومات', value: `كتابي: ${text}\nصوتي: ${voice}\nأقسام: ${cats}`, inline: true },
      { name: '😀 الإيموجي', value: `${guild.emojis.cache.size}`, inline: true },
      { name: '🚀 البوست', value: `المستوى ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0})`, inline: true },
      { name: '📅 تاريخ الإنشاء', value: `<t:${unix(guild.createdAt)}:F>\n<t:${unix(guild.createdAt)}:R>` },
      { name: '🆔 المعرّف', value: `\`${guild.id}\`` },
    );
}

module.exports = { userInfoEmbed, serverInfoEmbed };
