const {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, MessageFlags,
} = require('discord.js');
const embeds = require('../utils/embeds');
const storage = require('../utils/storage');
const maintenance = require('../utils/maintenance');
const { controlPayload } = require('../utils/panels');
const { toAttachment } = require('../utils/backup');
const { sendLog } = require('../utils/helpers');

const EPH = MessageFlags.Ephemeral;

function allowed(interaction) {
  const s = storage.getGuild(interaction.guild.id);
  return interaction.memberPermissions.has(PermissionFlagsBits.Administrator) ||
    (s.adminRole && interaction.member.roles.cache.has(s.adminRole));
}

module.exports = {
  name: 'ctrl',
  async execute(interaction, args) {
    const { guild } = interaction;
    if (!allowed(interaction)) return interaction.reply({ embeds: [embeds.error('هذه اللوحة للإدارة فقط.')], flags: EPH });

    switch (args[0]) {
      case 'maint': {
        await interaction.deferReply({ flags: EPH });
        try {
          const on = storage.getMaintenance(guild.id)?.active;
          const r = on ? await maintenance.disable(guild) : await maintenance.enable(guild, interaction.user);
          await interaction.message.edit(controlPayload(guild)).catch(() => {});
          await interaction.editReply({ embeds: [embeds.success(on ? `تم إنهاء الصيانة (استُرجع ${r.restored} روم).` : `تم تفعيل الصيانة (${r.done} روم).`)] });
          await sendLog(guild, embeds.info(`🔧 ${on ? 'إنهاء' : 'تفعيل'} وضع الصيانة بواسطة ${interaction.user}.`));
        } catch (e) {
          await interaction.editReply({ embeds: [embeds.error(e.message)] });
        }
        return;
      }

      case 'announce': {
        const modal = new ModalBuilder().setCustomId('ctrl:annmodal').setTitle('إرسال إعلان')
          .addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('العنوان').setStyle(TextInputStyle.Short).setMaxLength(200).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('text').setLabel('نص الإعلان').setStyle(TextInputStyle.Paragraph).setMaxLength(3500).setRequired(true)),
          );
        return interaction.showModal(modal);
      }

      case 'annmodal': {
        const s = storage.getGuild(guild.id);
        const ch = (s.announceChannel && guild.channels.cache.get(s.announceChannel)) || interaction.channel;
        const embed = embeds.base().setTitle(`📢 ${interaction.fields.getTextInputValue('title')}`).setDescription(interaction.fields.getTextInputValue('text'));
        await ch.send({ embeds: [embed] });
        return interaction.reply({ embeds: [embeds.success(`تم نشر الإعلان في ${ch}.`)], flags: EPH });
      }

      case 'status': {
        const m = storage.getMaintenance(guild.id);
        const e = embeds.base().setTitle('📊 حالة السيرفر').addFields(
          { name: 'الأعضاء', value: `${guild.memberCount}`, inline: true },
          { name: 'الرومات', value: `${guild.channels.cache.filter((c) => !c.isThread()).size}`, inline: true },
          { name: 'الرتب', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'التذاكر المفتوحة', value: `${storage.countTickets(guild.id)}`, inline: true },
          { name: 'الصيانة', value: m?.active ? '🔴 مفعّلة' : '🟢 متوقفة', inline: true },
          { name: 'Ping', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true },
        );
        return interaction.reply({ embeds: [e], flags: EPH });
      }

      case 'backup': {
        const { attachment } = toAttachment(guild);
        return interaction.reply({ embeds: [embeds.success('نسخة احتياطية لهيكلة السيرفر (رتب + رومات + صلاحيات).')], files: [attachment], flags: EPH });
      }

      case 'refresh':
        return interaction.update(controlPayload(guild));
    }
  },
};
