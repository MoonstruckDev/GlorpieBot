const { REST, Routes } = require("discord.js");
const { clientId, guildId, token } = require("./config.json");

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: [],
  });

  console.log("Cleared all guild commands.");
})();
