const { ChannelType, OverwriteType, PermissionFlagsBits: P } = require('discord.js');
const structure = require('../config/structure');
const embeds = require('./embeds');
const storage = require('./storage');
const logger = require('./logger');
const { saveToDisk } = require('./backup');
const panels = require('./panels');

const active = new Set(); // قفل: لا يعمل بناءان بنفس الوقت في سيرفر واحد
const STAFF = ['mod', 'admin', 'owner'];
const isBuilding = (guildId) => active.has(guildId);

/** صلاحيات الروم/القسم حسب نوع الوصول */
function buildOverwrites(guild, R, access, { readOnly = false, extra = [] } = {}) {
  const everyone = guild.roles.everyone.id;
  const ro = readOnly ? [P.SendMessages, P.CreatePublicThreads, P.CreatePrivateThreads, P.SendMessagesInThreads] : [];
  const list = [];
  list.push(access === 'gate'
    ? { id: everyone, allow: [P.ViewChannel, P.ReadMessageHistory], deny: ro }
    : { id: everyone, deny: [P.ViewChannel, ...ro] });
  for (const key of STAFF) if (R[key]) list.push({ id: R[key].id, allow: [P.ViewChannel, ...ro] });

  const others = { gate: [], member: ['member', 'vip', 'support'], vip: ['vip'], staff: [...extra] }[access] || [];
  for (const key of others) if (R[key] && !STAFF.includes(key)) list.push({ id: R[key].id, allow: [P.ViewChannel] });
  return list;
}

async function runRebuild(interaction, { resetRoles = true, assignMembers = true } = {}) {
  const { guild, user } = interaction;
  if (active.has(guild.id)) throw new Error('هناك عملية بناء تعمل حالياً.');
  active.add(guild.id);

  const report = { delChannels: 0, failedChannels: [], delRoles: 0, newRoles: 0, newChannels: 0, assigned: 0 };
  const say = (t) => interaction.editReply({ embeds: [embeds.info(t)], components: [] }).catch(() => {});

  try {
    await guild.channels.fetch();
    await guild.roles.fetch();

    // 1) نسخة احتياطية
    await say('💾 جاري أخذ نسخة احتياطية...');
    const backupFile = saveToDisk(guild);
    await user.send({ content: `💾 نسخة احتياطية لهيكلة **${guild.name}** قبل إعادة البناء.`, files: [backupFile] }).catch(() => {});

    // 2) حذف الرومات (غير الأقسام أولاً)
    await say('🗑️ جاري حذف الرومات القديمة...');
    const all = [...guild.channels.cache.values()].filter((c) => !c.isThread());
    const ordered = [...all.filter((c) => c.type !== ChannelType.GuildCategory), ...all.filter((c) => c.type === ChannelType.GuildCategory)];
    for (const ch of ordered) {
      try { await ch.delete('M 7 • إعادة بناء السيرفر'); report.delChannels++; }
      catch { report.failedChannels.push(ch.name); }
    }

    // 3) حذف الرتب القديمة
    if (resetRoles) {
      await say('🎭 جاري حذف الرتب القديمة...');
      for (const role of [...guild.roles.cache.values()]) {
        if (role.id === guild.id || role.managed || !role.editable) continue;
        try { await role.delete('M 7 • إعادة بناء السيرفر'); report.delRoles++; } catch { /* تجاهل */ }
      }
    }

    // 4) إنشاء الرتب (من الأعلى للأسفل)
    await say('🎭 جاري إنشاء الرتب الجديدة...');
    const R = {};
    for (const def of structure.roles) {
      R[def.key] = await guild.roles.create({
        name: def.name, color: def.color, hoist: !!def.hoist, mentionable: false,
        permissions: def.permissions, reason: 'M 7 • إعادة بناء السيرفر',
      });
      report.newRoles++;
    }

    // 5) إنشاء الأقسام والرومات
    await say('🏗️ جاري بناء الأقسام والرومات...');
    const C = {};
    for (const cat of structure.categories) {
      const parent = await guild.channels.create({
        name: cat.name, type: ChannelType.GuildCategory,
        permissionOverwrites: buildOverwrites(guild, R, cat.access, { extra: cat.extra }),
        reason: 'M 7 • إعادة بناء السيرفر',
      });
      if (cat.key) C[cat.key] = parent;
      for (const def of cat.channels) {
        const type = { text: ChannelType.GuildText, announcement: ChannelType.GuildAnnouncement, voice: ChannelType.GuildVoice }[def.type];
        const opts = {
          name: def.name, type, parent: parent.id, reason: 'M 7 • إعادة بناء السيرفر',
          permissionOverwrites: buildOverwrites(guild, R, cat.access, { readOnly: !!def.readOnly, extra: cat.extra }),
        };
        if (def.topic) opts.topic = def.topic;
        if (def.userLimit) opts.userLimit = def.userLimit;
        let ch;
        try { ch = await guild.channels.create(opts); }
        catch (e) {
          if (def.type !== 'announcement') throw e;
          ch = await guild.channels.create({ ...opts, type: ChannelType.GuildText }); // السيرفر ليس Community
        }
        if (def.key) C[def.key] = ch;
        report.newChannels++;
      }
    }
    if (C.afk) { await guild.setAFKChannel(C.afk).catch(() => {}); await guild.setAFKTimeout(900).catch(() => {}); }

    // 6) إعدادات الأنظمة
    storage.setMaintenance(guild.id, null);
    storage.setGuild(guild.id, {
      welcomeEnabled: true, welcomeChannel: C.welcome.id, leaveChannel: C.leave.id, logChannel: C.logs.id,
      memberRole: R.guest.id, rulesRole: R.member.id,
      ticketCategory: C.ticketCategory.id, ticketLogChannel: C.ticketLogs.id,
      techRole: R.support.id, complaintRole: R.mod.id, adminRole: R.admin.id,
      announceChannel: C.announcements.id, controlChannel: C.control.id,
      staffRoles: [R.owner.id, R.admin.id, R.mod.id],
    });

    // 7) اللوحات
    await say('📨 جاري إرسال اللوحات (قوانين، تذاكر، رتب، تحكم)...');
    await panels.sendRulesPanel(C.rules, R.member);
    await panels.sendWelcomePanel(C.welcome);
    await panels.sendTicketPanel(C.ticketPanel);
    await panels.sendRolesPanel(C.roles, structure.roles.filter((d) => d.optional).map((d) => R[d.key]));
    await panels.sendControlPanel(C.control);

    // 8) توزيع الرتب على الأعضاء
    await say('👥 جاري توزيع الرتب على الأعضاء...');
    const members = await guild.members.fetch().catch(() => guild.members.cache);
    for (const m of members.values()) {
      if (m.user.bot) continue;
      const ids = [];
      if (assignMembers) ids.push(R.member.id);
      if (m.id === guild.ownerId) ids.push(R.owner.id);
      if (m.id === user.id && m.id !== guild.ownerId) ids.push(R.admin.id);
      if (!ids.length) continue;
      try { await m.roles.add(ids, 'M 7 • إعادة بناء السيرفر'); report.assigned++; } catch { /* تجاهل */ }
    }

    // 9) التقرير النهائي
    const done = embeds.base().setTitle('✅ اكتملت إعادة بناء M 7').addFields(
      { name: 'الرومات', value: `حُذف ${report.delChannels} • أُنشئ ${report.newChannels}`, inline: true },
      { name: 'الرتب', value: `حُذف ${report.delRoles} • أُنشئ ${report.newRoles}`, inline: true },
      { name: 'الأعضاء', value: `${report.assigned} عضو حصلوا على رتبهم`, inline: true },
    );
    if (report.failedChannels.length) {
      done.addFields({ name: '⚠️ رومات تعذر حذفها', value: `${report.failedChannels.join('، ').slice(0, 900)}\n(رومات Community المطلوبة من ديسكورد لا تُحذف — غيّرها من إعدادات السيرفر)` });
    }
    await C.control.send({ embeds: [done] }).catch(() => {});
    await C.logs.send({ embeds: [embeds.info(`🏗️ تمت إعادة بناء السيرفر بواسطة ${user}.`)] }).catch(() => {});
    await interaction.editReply({ embeds: [done], components: [] }).catch(() => {});
    await user.send({ embeds: [done] }).catch(() => {});
    return report;
  } catch (e) {
    logger.error('فشلت إعادة البناء:', e);
    const err = embeds.error(`توقفت إعادة البناء بسبب خطأ:\n\`${String(e.message).slice(0, 300)}\`\nتأكد أن للبوت صلاحية **Administrator** وأن رتبته أعلى الرتب. النسخة الاحتياطية وصلتك في الخاص ومحفوظة في مجلد backups.`);
    await interaction.editReply({ embeds: [err], components: [] }).catch(() => {});
    await user.send({ embeds: [err] }).catch(() => {});
    throw e;
  } finally {
    active.delete(guild.id);
  }
}

module.exports = { runRebuild, buildOverwrites, isBuilding };
