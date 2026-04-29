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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const BOT_OWNER_ID = "201339719584317440";
const BETA_ALERTS = true;

async function sendOwnerBlacklistAlert(client, interaction, result) {
  if (!BETA_ALERTS) return;

  try {
    const owner = await client.users.fetch(BOT_OWNER_ID);
    const dm = await owner.createDM();

    await dm.send(
      `🚨 Blacklist Trigger\n` +
        `User: ${interaction.user.tag} (${interaction.user.id})\n` +
        `Guild: ${interaction.guild?.name} (${interaction.guildId})\n` +
        `Word: ${result.word}\n` +
        `Scope: ${result.scope}`,
    );
  } catch (err) {
    console.error(err);
  }
}

function containsInvite(text) {
  if (!text) return false;

  const raw = text.toLowerCase();

  if (
    /(discord\.gg\/|discord\.com\/invite|discordapp\.com\/invite)/i.test(raw)
  ) {
    return true;
  }

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
        if (cmd.data && cmd.execute) {
          client.commands.set(cmd.data.name, cmd);
        }
      }
    }
  }
}

async function updateTopGGStats() {
  try {
    const totalServers = client.guilds.cache.size;

    const res = await fetch(`https://top.gg/api/bots/${botId}/stats`, {
      method: "POST",
      headers: {
        Authorization: topggToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ server_count: totalServers }),
    });

    if (!res.ok) {
      console.error(res.status);
    }
  } catch (err) {
    console.error(err);
  }
}

const startTime = Date.now();

client.once(Events.ClientReady, async () => {
  const wotd = await getWordOfTheDay();

  const unglorpified = wotd.word;
  const glorpified = glorp.toGalactic(unglorpified);

  const presence = `Word of the day: ${glorpified}`;

  client.user.setPresence({
    activities: [{ name: presence }],
  });

  const totalServers = client.guilds.cache.size;
  let totalUsers = 0;

  for (const guild of client.guilds.cache.values()) {
    totalUsers += guild.memberCount;
  }

  updateTopGGStats();
  setInterval(updateTopGGStats, 86400000);

  const bootTime = Date.now() - startTime;

  console.log("\n");
  console.log("===== GLORP BOT =====");
  console.log(`User: ${client.user.tag}`);
  console.log(`Boot: ${bootTime}ms`);
  console.log("===== BOT STATS =====");
  console.log("Servers:", totalServers);
  console.log("Users:", totalUsers);
  console.log("== WORD OF THE DAY ==");

  console.log("WOTD (unglorpified):", unglorpified);
  console.log("WOTD (glorpified):", glorpified);
  console.log("====================");
  console.log("\n");
});

function extractStrings(option) {
  let values = [];

  if (!option) return values;

  if (typeof option.value === "string") {
    values.push(option.value);
  }

  if (option.options) {
    for (const sub of option.options) {
      values = values.concat(extractStrings(sub));
    }
  }

  return values;
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (
    interaction.guildId &&
    isUserBlacklisted(interaction.guildId, interaction.user.id)
  ) {
    return interaction.reply({
      content: "<:GlorpNerd:1269929450712203264> You are blacklisted.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const strings = [
    interaction.commandName,
    ...(interaction.options?.data
      ? interaction.options.data.flatMap(extractStrings)
      : []),
  ];

  for (const str of strings) {
    if (!str) continue;

    if (containsInvite(str)) {
      await sendOwnerBlacklistAlert(client, interaction, {
        word: "discord-invite",
        scope: "invite",
      });

      return interaction.reply({
        content:
          "<:GlorpNerd:1269929450712203264> Discord invites are not allowed.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const result = isWordBlacklisted(interaction.guildId, str);

    if (result.blocked) {
      await sendOwnerBlacklistAlert(client, interaction, result);

      return interaction.reply({
        content: `<:GlorpNerd:1269929450712203264> Blocked: \`${result.word}\` (${result.scope})`,
        flags: MessageFlags.Ephemeral,
      });
    }
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    await interaction.reply({
      content: "<:GlorpNerd:1269929450712203264> Error occurred.",
      flags: MessageFlags.Ephemeral,
    });
  }
});

(async () => {
  scanCommands(path.join(__dirname, "commands"));
  client.login(token);
})();
