const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    const globalCommands = await rest.get(Routes.applicationCommands(clientId));
    const guildCommands = await rest.get(
      Routes.applicationGuildCommands(clientId, guildId),
    );

    // Fetch guild name
    const guild = await rest.get(Routes.guild(guildId));
    const guildName = guild?.name ?? "Unknown Guild";

    console.log("=== GLOBAL COMMANDS ===");
    if (globalCommands.length === 0) console.log("No global commands.");
    else globalCommands.forEach((cmd) => console.log(`- ${cmd.name}`));

    console.log(`\n=== GUILD COMMANDS (${guildName}) ===`);
    if (guildCommands.length === 0) console.log("No guild commands.");
    else guildCommands.forEach((cmd) => console.log(`- ${cmd.name}`));
  } catch (err) {
    console.error(err);
  }
})();
