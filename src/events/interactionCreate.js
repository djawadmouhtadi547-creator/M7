const { MessageFlags } = require('discord.js');
const logger = require('../utils/logger');
const embeds = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
        const cmd = client.commands.get(interaction.commandName);
        if (!cmd) return;
        await cmd.execute(interaction, client);
        return;
      }
      if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
        const [name, ...args] = interaction.customId.split(':');
        const comp = client.components.get(name);
        if (!comp) return;
        await comp.execute(interaction, args, client);
      }
    } catch (err) {
      logger.error('خطأ أثناء معالجة التفاعل:', err);
      const payload = { embeds: [embeds.error('حدث خطأ غير متوقع أثناء تنفيذ العملية. حاول مرة أخرى.')], flags: MessageFlags.Ephemeral };
      try {
        if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
        else await interaction.reply(payload);
      } catch { /* تجاهل */ }
    }
  },
};
