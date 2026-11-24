require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const logger = require('./utils/logger');
const { setupErrorHandlers } = require('./handlers/errorHandler');
const { loadCommands } = require('./handlers/commandHandler');
const { loadComponents } = require('./handlers/componentHandler');
const { loadEvents } = require('./handlers/eventHandler');

if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN غير موجود. انسخ .env.example إلى .env واملأ البيانات.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // Privileged: Server Members Intent
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Privileged: Message Content Intent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User],
});

client.commands = new Collection();
client.components = new Collection();

setupErrorHandlers(client);
loadCommands(client);
loadComponents(client);
loadEvents(client);

// Health-check اختياري: بعض الاستضافات (Render/Koyeb/Fly) تطلب منفذاً مفتوحاً
if (process.env.PORT) {
  require('http')
    .createServer((req, res) => {
      res.writeHead(client.isReady() ? 200 : 503, { 'Content-Type': 'text/plain' });
      res.end(client.isReady() ? 'M7 OK' : 'starting');
    })
    .listen(process.env.PORT, () => logger.info(`Health server على المنفذ ${process.env.PORT}`));
}

client.login(process.env.DISCORD_TOKEN).catch((e) => {
  logger.error('فشل تسجيل الدخول، تحقق من التوكن:', e);
  process.exit(1);
});
