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

// Updates Top.gg server count

async function updateTopGGStats(guildCount) {
  try {
    const res = await fetch(`https://top.gg/api/bots/${botId}/stats`, {
      method: "POST",
      headers: {
        Authorization: topggToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ server_count: guildCount }),
    });

    if (!res.ok) {
      console.error(
        `Failed to update Top.gg stats: ${res.status} ${res.statusText}`,
      );
    } else {
      console.log(`Top.gg stats updated: ${guildCount} servers`);
    }
  } catch (err) {
    console.error("Error updating Top.gg stats:", err);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const wotd = await getWordOfTheDay();
  client.user.setPresence({
    activities: [{ name: `Word of the day: ${glorp.toGalactic(wotd.word)}` }],
  });

  // Initial Top.gg update
  updateTopGGStats(client.guilds.cache.size);

  // Auto-update
  setInterval(
    () => {
      updateTopGGStats(client.guilds.cache.size);
    },
    24 * 60 * 60 * 1000,
  );
});

client.on("guildCreate", () => updateTopGGStats(client.guilds.cache.size));
client.on("guildDelete", () => updateTopGGStats(client.guilds.cache.size));

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

(async () => {
  scanCommands(path.join(__dirname, "commands"));
  client.login(token);
})();
