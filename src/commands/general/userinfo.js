const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { userInfoEmbed } = require('../../utils/infoEmbeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('عرض معلومات عضو')
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName('user').setDescription('العضو (الافتراضي: أنت)')),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    await interaction.reply({ embeds: [userInfoEmbed(user, member)] });
  },
};
