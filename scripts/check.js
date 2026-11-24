// فحص سريع بدون توكن: يحمّل كل الأوامر والمعالجات والأحداث ويتحقق من صحة تعريفات الأوامر
const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const { loadCommands } = require('../src/handlers/commandHandler');
const { loadComponents } = require('../src/handlers/componentHandler');

process.env.DATA_DIR = process.env.DATA_DIR || path.join(require('os').tmpdir(), 'm7-check');
const c = { commands: new Collection(), components: new Collection() };
loadCommands(c);
loadComponents(c);

let bad = 0;
for (const cmd of c.commands.values()) {
  try { cmd.data.toJSON(); } catch (e) { bad++; console.error('✖ أمر غير صالح:', cmd.data?.name, e.message); }
}
for (const f of fs.readdirSync(path.join(__dirname, '..', 'src', 'events'))) {
  try { require(path.join(__dirname, '..', 'src', 'events', f)); } catch (e) { bad++; console.error('✖ حدث غير صالح:', f, e.message); }
}
if (!c.commands.size || bad) { console.error(`فشل الفحص (${bad} خطأ)`); process.exit(1); }
console.log(`✔ الفحص ناجح: ${c.commands.size} أمر، ${c.components.size} معالج`);
process.exit(0);
