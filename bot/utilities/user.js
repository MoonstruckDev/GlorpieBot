function isSelf(interaction, userId, targetId) {
  if (userId === targetId) {
    interaction.reply({
      content: "You can't target yourself!",
      ephemeral: true,
    });
    return true;
  }
  return false;
}

module.exports = {
  isSelf,
};
