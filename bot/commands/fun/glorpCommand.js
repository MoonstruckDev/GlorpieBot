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
  Y: "|​|",
  Z: "⨅",
};

const NORMAL = Object.fromEntries(
  Object.entries(GALACTIC).map(([k, v]) => [v, k]),
);

const SYMBOLS = Object.keys(NORMAL).sort((a, b) => b.length - a.length);

const toGalactic = (text) =>
  text
    .toUpperCase()
    .split("")
    .map((c) => GALACTIC[c] || c)
    .join("");

const fromGalactic = (text) => {
  let res = "";
  let i = 0;

  while (i < text.length) {
    const sym = SYMBOLS.find((s) => text.startsWith(s, i));

    if (sym) {
      res += NORMAL[sym];
      i += sym.length;
    } else {
      res += text[i++];
    }
  }

  return res;
};

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName("glorp")
      .setDescription("Convert normal text to Galactic")
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
