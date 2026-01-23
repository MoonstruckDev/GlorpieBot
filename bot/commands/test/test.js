const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName("ping")
      .setDescription("Replies with Pong!"),
    async execute(interaction) {
      await interaction.reply("Pong!");
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("stop")
      .setDescription("Stops the bot (admin only)"),
    async execute(interaction) {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator,
        )
      ) {
        return interaction.reply({
          content: "You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      await interaction.reply("Bot logging out...");
      await interaction.client.destroy();
      console.log("bot logged out");
      process.exit(0);
    },
  },
];
