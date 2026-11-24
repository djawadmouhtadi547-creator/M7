const { REST, Routes } = require('discord.js');
const logger = require('../utils/logger');

/** تسجيل الأوامر في ديسكورد: سيرفر واحد (GUILD_ID) = فوري، أو عام = قد يتأخر قليلاً */
async function registerCommands(commands, clientId) {
  const body = [...commands.values()].map((c) => c.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  const guildId = process.env.GUILD_ID;
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);
  await rest.put(route, { body });
  logger.info(`تم تسجيل ${body.length} أمر ${guildId ? `في السيرفر ${guildId}` : 'بشكل عام'}.`);
}

module.exports = { registerCommands };
