const { SlashCommandBuilder } = require("discord.js");
const BitchassCache = require("../bitchass/bitchassCache");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bitchass")
    .setDescription("Determine how much of a bitchass you are")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Who to check (optional)")
        .setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser("user") || interaction.user;

    let bitchassLevel = BitchassCache.get(target.id);

    if (bitchassLevel === null) {
      bitchassLevel = Math.floor(Math.random() * 101);
      BitchassCache.set(target.id, bitchassLevel);
    }

    await interaction.reply(`${target} is ${bitchassLevel}% a bitchass!`);
  },
};
