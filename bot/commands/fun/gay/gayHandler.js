const fs = require("node:fs");
const path = require("node:path");

// NOTE: this points to the project root, not the module folder
const projectRoot = path.resolve(__dirname, "../../..");

const dataDir = path.join(projectRoot, "data", "gay");
const filePath = path.join(dataDir, "gayCache.json");

let cache = {};

function load() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath))
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  cache = JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function save() {
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
}

function ensureGuild(guildId) {
  if (!cache[guildId]) cache[guildId] = {};
}

function get(userId, guildId) {
  ensureGuild(guildId);
  return cache[guildId][userId] ?? 0;
}

function increment(userId, guildId) {
  ensureGuild(guildId);
  cache[guildId][userId] = (cache[guildId][userId] ?? 0) + 1;
  save();
  return cache[guildId][userId];
}

function getAll(guildId) {
  ensureGuild(guildId);
  return cache[guildId];
}

module.exports = {
  load,
  get,
  increment,
  getAll,
};
