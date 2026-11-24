// ⚙️ الإعدادات العامة لهوية M 7
module.exports = {
  name: 'M 7',
  colors: {
    primary: 0x6e1418, // أحمر غامق
    accent: 0x8b1e24, // أحمر أفتح قليلاً
    black: 0x0a0a0a,
  },
  footer: 'M 7 • نظام متكامل',
  memberRoleName: 'M7 Member',

  maxOpenTicketsPerUser: 1,
  ticketTypes: {
    tech: { label: 'دعم فني', emoji: '🛠️', description: 'مشاكل تقنية أو استفسارات عامة', roleKey: 'techRole' },
    complaint: { label: 'شكوى', emoji: '📢', description: 'تقديم شكوى على عضو أو موقف', roleKey: 'complaintRole' },
    admin: { label: 'الإدارة', emoji: '👑', description: 'التواصل المباشر مع الإدارة', roleKey: 'adminRole' },
  },

  rules: [
    'احترام جميع الأعضاء وعدم الإساءة أو التنمر بأي شكل.',
    'يمنع السبام والإعلانات والروابط دون إذن الإدارة.',
    'يمنع نشر أي محتوى مخل أو عنيف أو مخالف للقوانين.',
    'يمنع نشر المعلومات الشخصية لأي شخص.',
    'الالتزام باستخدام كل روم فيما خُصص له.',
    'قرارات الإدارة نهائية، وللاعتراض افتح تذكرة.',
    'الالتزام بشروط خدمة ديسكورد (Discord ToS).',
  ],
};
