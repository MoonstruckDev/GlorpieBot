const { SlashCommandBuilder } = require("discord.js");
const GayCache = require("../../utils/gayData/gayHandler.js");
const { updateLeaderboard } = require("../../utils/gayData/gayLeaderboard.js");
const { leaderboardChannelId } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gay")
    .setDescription("Gay counter operations")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Increase someone's gay counter")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to increment")
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("get")
        .setDescription("Get someone's gay counter")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to check")
            .setRequired(true),
        ),
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const target = interaction.options.getUser("user");

    if (interaction.user.id === target.id)
      return interaction.reply({
        content: "You cannot add to yourself",
        ephemeral: true,
      });

    if (subcommand === "add") {
      const count = GayCache.increment(target.id);

      await interaction.reply(
        `${target} has been gay **${count}** time${count === 1 ? "" : "s"} 🏳️‍🌈`,
      );

      if (interaction.inGuild()) {
        await updateLeaderboard(interaction.client, leaderboardChannelId);
      }
    }

    if (subcommand === "get") {
      const count = GayCache.get(target.id);

      await interaction.reply(
        `${target} has been gay **${count}** time${count === 1 ? "" : "s"} 🏳️‍🌈`,
      );
    }
  },
};
