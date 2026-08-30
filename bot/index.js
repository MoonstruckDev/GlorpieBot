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

const {
  isUserBlacklisted,
  isWordBlacklisted,
} = require("./startup/blacklist/blacklistService.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const ALERT_CHANNEL_ID = "1498991452946956318";
const BETA_ALERTS = true;
const startTime = Date.now();

async function sendOwnerBlacklistAlert(client, interaction, result) {
  if (!BETA_ALERTS) return;
  try {
    const channel = await client.channels.fetch(ALERT_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    await channel.send(
      `🚨 Blacklist Trigger\n` +
        `User: ${interaction.user.tag} (${interaction.user.id})\n` +
        `Guild: ${interaction.guild?.name || "Unknown Guild"} (${interaction.guildId})\n` +
        `Word: ${result.word}\n` +
        `Scope: ${result.scope}`,
    );
  } catch (err) {
    console.error("Failed to send blacklist alert:", err);
  }
}

function containsInvite(text) {
  if (!text) return false;
  const raw = text.toLowerCase();
  if (/(discord\.gg\/|discord\.com\/invite|discordapp\.com\/invite)/i.test(raw))
    return true;
  const cleaned = raw
    .replace(/\(dot\)|\[dot\]/g, ".")
    .replace(/\[?\.\]?/g, ".")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9.]/g, "");
  return (
    cleaned.includes("discord.gg") || cleaned.includes("discord.cominvite")
  );
}

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

async function updateTopGGStats() {
  try {
    const totalServers = client.guilds.cache.size;
    await fetch(`https://top.gg/api/bots/${botId}/stats`, {
      method: "POST",
      headers: {
        Authorization: topggToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ server_count: totalServers }),
    });
  } catch (err) {
    console.error(err);
  }
}

client.once(Events.ClientReady, async () => {
  const wotd = await getWordOfTheDay();
  const unglorpified = wotd.word;
  const glorpified = glorp.toGalactic(unglorpified);

  client.user.setPresence({
    activities: [{ name: `Word of the day: ${glorpified}` }],
  });

  const totalServers = client.guilds.cache.size;
  let totalUsers = 0;
  for (const guild of client.guilds.cache.values()) {
    totalUsers += guild.memberCount;
  }

  updateTopGGStats();
  setInterval(updateTopGGStats, 86400000);

  const bootTime = Date.now() - startTime;

  console.log("\n===== GLORP BOT =====");
  console.log(`User: ${client.user.tag}`);
  console.log(`Boot: ${bootTime}ms`);
  console.log("===== BOT STATS =====");
  console.log("Servers:", totalServers);
  console.log("Users:", totalUsers);
  console.log("== WORD OF THE DAY ==");
  console.log("WOTD (unglorpified):", unglorpified);
  console.log("WOTD (glorpified):", glorpified);
  console.log("====================\n");
});

function extractStrings(option) {
  let values = [];
  if (!option) return values;
  if (typeof option.value === "string") values.push(option.value);
  if (option.options) {
    for (const sub of option.options)
      values = values.concat(extractStrings(sub));
  }
  return values;
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (
    interaction.guildId &&
    isUserBlacklisted(interaction.guildId, interaction.user.id)
  ) {
    return interaction.reply({
      content: "<:GlorpNerd:1269929450712203264> You are blacklisted.",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (interaction.commandName !== "moderation") {
    const inputStrings = interaction.options.data.flatMap(extractStrings);
    for (const str of inputStrings) {
      if (!str) continue;
      if (containsInvite(str)) {
        await sendOwnerBlacklistAlert(client, interaction, {
          word: "discord-invite",
          scope: "invite",
        });
        return interaction.reply({
          content: "<:GlorpNerd:1269929450712203264> Invites are not allowed.",
          flags: MessageFlags.Ephemeral,
        });
      }
      const result = isWordBlacklisted(interaction.guildId, str);
      if (result.blocked) {
        await sendOwnerBlacklistAlert(client, interaction, result);
        return interaction.reply({
          content: `<:GlorpNerd:1269929450712203264> Blocked: \`${result.word}\``,
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "<:GlorpNerd:1269929450712203264> Error occurred.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

(async () => {
  scanCommands(path.join(__dirname, "commands"));
  client.login(token);
})();
