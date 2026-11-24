// 💾 تخزين بسيط بملف JSON (بدون مكتبات خارجية) — يمكن استبداله بـ SQLite/MongoDB لاحقاً
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// على الاستضافات: ضع DATA_DIR على مجلد دائم (Volume) كي لا تضيع البيانات عند إعادة التشغيل
const DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '..', '..', 'data');
const FILE = path.join(DIR, 'db.json');

const defaults = () => ({ guilds: {}, warns: {}, tickets: {}, counters: {}, maintenance: {} });
let data = defaults();

function load() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    if (fs.existsSync(FILE)) data = { ...defaults(), ...JSON.parse(fs.readFileSync(FILE, 'utf8')) };
  } catch (e) {
    logger.error('فشل تحميل قاعدة البيانات، سيتم البدء بقاعدة فارغة:', e);
    data = defaults();
  }
}

function writeNow() {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const tmp = FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, FILE);
  } catch (e) {
    logger.error('فشل حفظ قاعدة البيانات:', e);
  }
}

let timer = null;
function save() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; writeNow(); }, 500);
}
function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  writeNow();
}
process.on('exit', flush);
process.on('SIGINT', () => { flush(); process.exit(0); });
process.on('SIGTERM', () => { flush(); process.exit(0); });

load();

// ---------- إعدادات السيرفر ----------
const guildDefaults = () => ({
  welcomeEnabled: false, welcomeChannel: null, leaveChannel: null, logChannel: null,
  memberRole: null, rulesRole: null,
  ticketCategory: null, ticketLogChannel: null, techRole: null, complaintRole: null, adminRole: null,
  announceChannel: null, controlChannel: null, staffRoles: [],
});
const getGuild = (id) => ({ ...guildDefaults(), ...(data.guilds[id] || {}) });
function setGuild(id, patch) {
  data.guilds[id] = { ...getGuild(id), ...patch };
  save();
  return data.guilds[id];
}

// ---------- عدادات ----------
function nextId(key) {
  data.counters[key] = (data.counters[key] || 0) + 1;
  save();
  return data.counters[key];
}

// ---------- التحذيرات ----------
function addWarn(guildId, userId, warn) {
  data.warns[guildId] ??= {};
  data.warns[guildId][userId] ??= [];
  const entry = { id: nextId(`warn:${guildId}`), date: Date.now(), ...warn };
  data.warns[guildId][userId].push(entry);
  save();
  return data.warns[guildId][userId];
}
const getWarns = (guildId, userId) => data.warns[guildId]?.[userId] || [];
function removeWarn(guildId, userId, warnId) {
  const list = getWarns(guildId, userId);
  const i = list.findIndex((w) => w.id === warnId);
  if (i === -1) return false;
  list.splice(i, 1);
  save();
  return true;
}

// ---------- التذاكر ----------
const nextTicketNumber = (guildId) => nextId(`ticket:${guildId}`);
const getTicket = (channelId) => data.tickets[channelId] || null;
function saveTicket(ticket) { data.tickets[ticket.channelId] = ticket; save(); }
function deleteTicket(channelId) { delete data.tickets[channelId]; save(); }
const findTicketsByUser = (guildId, userId) =>
  Object.values(data.tickets).filter((t) => t.guildId === guildId && t.ownerId === userId);

// ---------- وضع الصيانة ----------
const getMaintenance = (guildId) => data.maintenance?.[guildId] || null;
function setMaintenance(guildId, value) {
  data.maintenance ??= {};
  if (value === null) delete data.maintenance[guildId];
  else data.maintenance[guildId] = value;
  save();
}
const countTickets = (guildId) => Object.values(data.tickets).filter((t) => t.guildId === guildId).length;

module.exports = {
  getMaintenance, setMaintenance, countTickets,
  getGuild, setGuild, addWarn, getWarns, removeWarn,
  nextTicketNumber, getTicket, saveTicket, deleteTicket, findTicketsByUser, flush,
};
