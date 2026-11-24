const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

const ow = (c) => [...(c.permissionOverwrites?.cache.values() || [])].map((o) => ({
  id: o.id, type: o.type, allow: o.allow.bitfield.toString(), deny: o.deny.bitfield.toString(),
}));

/** نسخة احتياطية (JSON) لهيكلة السيرفر: الرتب + الرومات + الصلاحيات */
function serialize(guild) {
  return {
    version: 1,
    server: { id: guild.id, name: guild.name },
    createdAt: new Date().toISOString(),
    roles: [...guild.roles.cache.values()].filter((r) => r.id !== guild.id).sort((a, b) => b.position - a.position).map((r) => ({
      id: r.id, name: r.name, color: r.color, hoist: r.hoist, mentionable: r.mentionable,
      managed: r.managed, position: r.position, permissions: r.permissions.bitfield.toString(),
    })),
    channels: [...guild.channels.cache.values()].filter((c) => !c.isThread()).sort((a, b) => a.rawPosition - b.rawPosition).map((c) => ({
      id: c.id, name: c.name, type: c.type, parentId: c.parentId, topic: c.topic ?? null,
      userLimit: c.userLimit ?? null, overwrites: ow(c),
    })),
  };
}

function toAttachment(guild) {
  const json = JSON.stringify(serialize(guild), null, 2);
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return { attachment: new AttachmentBuilder(Buffer.from(json, 'utf8'), { name: `m7-backup-${stamp}.json` }), json, stamp };
}

/** حفظ نسخة على القرص داخل backups/ */
function saveToDisk(guild) {
  const { attachment, json, stamp } = toAttachment(guild);
  try {
    const base = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '..', '..');
    const dir = path.join(base, 'backups');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${guild.id}-${stamp}.json`), json);
  } catch { /* تجاهل */ }
  return attachment;
}

module.exports = { serialize, toAttachment, saveToDisk };
