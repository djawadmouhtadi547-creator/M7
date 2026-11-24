const { AttachmentBuilder } = require('discord.js');

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function fetchAll(channel, max = 2000) {
  const all = [];
  let before;
  while (all.length < max) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    all.push(...batch.values());
    before = batch.last().id;
  }
  return all.reverse();
}

async function buildTranscript(channel, ticket) {
  const messages = await fetchAll(channel);
  const rows = messages.map((m) => {
    const time = new Date(m.createdTimestamp).toISOString().replace('T', ' ').slice(0, 19);
    const content = esc(m.content).replace(/\n/g, '<br>');
    const files = [...m.attachments.values()].map((a) => `<a href="${esc(a.url)}">📎 ${esc(a.name)}</a>`).join('<br>');
    const embs = m.embeds.map((e) => `<div class="emb"><b>${esc(e.title || '')}</b><br>${esc(e.description || '').replace(/\n/g, '<br>')}</div>`).join('');
    return `<div class="msg"><img src="${esc(m.author.displayAvatarURL({ size: 64 }))}"><div><span class="name">${esc(m.author.username)}</span><span class="time">${time}</span><div class="content">${content}</div>${files}${embs}</div></div>`;
  }).join('\n');

  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>Transcript ${esc(channel.name)}</title>
<style>
body{background:#0a0a0a;color:#e6e6e6;font-family:Tahoma,Arial,sans-serif;margin:0;padding:24px}
h1{color:#8b1e24;border-bottom:2px solid #6e1418;padding-bottom:10px}
.meta{color:#999;margin-bottom:20px}
.msg{display:flex;gap:12px;padding:10px;margin:6px 0;background:#141414;border-right:4px solid #6e1418;border-radius:6px}
.msg img{width:40px;height:40px;border-radius:50%}
.name{font-weight:bold;color:#fff;margin-left:8px}.time{color:#777;font-size:12px}
.content{margin-top:4px;word-break:break-word}
.emb{margin-top:6px;padding:8px;background:#1d1d1d;border-right:3px solid #8b1e24}
a{color:#c0565d}
</style></head><body>
<h1>M 7 — سجل التذكرة #${esc(channel.name)}</h1>
<div class="meta">عدد الرسائل: ${messages.length}${ticket ? ` • صاحب التذكرة: ${esc(ticket.ownerId)}` : ''}</div>
${rows}
</body></html>`;

  return new AttachmentBuilder(Buffer.from(html, 'utf8'), { name: `transcript-${channel.name}.html` });
}

module.exports = { buildTranscript };
