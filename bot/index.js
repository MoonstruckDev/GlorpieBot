const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} = require("discord.js");

const { token, topggToken, botId } = require("./config.json");
const { getWordOfTheDay } = require("./startup/wotd/getWord.js");
const glorp = require("./commands/fun/glorpCommand.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// -------------------------
// Command Loader
// -------------------------
function scanCommands(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) scanCommands(fullPath);
    else if (entry.name.endsWith(".js")) {
      const command = require(fullPath);
      const list = Array.isArray(command) ? command : [command];
      for (const cmd of list) {
        if (cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
      }
    }
  }
}

// -------------------------
// TOPGG Block
// -------------------------
async function updateTopGGStats() {
  try {
    const totalServers = client.guilds.cache.size;
    let totalUsers = 0;
    client.guilds.cache.forEach((guild) => {
      totalUsers += guild.memberCount;
    });

    const res = await fetch(`https://top.gg/api/bots/${botId}/stats`, {
      method: "POST",
      headers: {
        Authorization: topggToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ server_count: totalServers }),
    });

    if (!res.ok) {
      console.error(
        `Failed to update Top.gg stats: ${res.status} ${res.statusText}`,
      );
    } else {
      console.log(
        `Top.gg stats updated:\nTotal Servers: ${totalServers}\nTotal Users: ${totalUsers}`,
      );
    }
  } catch (err) {
    console.error("Error updating Top.gg stats:", err);
  }
}

// -------------------------
// Client Ready
// -------------------------
client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // ========================
  // WOTD Block
  // ========================
  async function updateWOTD() {
    try {
      const wotd = await getWordOfTheDay();
      const newPresence = `Word of the day: ${glorp.toGalactic(wotd.word)}`;
      const currentActivity = client.user.presence.activities[0]?.name;

      if (currentActivity === newPresence) return;

      client.user.setPresence({
        activities: [{ name: newPresence }],
      });

      console.log("WOTD updated:", wotd.word);
    } catch (err) {
      console.error("Failed to update WOTD:", err);
    }
  }

  function msUntilNextETMidnight() {
    const now = new Date();
    const options = { timeZone: "America/New_York" };
    const nyNow = new Date(now.toLocaleString("en-US", options));

    const next = new Date(nyNow);
    next.setHours(24, 0, 0, 0);
    const delay = next - nyNow;
    return delay > 0 ? delay : 0;
  }

  async function scheduleWOTD() {
    await updateWOTD();
    const delay = msUntilNextETMidnight() + 2 * 60 * 1000;
    console.log(
      `Next WOTD update in ${(delay / 1000 / 60).toFixed(2)} minutes`,
    );
    setTimeout(scheduleWOTD, delay);
  }

  scheduleWOTD();

  // ========================
  // TOPGG Block
  // ========================
  async function updateTopGG() {
    await updateTopGGStats();
  }

  updateTopGG();
  setInterval(updateTopGG, 24 * 60 * 60 * 1000);

  client.on("guildCreate", updateTopGG);
  client.on("guildDelete", updateTopGG);
});

// -------------------------
// Command interactions
// -------------------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error.",
      flags: MessageFlags.Ephemeral,
    });
  }
});

// -------------------------
// Connect
// -------------------------
(async () => {
  scanCommands(path.join(__dirname, "commands"));
  client.login(token);
})();
