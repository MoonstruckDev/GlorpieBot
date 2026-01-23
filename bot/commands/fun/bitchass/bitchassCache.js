const fs = require("node:fs");
const path = require("node:path");

// project-root/data/bitchass
const dataDir = path.join(process.cwd(), "data", "bitchass");
const filePath = path.join(dataDir, "bitchassCache.json");

let cache = {};

function load() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  }

  cache = JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function save() {
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function get(userId) {
  const cached = cache[userId];
  if (!cached) return null;

  if (cached.date !== today()) {
    delete cache[userId];
    save();
    return null;
  }

  return cached.value;
}

function set(userId, value) {
  cache[userId] = { value, date: today() };
  save();
}

module.exports = {
  load,
  get,
  set,
};
