// تشغيل يدوي:  npm run deploy
require('dotenv').config();
const { Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { registerCommands } = require('./handlers/registerCommands');

(async () => {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('تأكد من وجود DISCORD_TOKEN و CLIENT_ID في ملف .env');
    process.exit(1);
  }
  const fake = { commands: new Collection() };
  loadCommands(fake);
  await registerCommands(fake.commands, process.env.CLIENT_ID);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
