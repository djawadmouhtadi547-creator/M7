const config = require('../config/config');
const storage = require('../utils/storage');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');
const { sendLog } = require('../utils/helpers');

module.exports = {
  name: 'guildMemberRemove',
  async execute(client, member) {
    const { guild, user } = member;
    const s = storage.getGuild(guild.id);

    const channel = s.leaveChannel && (guild.channels.cache.get(s.leaveChannel) || await guild.channels.fetch(s.leaveChannel).catch(() => null));
    if (channel?.isTextBased()) {
      const embed = embeds.base(config.colors.accent)
        .setTitle('✦ وداعاً ✦')
        .setDescription(`غادر **${user.username}** السيرفر، نتمنى له التوفيق.`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields({ name: '👥 عدد الأعضاء الآن', value: `${guild.memberCount}`, inline: true });
      await channel.send({ embeds: [embed] }).catch((e) => logger.warn('تعذر إرسال رسالة المغادرة:', e.message));
    }

    await sendLog(guild, embeds.base(config.colors.accent)
      .setTitle('📤 عضو غادر')
      .setDescription(`${user} • \`${user.id}\`\nعدد الأعضاء: **${guild.memberCount}**`)
      .setThumbnail(user.displayAvatarURL()));
  },
};
