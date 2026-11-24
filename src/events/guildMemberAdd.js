const config = require('../config/config');
const storage = require('../utils/storage');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');
const { unix, sendLog } = require('../utils/helpers');

module.exports = {
  name: 'guildMemberAdd',
  async execute(client, member) {
    const { guild } = member;
    const s = storage.getGuild(guild.id);

    if (s.welcomeEnabled) {
      // رتبة تلقائية
      if (s.memberRole && !member.user.bot) {
        const role = guild.roles.cache.get(s.memberRole);
        if (role) await member.roles.add(role, 'M 7 • رتبة تلقائية عند الدخول').catch((e) => logger.warn('تعذر إعطاء الرتبة التلقائية:', e.message));
      }
      // رسالة ترحيب
      const channel = s.welcomeChannel && (guild.channels.cache.get(s.welcomeChannel) || await guild.channels.fetch(s.welcomeChannel).catch(() => null));
      if (channel?.isTextBased()) {
        const embed = embeds.base(config.colors.primary)
          .setTitle('✦ مرحباً بك في M 7 ✦')
          .setDescription(`أهلاً بك ${member} بيننا!\nنتمنى لك وقتاً ممتعاً، ولا تنسَ قراءة القوانين.`)
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: '👥 رقم العضو', value: `#${guild.memberCount}`, inline: true },
            { name: '📅 إنشاء الحساب', value: `<t:${unix(member.user.createdAt)}:R>`, inline: true },
          );
        await channel.send({ content: `${member}`, embeds: [embed], allowedMentions: { users: [member.id] } })
          .catch((e) => logger.warn('تعذر إرسال الترحيب:', e.message));
      }
    }

    await sendLog(guild, embeds.base(config.colors.primary)
      .setTitle('📥 عضو جديد')
      .setDescription(`${member} • \`${member.id}\`\nإنشاء الحساب: <t:${unix(member.user.createdAt)}:R>\nعدد الأعضاء: **${guild.memberCount}**`)
      .setThumbnail(member.user.displayAvatarURL()));
  },
};
