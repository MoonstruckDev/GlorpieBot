const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sharex")
    .setDescription("Manage Lucii's ShareX lines")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a line to the ShareX file")
        .addStringOption((option) =>
          option
            .setName("text")
            .setDescription(
              "Text to add (auto converts to filename: UPPERCASE + _ + random extension)",
            )
            .setMaxLength(32)
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("get").setDescription("Get the current ShareX file"),
    ),

  async execute(interaction) {
    const sharexPath = path.join(__dirname, "randomline.txt");

    if (interaction.options.getSubcommand() === "add") {
      const untreatedText = interaction.options
        .getString("text")
        .toUpperCase()
        .replace(/[!¡]/g, "")
        .replace(/ /g, "_");

      const extensions = [
        ".txt",
        ".exe",
        ".dll",
        ".jpg",
        ".png",
        ".bat",
        ".sys",
      ];
      const ext = extensions[(Math.random() * extensions.length) | 0];
      const treatedText = untreatedText + ext;

      const current = fs.readFileSync(sharexPath, "utf8").trimEnd();
      fs.writeFileSync(sharexPath, current + "\n" + treatedText + "\n");

      await interaction.reply({
        content: `Added **${treatedText}** to Lucii's ShareX file\n\n⚠️ *Note: Your text was auto-converted into a filename format (UPPERCASE, spaces → _, random extension added).*`,
      });
    } else {
      await interaction.reply({
        content: "Here’s the current ShareX file:",
        files: [{ attachment: sharexPath, name: "sharex.txt" }],
      });
    }
  },
};
