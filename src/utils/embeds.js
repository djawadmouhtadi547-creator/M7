const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

const base = (color = config.colors.primary) =>
  new EmbedBuilder().setColor(color).setFooter({ text: config.footer }).setTimestamp();

module.exports = {
  base,
  success: (text) => base(config.colors.primary).setDescription(`✅ ${text}`),
  error: (text) => base(config.colors.accent).setDescription(`❌ ${text}`),
  info: (text) => base().setDescription(text),
};
