const fs = require("node:fs");
const path = require("node:path");

const filePath = path.join(__dirname, "data", "bitchassCache.json");

let cache = {};

function load() {
  if (!fs.existsSync(path.join(__dirname, "data"))) {
    fs.mkdirSync(path.join(__dirname, "data"));
  }

  if (fs.existsSync(filePath)) {
    cache = JSON.parse(fs.readFileSync(filePath));
  }
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

module.exports = { load, get, set };
