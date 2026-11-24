const { ChannelType, OverwriteType, PermissionFlagsBits: P } = require('discord.js');
const embeds = require('./embeds');
const storage = require('./storage');
const logger = require('./logger');

const VIEW = P.ViewChannel;

/** رتب الإدارة التي تظل ترى كل شيء: staffRoles + أي رتبة فيها Administrator */
function staffSet(guild) {
  const s = storage.getGuild(guild.id);
  const ids = new Set((s.staffRoles || []).filter((id) => guild.roles.cache.has(id)));
  for (const r of guild.roles.cache.values()) if (r.id !== guild.id && r.permissions.has(P.Administrator)) ids.add(r.id);
  return ids;
}

/** تفعيل الصيانة: يخفي كل الرومات عن غير الإدارة وينشئ روم «صيانة» */
async function enable(guild, user) {
  if (storage.getMaintenance(guild.id)?.active) throw new Error('وضع الصيانة مفعّل بالفعل.');
  await guild.channels.fetch();
  await guild.roles.fetch();

  const staff = staffSet(guild);
  const everyone = guild.roles.everyone.id;
  const botId = guild.client.user.id;

  // 1) روم الصيانة (الجميع يراه للقراءة فقط)
  const maint = await guild.channels.create({
    name: '『🔧』صيانة', type: ChannelType.GuildText, position: 0,
    topic: 'السيرفر تحت الصيانة حالياً — سنعود قريباً',
    permissionOverwrites: [
      { id: everyone, allow: [VIEW, P.ReadMessageHistory], deny: [P.SendMessages, P.AddReactions, P.CreatePublicThreads, P.CreatePrivateThreads] },
      ...[...staff].map((id) => ({ id, allow: [VIEW, P.SendMessages] })),
    ],
    reason: 'M 7 • وضع الصيانة',
  });

  const record = { active: true, since: Date.now(), by: user.id, channelId: maint.id, snapshot: {} };
  storage.setMaintenance(guild.id, record);

  // 2) إخفاء باقي الرومات مع حفظ الصلاحيات الأصلية للاسترجاع
  let done = 0, failed = 0;
  for (const ch of guild.channels.cache.values()) {
    if (ch.id === maint.id || ch.isThread() || !ch.permissionOverwrites) continue;
    const cur = [...ch.permissionOverwrites.cache.values()];
    record.snapshot[ch.id] = cur.map((o) => ({ id: o.id, type: o.type, allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString() }));

    const next = cur.map((o) => {
      let allow = o.allow.bitfield, deny = o.deny.bitfield;
      if (staff.has(o.id)) { allow |= VIEW; deny &= ~VIEW; }
      else if (o.id !== botId) { allow &= ~VIEW; deny |= VIEW; }
      return { id: o.id, type: o.type, allow, deny };
    });
    if (!cur.some((o) => o.id === everyone)) next.push({ id: everyone, type: OverwriteType.Role, allow: 0n, deny: VIEW });
    for (const id of staff) if (!cur.some((o) => o.id === id)) next.push({ id, type: OverwriteType.Role, allow: VIEW, deny: 0n });

    try { await ch.permissionOverwrites.set(next, 'M 7 • وضع الصيانة'); done++; }
    catch (e) { failed++; logger.warn(`صيانة: تعذر تعديل ${ch.name}:`, e.message); }
  }
  storage.setMaintenance(guild.id, record);

  await maint.send({ embeds: [embeds.base().setTitle('🔧 السيرفر تحت الصيانة')
    .setDescription('نقوم حالياً ببعض التحسينات والتطويرات.\nسيعود كل شيء كما كان في أقرب وقت، شكراً لصبركم 🖤')] }).catch(() => {});
  return { done, failed };
}

/** إنهاء الصيانة: استرجاع الصلاحيات وحذف روم الصيانة */
async function disable(guild) {
  const rec = storage.getMaintenance(guild.id);
  if (!rec?.active) throw new Error('وضع الصيانة غير مفعّل.');
  let restored = 0, failed = 0;
  for (const [chId, list] of Object.entries(rec.snapshot || {})) {
    const ch = guild.channels.cache.get(chId);
    if (!ch?.permissionOverwrites) continue;
    try {
      await ch.permissionOverwrites.set(list.map((o) => ({ id: o.id, type: o.type, allow: BigInt(o.allow), deny: BigInt(o.deny) })), 'M 7 • إنهاء الصيانة');
      restored++;
    } catch (e) { failed++; logger.warn(`صيانة: تعذر استرجاع ${ch.name}:`, e.message); }
  }
  const maint = guild.channels.cache.get(rec.channelId);
  if (maint) await maint.delete('M 7 • إنهاء الصيانة').catch(() => {});
  storage.setMaintenance(guild.id, null);
  return { restored, failed };
}

module.exports = { enable, disable };
