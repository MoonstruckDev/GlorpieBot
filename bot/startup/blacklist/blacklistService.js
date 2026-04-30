const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "../../startup/blacklist/assets/blacklist.json",
);

function normalize(str) {
  return str.normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function load() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function ensureGuild(data, guildId) {
  if (!data.guilds[guildId]) {
    data.guilds[guildId] = { users: [], words: [] };
  }
}

function addUser(guildId, userId, global = false) {
  const data = load();
  if (global) {
    if (!data.global.users.includes(userId)) data.global.users.push(userId);
  } else {
    ensureGuild(data, guildId);
    if (!data.guilds[guildId].users.includes(userId))
      data.guilds[guildId].users.push(userId);
  }
  save(data);
}

function addWord(guildId, word, global = false) {
  const data = load();
  const clean = word.toLowerCase().trim();
  if (global) {
    if (!data.global.words.includes(clean)) data.global.words.push(clean);
  } else {
    ensureGuild(data, guildId);
    if (!data.guilds[guildId].words.includes(clean))
      data.guilds[guildId].words.push(clean);
  }
  save(data);
}

function isWordBlacklisted(guildId, text) {
  const data = load();
  const cleanText = normalize(text);
  const allWords = [
    ...data.global.words,
    ...(data.guilds[guildId]?.words || []),
  ];

  for (const word of allWords) {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escapedWord}\\b`, "i");

    if (regex.test(cleanText)) {
      return {
        blocked: true,
        scope: data.global.words.includes(word) ? "global" : "guild",
        word: word,
      };
    }
  }
  return { blocked: false };
}

function isUserBlacklisted(guildId, userId) {
  const data = load();
  return (
    data.global.users.includes(userId) ||
    data.guilds[guildId]?.users.includes(userId)
  );
}

function getBlacklist(guildId) {
  const data = load();
  ensureGuild(data, guildId);
  return data;
}

module.exports = {
  addUser,
  addWord,
  isUserBlacklisted,
  isWordBlacklisted,
  getBlacklist,
};
