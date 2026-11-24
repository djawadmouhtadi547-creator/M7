const path = require('path');
const { walk } = require('./loader');
const logger = require('../utils/logger');

function loadEvents(client) {
  let count = 0;
  for (const file of walk(path.join(__dirname, '..', 'events'))) {
    try {
      const event = require(file);
      if (!event.name || typeof event.execute !== 'function') continue;
      const run = async (...args) => {
        try {
          await event.execute(client, ...args);
        } catch (e) {
          logger.error(`خطأ في الحدث ${event.name}:`, e);
        }
      };
      event.once ? client.once(event.name, run) : client.on(event.name, run);
      count++;
    } catch (e) {
      logger.error(`فشل تحميل الحدث ${path.basename(file)}:`, e);
    }
  }
  logger.info(`تم تحميل ${count} حدث.`);
}

module.exports = { loadEvents };
