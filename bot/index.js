const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
} = require("discord.js");

const {
  token,
  clientId,
  guildId,
  leaderboardChannelId,
} = require("./config.json");

const fs = require("node:fs");
const path = require("node:path");

const BitchassCache = require("./utils/bitchassData/bitchassCache.js");
const GayCache = require("./utils/gayData/gayHandler.js");

const {
  ensureLeaderboardExists,
} = require("./utils/gayData/gayLeaderboard.js");

const { getWordOfTheDay } = require("./utils/wotd/getWord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ["CHANNEL"],
});

// ------------------
// On Ready
// ------------------
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  await ensureLeaderboardExists(readyClient, leaderboardChannelId);

  const wotd = await getWordOfTheDay();
  readyClient.user.setPresence({
    activities: [{ name: `Word of the day: ${wotd.word}` }],
  });
});

client.commands = new Collection();

async function deployCommands() {
  const commands = [];
  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folderOrFile of commandFolders) {
    const fullPath = path.join(foldersPath, folderOrFile);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      const commandFiles = fs
        .readdirSync(fullPath)
        .filter((file) => file.endsWith(".js"));

      for (const file of commandFiles) {
        const filePath = path.join(fullPath, file);
        const exports = require(filePath);
        const list = Array.isArray(exports) ? exports : [exports];

        for (const command of list) {
          if ("data" in command && "execute" in command) {
            commands.push(command.data.toJSON());
          }
        }
      }
    }
  }

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands,
  });

  console.log(`Deployed ${commands.length} guild commands.`);
}

// ------------------
// Load commands
// ------------------
function loadCommands() {
  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(foldersPath, folder);

    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs
      .readdirSync(folderPath)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const exports = require(filePath);
      const list = Array.isArray(exports) ? exports : [exports];

      for (const command of list) {
        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
        }
      }
    }
  }
}

// ------------------
// Interaction handling
// ------------------
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    const reply = {
      content: "There was an error while executing this command!",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
});

// ------------------
// Start bot
// ------------------
(async () => {
  BitchassCache.load();
  GayCache.load();

  await deployCommands();
  loadCommands();

  client.login(token);
})();
