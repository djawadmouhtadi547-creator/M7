const path = require('path');
const { walk } = require('./loader');
const logger = require('../utils/logger');

/** تحميل معالجات الأزرار/القوائم/المودالات. customId بصيغة  name:arg1:arg2 */
function loadComponents(client) {
  for (const file of walk(path.join(__dirname, '..', 'components'))) {
    try {
      const comp = require(file);
      if (!comp.name || typeof comp.execute !== 'function') continue;
      client.components.set(comp.name, comp);
    } catch (e) {
      logger.error(`فشل تحميل المكوّن ${path.basename(file)}:`, e);
    }
  }
  logger.info(`تم تحميل ${client.components.size} معالج تفاعلات.`);
}

module.exports = { loadComponents };
