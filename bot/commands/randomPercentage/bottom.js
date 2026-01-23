const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bottom")
    .setDescription("Determine how much of a bottom you are")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Who to check (optional)")
        .setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;

    const bottomLevel =
      target.id === "967867229410574340"
        ? 100
        : Math.floor(Math.random() * 101);

    await interaction.reply(
      `${target} is ${bottomLevel}% a submissive little bottom!`,
    );
  },
};
