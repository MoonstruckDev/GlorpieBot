const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");
const { clientId, token } = require("./config.json");

const commands = [];

function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) scan(fullPath);
    else if (entry.name.endsWith(".js")) {
      const command = require(fullPath);
      const list = Array.isArray(command) ? command : [command];

      for (const cmd of list) {
        if (cmd.data && cmd.execute) commands.push(cmd.data.toJSON());
      }
    }
  }
}

scan(path.join(__dirname, "commands"));

new REST({ version: "10" })
  .setToken(token)
  .put(Routes.applicationCommands(clientId), { body: commands })
  .then((data) =>
    console.log(
      "Deployed globally:",
      data.map((c) => c.name),
    ),
  )
  .catch(console.error);
