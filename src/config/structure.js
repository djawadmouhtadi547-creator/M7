// 🏗️ هيكلة سيرفر M 7 — عدّل الأسماء والرومات والرتب كما تريد
const { PermissionFlagsBits: P } = require('discord.js');

module.exports = {
  // الترتيب هنا = ترتيب الهرم (الأعلى أولاً)
  roles: [
    { key: 'owner', name: '👑 المالك', color: 0x6e1418, hoist: true, permissions: [P.Administrator] },
    { key: 'admin', name: '🛡️ الإدارة', color: 0x8b1e24, hoist: true, permissions: [P.Administrator] },
    { key: 'mod', name: '⚔️ مشرف', color: 0x9a2a31, hoist: true,
      permissions: [P.KickMembers, P.BanMembers, P.ModerateMembers, P.ManageMessages, P.MuteMembers, P.DeafenMembers, P.MoveMembers, P.ViewAuditLog] },
    { key: 'support', name: '🎧 الدعم الفني', color: 0xb04a50, hoist: true, permissions: [P.ManageMessages, P.ModerateMembers] },
    { key: 'vip', name: '💎 VIP', color: 0xc9a227, hoist: true, permissions: [] },
    { key: 'member', name: '🖤 M7 Member', color: 0x3d1013, permissions: [] },
    { key: 'guest', name: '🌑 زائر', color: 0x2b2b2b, permissions: [] },
    // رتب اختيارية (تظهر في روم الرتب)
    { key: 'gamer', name: '🎮 Gamer', color: 0x555555, permissions: [], optional: true },
    { key: 'artist', name: '🎨 Artist', color: 0x555555, permissions: [], optional: true },
    { key: 'music', name: '🎵 Music', color: 0x555555, permissions: [], optional: true },
  ],

  // access: gate = الجميع يشوف (للقراءة) | member = الأعضاء | vip | staff = الإدارة فقط
  categories: [
    { name: '━━ 🥀 البوابة ━━', access: 'gate', channels: [
      { key: 'rules', name: '『📜』القوانين', type: 'text', readOnly: true, topic: 'اقرأ القوانين ثم اضغط على زر الموافقة' },
      { key: 'welcome', name: '『🥀』بوابة-M7', type: 'text', readOnly: true, topic: 'أهلاً بك في M 7' },
    ] },
    { name: '━━ 📌 معلومات ━━', access: 'member', channels: [
      { key: 'announcements', name: '『📢』الإعلانات', type: 'announcement', readOnly: true, topic: 'إعلانات السيرفر الرسمية' },
      { key: 'roles', name: '『🎭』الرتب', type: 'text', readOnly: true, topic: 'اختر رتبك' },
      { key: 'leave', name: '『🚪』المغادرة', type: 'text', readOnly: true, topic: 'من غادر السيرفر' },
    ] },
    { name: '━━ 💬 عام ━━', access: 'member', channels: [
      { key: 'chat', name: '『💬』الدردشة', type: 'text' },
      { key: 'media', name: '『📸』الصور-والميديا', type: 'text' },
      { key: 'commands', name: '『🤖』الأوامر', type: 'text', topic: 'أوامر البوتات هنا فقط' },
      { key: 'suggestions', name: '『💡』الاقتراحات', type: 'text' },
    ] },
    { name: '━━ 🎫 الدعم ━━', access: 'member', channels: [
      { key: 'ticketPanel', name: '『🎫』فتح-تذكرة', type: 'text', readOnly: true, topic: 'اختر نوع التذكرة من القائمة' },
    ] },
    { key: 'ticketCategory', name: '━━ 📂 التذاكر ━━', access: 'staff', extra: ['support'], channels: [] },
    { name: '━━ 🔊 الصوتيات ━━', access: 'member', channels: [
      { name: '『🔊』عام-1', type: 'voice' },
      { name: '『🔊』عام-2', type: 'voice' },
      { name: '『🎮』ألعاب', type: 'voice' },
      { name: '『🎵』موسيقى', type: 'voice' },
      { name: '『🔒』غرفة-خاصة', type: 'voice', userLimit: 2 },
      { key: 'afk', name: '『💤』AFK', type: 'voice' },
    ] },
    { name: '━━ 💎 VIP ━━', access: 'vip', channels: [
      { name: '『💎』دردشة-vip', type: 'text' },
      { name: '『💎』صوتي-vip', type: 'voice' },
    ] },
    { name: '━━ 👑 الإدارة ━━', access: 'staff', channels: [
      { name: '『👑』الإدارة-العامة', type: 'text' },
      { key: 'logs', name: '『📋』سجلات-السيرفر', type: 'text' },
      { key: 'ticketLogs', name: '『🎟️』سجلات-التذاكر', type: 'text' },
      { key: 'control', name: '『🎛️』لوحة-التحكم', type: 'text', topic: 'التحكم بالسيرفر عبر الأزرار' },
      { name: '『⚙️』أوامر-الإدارة', type: 'text' },
      { name: '『🔊』اجتماع-الإدارة', type: 'voice' },
    ] },
  ],
};
