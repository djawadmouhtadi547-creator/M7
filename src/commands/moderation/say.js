const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ChannelType, MessageFlags } = require('discord.js');
const config = require('../../config/config');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('إرسال إيمبد مخصص بإسم البوت')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(InteractionContextType.Guild)
    .addStringOption((o) => o.setName('description').setDescription('نص الإيمبد (استخدم \\n لسطر جديد)').setMaxLength(4000).setRequired(true))
    .addStringOption((o) => o.setName('title').setDescription('العنوان').setMaxLength(250))
    .addStringOption((o) => o.setName('color').setDescription('لون HEX مثل 6E1418'))
    .addStringOption((o) => o.setName('image').setDescription('رابط صورة (https)'))
    .addChannelOption((o) => o.setName('channel').setDescription('الروم (الافتراضي: الحالي)').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const colorInput = interaction.options.getString('color');
    const image = interaction.options.getString('image');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description').replace(/\\n/g, '\n');

    let color = config.colors.primary;
    if (colorInput) {
      if (!/^#?[0-9a-f]{6}$/i.test(colorInput)) return interaction.reply({ embeds: [embeds.error('لون غير صالح. مثال: `6E1418`')], flags: MessageFlags.Ephemeral });
      color = parseInt(colorInput.replace('#', ''), 16);
    }
    if (image && !/^https:\/\/\S+$/i.test(image)) return interaction.reply({ embeds: [embeds.error('رابط الصورة يجب أن يبدأ بـ https://')], flags: MessageFlags.Ephemeral });

    const perms = channel.permissionsFor(interaction.guild.members.me);
    if (!perms?.has(['ViewChannel', 'SendMessages', 'EmbedLinks'])) {
      return interaction.reply({ embeds: [embeds.error('ليست لدي صلاحية الإرسال في هذا الروم.')], flags: MessageFlags.Ephemeral });
    }

    const embed = embeds.base(color).setDescription(description);
    if (title) embed.setTitle(title);
    if (image) embed.setImage(image);

    await channel.send({ embeds: [embed] });
    await interaction.reply({ embeds: [embeds.success(`تم الإرسال في ${channel}.`)], flags: MessageFlags.Ephemeral });
  },
};
