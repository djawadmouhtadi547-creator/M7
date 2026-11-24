const { MessageFlags } = require('discord.js');
const embeds = require('../utils/embeds');
const { isAssignable } = require('../utils/helpers');

module.exports = {
  name: 'roles',
  async execute(interaction, args) {
    const { guild, member } = interaction;
    const reply = (e) => interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });

    try {
      // ----- زر: تبديل رتبة واحدة -----
      if (interaction.isButton() && args[0] === 't') {
        const role = guild.roles.cache.get(args[1]);
        if (!role || !isAssignable(guild, role)) return reply(embeds.error('هذه الرتبة غير متاحة حالياً.'));
        if (member.roles.cache.has(role.id)) {
          await member.roles.remove(role, 'M 7 • رتب تفاعلية');
          return reply(embeds.success(`تمت إزالة رتبة ${role}.`));
        }
        await member.roles.add(role, 'M 7 • رتب تفاعلية');
        return reply(embeds.success(`تم منحك رتبة ${role}.`));
      }

      // ----- قائمة: مزامنة الاختيارات -----
      if (interaction.isStringSelectMenu() && args[0] === 'menu') {
        const all = interaction.component.options.map((o) => o.value);
        const chosen = interaction.values;
        const toAdd = chosen.filter((id) => !member.roles.cache.has(id) && isAssignable(guild, guild.roles.cache.get(id)));
        const toRemove = all.filter((id) => !chosen.includes(id) && member.roles.cache.has(id) && isAssignable(guild, guild.roles.cache.get(id)));
        if (toAdd.length) await member.roles.add(toAdd, 'M 7 • رتب تفاعلية');
        if (toRemove.length) await member.roles.remove(toRemove, 'M 7 • رتب تفاعلية');
        return reply(embeds.success(`تم تحديث رتبك. (+${toAdd.length} / -${toRemove.length})`));
      }
    } catch {
      return reply(embeds.error('تعذر تعديل رتبك. تواصل مع الإدارة (رتبة البوت يجب أن تكون أعلى).'));
    }
  },
};
