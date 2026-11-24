const fs = require('fs');
const path = require('path');

/** يرجع كل ملفات .js داخل مجلد (بشكل متداخل) */
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : [],
  );
}

module.exports = { walk };
