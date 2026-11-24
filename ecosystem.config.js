// تشغيل على VPS بـ pm2:  pm2 start ecosystem.config.js && pm2 save
module.exports = {
  apps: [{
    name: 'm7-bot',
    script: 'src/index.js',
    autorestart: true,
    max_memory_restart: '300M',
    env: { NODE_ENV: 'production' },
  }],
};
