const fs = require("fs");
const path = require("path");

const FILE = path.join(
  __dirname,
  "../../startup/blacklist/assets/blacklist.json",
);

function normalize(str) {
  return str
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function fuzzyMatch(text, word) {
  let i = 0;

  for (const c of text) {
    if (c === word[i]) i++;
    if (i === word.length) return true;
  }

  return false;
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
    if (!data.global.users.includes(userId)) {
      data.global.users.push(userId);
    }
  } else {
    ensureGuild(data, guildId);
    if (!data.guilds[guildId].users.includes(userId)) {
      data.guilds[guildId].users.push(userId);
    }
  }

  save(data);
}

function addWord(guildId, word, global = false) {
  const data = load();
  const clean = normalize(word);

  if (global) {
    if (!data.global.words.includes(clean)) {
      data.global.words.push(clean);
    }
  } else {
    ensureGuild(data, guildId);
    if (!data.guilds[guildId].words.includes(clean)) {
      data.guilds[guildId].words.push(clean);
    }
  }

  save(data);
}

function isWordBlacklisted(guildId, text) {
  const data = load();
  const normalizedText = normalize(text);

  for (const w of data.global.words) {
    if (normalizedText.includes(w)) {
      return { blocked: true, scope: "global", word: w };
    }
  }

  for (const w of data.guilds[guildId]?.words || []) {
    if (normalizedText.includes(w)) {
      return { blocked: true, scope: "guild", word: w };
    }
  }

  for (const w of data.global.words) {
    if (fuzzyMatch(normalizedText, w)) {
      return { blocked: true, scope: "global", word: w };
    }
  }

  for (const w of data.guilds[guildId]?.words || []) {
    if (fuzzyMatch(normalizedText, w)) {
      return { blocked: true, scope: "guild", word: w };
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
