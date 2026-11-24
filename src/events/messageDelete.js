const config = require('../config/config');
const storage = require('../utils/storage');
const embeds = require('../utils/embeds');
const { sendLog } = require('../utils/helpers');

module.exports = {
  name: 'messageDelete',
  async execute(client, message) {
    if (!message.guild || message.author?.bot) return;
    if (message.channelId === storage.getGuild(message.guild.id).logChannel) return;

    const files = message.attachments?.map((a) => a.url).join('\n');
    const embed = embeds.base(config.colors.accent)
      .setTitle('🗑️ رسالة محذوفة')
      .addFields(
        { name: 'الكاتب', value: message.author ? `${message.author} • \`${message.author.id}\`` : 'غير معروف', inline: true },
        { name: 'الروم', value: `<#${message.channelId}>`, inline: true },
        { name: 'المحتوى', value: (message.content || '*غير متوفر*').slice(0, 1000) },
      );
    if (files) embed.addFields({ name: 'مرفقات', value: files.slice(0, 1000) });
    await sendLog(message.guild, embed);
  },
};
