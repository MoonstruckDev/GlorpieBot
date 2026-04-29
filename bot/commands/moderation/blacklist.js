const {
  SlashCommandBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");

const blacklistService = require("../../startup/blacklist/blacklistService");

const BOT_OWNER_ID = "201339719584317440";

function hasModPerms(interaction) {
  if (interaction.user.id === BOT_OWNER_ID) return true;

  return (
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) &&
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)
  );
}

function denyPerms(interaction) {
  return interaction.reply({
    content:
      "<:GlorpNerd:1269929450712203264> You need **Manage Messages** and **Manage Roles** to use this command.",
    flags: MessageFlags.Ephemeral,
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("moderation")
    .setDescription("Moderation tools")
    .addSubcommandGroup((group) =>
      group
        .setName("blacklist")
        .setDescription("Manage blacklist")
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("Add a word to blacklist")
            .addStringOption((opt) =>
              opt.setName("word").setDescription("Word").setRequired(true),
            )
            .addBooleanOption((opt) =>
              opt
                .setName("global")
                .setDescription("Global blacklist (owner only)"),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("remove")
            .setDescription("Remove a word from blacklist")
            .addStringOption((opt) =>
              opt.setName("word").setDescription("Word").setRequired(true),
            )
            .addBooleanOption((opt) =>
              opt
                .setName("global")
                .setDescription("Global blacklist (owner only)"),
            ),
        )
        .addSubcommand((sub) =>
          sub.setName("list").setDescription("Show guild blacklist"),
        )
        .addSubcommand((sub) =>
          sub
            .setName("global")
            .setDescription("Show global blacklist (owner only)"),
        ),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const sub = interaction.options.getSubcommand();

    if (!hasModPerms(interaction)) {
      return denyPerms(interaction);
    }

    if (sub === "add") {
      const word = interaction.options.getString("word");
      const globalRequested = interaction.options.getBoolean("global") || false;

      if (globalRequested && interaction.user.id !== BOT_OWNER_ID) {
        return interaction.reply({
          content:
            "<:GlorpNerd:1269929450712203264> Only the bot owner can modify the global blacklist.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const isGlobal = globalRequested && interaction.user.id === BOT_OWNER_ID;

      blacklistService.addWord(guildId, word, isGlobal);

      return interaction.reply({
        content: `✅ Added \`${word}\` to ${isGlobal ? "global" : "guild"} blacklist.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "remove") {
      const word = interaction.options.getString("word");
      const globalRequested = interaction.options.getBoolean("global") || false;

      if (globalRequested && interaction.user.id !== BOT_OWNER_ID) {
        return interaction.reply({
          content:
            "<:GlorpNerd:1269929450712203264> Only the bot owner can modify the global blacklist.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const isGlobal = globalRequested && interaction.user.id === BOT_OWNER_ID;

      const result = blacklistService.removeWord(guildId, word, isGlobal);

      return interaction.reply({
        content: result
          ? `🗑️ Removed \`${word}\` from ${isGlobal ? "global" : "guild"} blacklist.`
          : "<:GlorpNerd:1269929450712203264> Word not found.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "list") {
      const data = blacklistService.getBlacklist(guildId);
      const guildWords = data.guilds[guildId]?.words || [];

      return interaction.reply({
        content:
          `📄 **Guild Blacklist:**\n` +
          `${guildWords.length ? guildWords.join(", ") : "None"}`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (sub === "global") {
      if (interaction.user.id !== BOT_OWNER_ID) {
        return interaction.reply({
          content:
            "<:GlorpNerd:1269929450712203264> Only the bot owner can view the global blacklist.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const data = blacklistService.getBlacklist(guildId);

      return interaction.reply({
        content:
          `<:GlorpDetective:1357811451456131193> **Global Blacklist:**\n` +
          `${data.global.words.length ? data.global.words.join(", ") : "None"}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
