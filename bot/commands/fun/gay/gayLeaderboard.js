const fs = require("node:fs");
const path = require("node:path");
const GayCache = require("./gayHandler.js");

// project-root/data/gay
const dataDir = path.join(process.cwd(), "data", "gay");
const filePath = path.join(dataDir, "leaderboard.json");

function loadData() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function buildLeaderboardText(guildId) {
  const entries = Object.entries(GayCache.getAll(guildId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (entries.length === 0) {
    return "🏳️‍🌈 **Gay Leaderboard** 🏳️‍🌈\n\nNo data yet.";
  }

  const medals = ["🥇", "🥈", "🥉"];

  const lines = entries.map(([userId, count], index) => {
    const medal = medals[index] ?? "🔹";
    return `${medal} <@${userId}> — **${count}**`;
  });

  return `🏳️‍🌈 **Gay Leaderboard** 🏳️‍🌈\n\n${lines.join("\n")}`;
}

async function ensureLeaderboardExists(client, guildId, channelId) {
  if (!guildId || !channelId) return;

  const data = loadData();
  data[guildId] ??= { channelId, messageId: null };
  data[guildId].channelId = channelId;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  if (data[guildId].messageId) {
    try {
      await channel.messages.fetch(data[guildId].messageId);
      saveData(data);
      return;
    } catch {
      data[guildId].messageId = null;
    }
  }

  const message = await channel.send(buildLeaderboardText(guildId));
  data[guildId].messageId = message.id;
  saveData(data);
}

async function updateLeaderboard(client, guildId) {
  const data = loadData();
  const entry = data[guildId];
  if (!entry?.channelId) return;

  const channel = await client.channels
    .fetch(entry.channelId)
    .catch(() => null);
  if (!channel) return;

  try {
    const message = await channel.messages.fetch(entry.messageId);
    await message.edit(buildLeaderboardText(guildId));
  } catch {
    entry.messageId = null;
    saveData(data);
    await ensureLeaderboardExists(client, guildId, entry.channelId);
  }
}

module.exports = {
  ensureLeaderboardExists,
  updateLeaderboard,
};
