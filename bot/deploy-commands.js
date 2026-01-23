const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");

const commands = [];
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const commandExports = require(filePath);

    const commandList = Array.isArray(commandExports)
      ? commandExports
      : [commandExports];

    for (const command of commandList) {
      if ("data" in command && "execute" in command) {
        commands.push(command.data.toJSON());
      }
    }
  }
}

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    const data = await rest.put(Routes.applicationCommands(clientId), {
      body: commands,
    });

    console.log(
      "Global commands deployed:",
      data.map((c) => c.name),
    );
  } catch (error) {
    console.error("Failed to deploy global commands:", error);
  }
})();
