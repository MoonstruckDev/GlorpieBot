const { SlashCommandBuilder } = require("discord.js");
const GayCache = require("../gay/gayHandler.js");
const { updateLeaderboard } = require("../gay/gayLeaderboard.js");

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
    const guildId = interaction.guildId;

    if (interaction.user.id === target.id)
      return interaction.reply({
        content: "You cannot add to yourself",
        ephemeral: true,
      });

    if (subcommand === "add") {
      const count = GayCache.increment(target.id, guildId);

      await interaction.reply(
        `${target} has been gay **${count}** time${count === 1 ? "" : "s"} 🏳️‍🌈`,
      );

      await updateLeaderboard(interaction.client, guildId);
    }

    if (subcommand === "get") {
      const count = GayCache.get(target.id, guildId);

      await interaction.reply(
        `${target} has been gay **${count}** time${count === 1 ? "" : "s"} 🏳️‍🌈`,
      );
    }
  },
};
