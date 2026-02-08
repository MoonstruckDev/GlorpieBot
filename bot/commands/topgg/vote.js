const { SlashCommandBuilder } = require("discord.js");
const { botId } = require("../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Get the link to vote for the bot on Top.gg"),

  async execute(interaction) {
    const voteUrl = `https://top.gg/bot/${botId}/vote`;
    await interaction.reply({
      content: `Thank you for supporting me! You can vote here: ${voteUrl}`,
      ephemeral: true,
    });
  },
};
