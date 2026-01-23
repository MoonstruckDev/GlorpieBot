const fs = require("node:fs");
const path = require("node:path");

const dataDir = path.join(__dirname, "data");
const filePath = path.join(dataDir, "gayCache.json");

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

function get(userId) {
  return cache[userId] ?? 0;
}

function increment(userId) {
  if (!cache[userId]) {
    cache[userId] = 0;
  }

  cache[userId]++;
  save();
  return cache[userId];
}

function getAll() {
  return cache;
}

module.exports = {
  load,
  get,
  increment,
  getAll,
};
