const fs = require("node:fs");
const path = require("node:path");
const GayCache = require("./gayHandler.js");

const dataDir = path.join(__dirname, "data");
const filePath = path.join(dataDir, "leaderboard.json");

function loadData() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ messageId: null }, null, 2));
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function buildLeaderboardText() {
  const entries = Object.entries(GayCache.getAll())
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

  return `🏳️‍🌈 **Gay Leaderboard** 🏳️‍🌈\n‎\n*To add to the count use /gay add @user*\n\n${lines.join("\n")}`;
}

async function ensureLeaderboardExists(client, channelId) {
  const data = loadData();
  const channel = await client.channels.fetch(channelId);
  if (!channel) return;

  if (data.messageId) {
    try {
      await channel.messages.fetch(data.messageId);
      return;
    } catch {
      data.messageId = null;
    }
  }

  const message = await channel.send(buildLeaderboardText());
  data.messageId = message.id;
  saveData(data);
}

async function updateLeaderboard(client, channelId) {
  const data = loadData();
  if (!data.messageId) return;

  const channel = await client.channels.fetch(channelId);
  if (!channel) return;

  try {
    const message = await channel.messages.fetch(data.messageId);
    await message.edit(buildLeaderboardText());
  } catch {
    data.messageId = null;
    saveData(data);
  }
}

module.exports = {
  ensureLeaderboardExists,
  updateLeaderboard,
};
