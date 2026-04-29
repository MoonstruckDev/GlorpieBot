const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require("../config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("clientReady", () => {
  let totalUsers = 0;

  for (const guild of client.guilds.cache.values()) {
    totalUsers += guild.memberCount;
  }

  console.log("===== BOT STATS =====");
  console.log("Servers:", client.guilds.cache.size);
  console.log("Users:", totalUsers);
  console.log("=====================");

  client.destroy();
});

client.login(token);
