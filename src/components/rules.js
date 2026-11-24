const { MessageFlags } = require('discord.js');
const embeds = require('../utils/embeds');
const storage = require('../utils/storage');

module.exports = {
  name: 'rules',
  async execute(interaction, args) {
    if (args[0] !== 'accept') return;
    const reply = (e) => interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
    const s = storage.getGuild(interaction.guild.id);
    const role = interaction.guild.roles.cache.get(s.rulesRole || s.memberRole);
    if (!role) return reply(embeds.error('رتبة العضوية غير مُعدة. تواصل مع الإدارة.'));
    if (interaction.member.roles.cache.has(role.id)) return reply(embeds.info('✅ أنت موافق على القوانين مسبقاً.'));
    try {
      await interaction.member.roles.add(role, 'M 7 • الموافقة على القوانين');
      // إزالة رتبة "زائر" التلقائية إن وُجدت
      if (s.memberRole && s.memberRole !== role.id && interaction.member.roles.cache.has(s.memberRole)) {
        await interaction.member.roles.remove(s.memberRole, 'M 7 • أصبح عضواً').catch(() => {});
      }
      return reply(embeds.success(`شكراً لك! تم منحك رتبة ${role}. أهلاً بك في **M 7**.`));
    } catch {
      return reply(embeds.error('تعذر إعطاؤك الرتبة. تواصل مع الإدارة (رتبة البوت يجب أن تكون أعلى).'));
    }
  },
};
