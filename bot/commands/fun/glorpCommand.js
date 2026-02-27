const { SlashCommandBuilder } = require("discord.js");

const GALACTIC = {
  A: "ᔑ",
  B: "ʖ",
  C: "ᓵ",
  D: "↸",
  E: "ᒷ",
  F: "⎓",
  G: "⊣",
  H: "⍑",
  I: "╎",
  J: "⋮",
  K: "ꖌ",
  L: "ꖎ",
  M: "ᒲ",
  N: "リ",
  O: "𝙹",
  P: "!¡",
  Q: "ᑑ",
  R: "∷",
  S: "ᓭ",
  T: "ℸ ̣ ",
  U: "⚍",
  V: "⍊",
  W: "∴",
  X: "̇ ̇/",
  Y: "|​|​",
  Z: "⨅",
};

const NORMAL = Object.fromEntries(
  Object.entries(GALACTIC).map(([k, v]) => [v, k]),
);

const SYMBOLS = Object.keys(NORMAL).sort((a, b) => b.length - a.length);

const toGalactic = (text) => {
  text = text.replace(/<@&(\d+)>/g, "\x00[Role Ping]\x00");
  text = text.replace(/@everyone/g, "\x00[everyone]\x00");
  text = text.replace(/@here/g, "\x00[here]\x00");
  return text.replace(
    /(\x00[^\x00]+\x00)|(<a?:\w+:\d+>)|([^])/g,
    (_, placeholder, emote, char) => {
      if (placeholder) return placeholder.replaceAll("\x00", "");
      if (emote) return emote;
      return GALACTIC[char.toUpperCase()] || char;
    },
  );
};

const fromGalactic = (text) => {
  text = text.replace(/<@&(\d+)>/g, "[role]");
  text = text.replace(/@everyone/g, "[everyone]");
  text = text.replace(/@here/g, "[here]");
  let res = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "<") {
      const emoteMatch = text.slice(i).match(/^<a?:\w+:\d+>/);
      if (emoteMatch) {
        res += emoteMatch[0];
        i += emoteMatch[0].length;
        continue;
      }
    }
    const sym = SYMBOLS.find((s) => text.startsWith(s, i));
    if (sym) {
      res += NORMAL[sym];
      i += sym.length;
    } else {
      res += text[i++];
    }
  }
  return res.toLowerCase().replace(/^./, (c) => c.toUpperCase());
};

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName("glorp")
      .setDescription(
        "Convert normal text to Galactic. Note: non english characters and numbers don't get translated",
      )
      .addStringOption((opt) =>
        opt
          .setName("text")
          .setDescription("Text to convert")
          .setRequired(true)
          .setMaxLength(600),
      ),
    async execute(interaction) {
      const text = interaction.options.getString("text");
      await interaction.reply(toGalactic(text));
    },
  },

  {
    data: new SlashCommandBuilder()
      .setName("unglorp")
      .setDescription("Convert Galactic text to normal")
      .addStringOption((opt) =>
        opt.setName("text").setDescription("Text to convert").setRequired(true),
      ),
    async execute(interaction) {
      const text = interaction.options.getString("text");

      await interaction.reply(
        fromGalactic(text)
          .toLowerCase()
          .replace(/^./, (c) => c.toUpperCase()),
      );
    },
  },
];

module.exports.toGalactic = toGalactic;
