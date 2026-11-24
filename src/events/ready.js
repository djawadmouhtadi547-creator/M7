const { ActivityType } = require('discord.js');
const logger = require('../utils/logger');
const { registerCommands } = require('../handlers/registerCommands');

module.exports = {
  name: 'clientReady',
  once: true,
  async execute(client) {
    logger.info(`✦ البوت يعمل: ${client.user.tag} | ${client.guilds.cache.size} سيرفر`);
    client.user.setPresence({
      activities: [{ name: 'سيرفر M 7', type: ActivityType.Watching }],
      status: 'dnd',
    });
    if (process.env.AUTO_DEPLOY !== 'false') {
      try {
        await registerCommands(client.commands, client.user.id);
      } catch (e) {
        logger.error('فشل تسجيل الأوامر تلقائياً:', e);
      }
    }
  },
};
