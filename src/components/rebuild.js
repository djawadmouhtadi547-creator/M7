const {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits, MessageFlags,
} = require('discord.js');
const embeds = require('../utils/embeds');
const { runRebuild } = require('../utils/builder');

const CONFIRM_WORD = 'تأكيد الحذف';

module.exports = {
  name: 'rebuild',
  async execute(interaction, args) {
    const [action, ownerId, reset, assign] = args;
    const eph = { flags: MessageFlags.Ephemeral };

    if (interaction.user.id !== ownerId || !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ embeds: [embeds.error('هذه العملية ليست لك.')], ...eph });
    }

    if (action === 'cancel') return interaction.update({ embeds: [embeds.info('تم إلغاء العملية. لم يتغير أي شيء.')], components: [] });

    if (action === 'go') {
      const modal = new ModalBuilder().setCustomId(`rebuild:confirm:${ownerId}:${reset}:${assign}`).setTitle('تأكيد إعادة البناء')
        .addComponents(new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('word').setLabel(`اكتب: ${CONFIRM_WORD}`).setStyle(TextInputStyle.Short).setRequired(true),
        ));
      return interaction.showModal(modal);
    }

    if (action === 'confirm' && interaction.isModalSubmit()) {
      if (interaction.fields.getTextInputValue('word').trim() !== CONFIRM_WORD) {
        return interaction.reply({ embeds: [embeds.error('كلمة التأكيد غير صحيحة. تم الإلغاء.')], ...eph });
      }
      await interaction.deferReply(eph);
      try { await runRebuild(interaction, { resetRoles: reset === '1', assignMembers: assign === '1' }); }
      catch { /* الخطأ أُرسل للمستخدم داخل runRebuild */ }
    }
  },
};
