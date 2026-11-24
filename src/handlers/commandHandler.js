const path = require('path');
const { walk } = require('./loader');
const logger = require('../utils/logger');

/** تحميل الأوامر (Slash + Context Menu) داخل client.commands */
function loadCommands(client) {
  for (const file of walk(path.join(__dirname, '..', 'commands'))) {
    try {
      const cmd = require(file);
      if (!cmd.data || typeof cmd.execute !== 'function') {
        logger.warn(`تخطي ملف أمر غير صالح: ${path.basename(file)}`);
        continue;
      }
      client.commands.set(cmd.data.name, cmd);
    } catch (e) {
      logger.error(`فشل تحميل الأمر ${path.basename(file)}:`, e);
    }
  }
  logger.info(`تم تحميل ${client.commands.size} أمر.`);
}

module.exports = { loadCommands };
