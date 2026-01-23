const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("node:path");

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName("nova")
      .setDescription("Replies with a delightful lyric"),
    async execute(interaction) {
      const lyricsPath = path.join(__dirname, "lyrics.txt");
      const data = await fs.readFile(lyricsPath, "utf-8");
      const lines = data.split("\n").filter(Boolean);
      const randomlyric = lines[Math.floor(Math.random() * lines.length)];

      await interaction.reply(randomlyric);
    },
  },
];
