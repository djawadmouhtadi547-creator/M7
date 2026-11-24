const config = require('../config/config');
const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/helpers');

module.exports = {
  name: 'messageUpdate',
  async execute(client, oldMsg, newMsg) {
    if (!newMsg.guild || newMsg.author?.bot) return;
    if (oldMsg.content == null || newMsg.content == null) return;
    if (oldMsg.content === newMsg.content) return;

    const embed = embeds.base(config.colors.primary)
      .setTitle('✏️ رسالة معدّلة')
      .addFields(
        { name: 'الكاتب', value: `${newMsg.author} • \`${newMsg.author.id}\``, inline: true },
        { name: 'الروم', value: `<#${newMsg.channelId}>`, inline: true },
        { name: 'قبل', value: oldMsg.content.slice(0, 1000) || '*فارغ*' },
        { name: 'بعد', value: newMsg.content.slice(0, 1000) || '*فارغ*' },
        { name: 'الرابط', value: `[الذهاب للرسالة](${newMsg.url})` },
      );
    await sendLog(newMsg.guild, embed);
  },
};
