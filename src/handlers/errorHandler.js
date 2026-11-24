const logger = require('../utils/logger');

/** معالجة شاملة للأخطاء حتى لا يتوقف البوت */
function setupErrorHandlers(client) {
  process.on('unhandledRejection', (reason) => logger.error('unhandledRejection:', reason));
  process.on('uncaughtException', (err) => logger.error('uncaughtException:', err));
  process.on('uncaughtExceptionMonitor', (err) => logger.error('uncaughtExceptionMonitor:', err));
  client.on('error', (err) => logger.error('Client error:', err));
  client.on('warn', (msg) => logger.warn(msg));
  client.on('shardError', (err) => logger.error('Shard error:', err));
}

module.exports = { setupErrorHandlers };
