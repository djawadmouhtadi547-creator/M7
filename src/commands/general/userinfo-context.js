const { ContextMenuCommandBuilder, ApplicationCommandType, InteractionContextType, MessageFlags } = require('discord.js');
const { userInfoEmbed } = require('../../utils/infoEmbeds');

// Context Menu: كليك يمين على عضو ← التطبيقات ← معلومات العضو
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('معلومات العضو')
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    const user = interaction.targetUser;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    await interaction.reply({ embeds: [userInfoEmbed(user, member)], flags: MessageFlags.Ephemeral });
  },
};
