const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const path = require("path");

registerFont(path.join(__dirname, "assets/fonts/SGA.ttf"), {
  family: "minecraft enchantment",
});

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
  return res.toLowerCase();
};

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName("glerapy")
      .setDescription("Generate an image of a user in therapy")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to put in therapy")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("text")
          .setDescription("Message to display")
          .setMaxLength(200),
      )
      .addBooleanOption((option) =>
        option.setName("glorp").setDescription("Force everything to Galactic?"),
      )
      .addBooleanOption((option) =>
        option
          .setName("use_original_profile_picture")
          .setDescription("Use original PFP"),
      )
      .addBooleanOption((option) =>
        option.setName("rounded").setDescription("Make avatar rounded?"),
      ),

    async execute(interaction) {
      try {
        const user = interaction.options.getUser("user");
        const useOriginalProfile =
          interaction.options.getBoolean("use_original_profile_picture") ===
          true;
        const rounded = interaction.options.getBoolean("rounded") === true;
        const forceGlorp = interaction.options.getBoolean("glorp") === true;
        const rawInput = interaction.options.getString("text") || "";

        const words = rawInput.split(" ").map((word) => {
          const isGlorped = SYMBOLS.some((s) => word.includes(s));
          return {
            original: word,
            clean: isGlorped
              ? fromGalactic(word)
              : forceGlorp
                ? word.toLowerCase()
                : word,
            isGlorp: isGlorped || forceGlorp,
          };
        });

        await interaction.deferReply();
        const canvas = createCanvas(2500, 1667);
        const ctx = canvas.getContext("2d");
        const background = await loadImage(
          path.join(__dirname, "assets/theraglorp.png"),
        );

        let avatarURL = useOriginalProfile
          ? user.displayAvatarURL({ extension: "png", size: 1024 })
          : ((
              await interaction.guild?.members.fetch(user.id).catch(() => null)
            )?.displayAvatarURL({ extension: "png", size: 1024 }) ??
            user.displayAvatarURL({ extension: "png", size: 1024 }));

        const avatar = await loadImage(avatarURL);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        const avatarSize = 300;
        const x = 160;
        const y = 550;

        if (rounded) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            x + avatarSize / 2,
            y + avatarSize / 2,
            avatarSize / 2,
            0,
            Math.PI * 2,
          );
          ctx.clip();
          ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
          ctx.restore();
        } else {
          ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
        }

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 6;

        let fontSize = 70;
        const maxWidth = 1800;
        const maxHeight = 450;
        let lines = [];

        const calculateLayout = (size) => {
          const tempLines = [];
          let currentLine = [];
          let currentLineWidth = 0;

          for (const wordObj of words) {
            ctx.font = wordObj.isGlorp
              ? `${size}px "minecraft enchantment"`
              : `bold ${size}px Arial`;
            const wordWidth = ctx.measureText(wordObj.clean + " ").width;

            if (
              currentLineWidth + wordWidth > maxWidth &&
              currentLine.length > 0
            ) {
              tempLines.push(currentLine);
              currentLine = [];
              currentLineWidth = 0;
            }
            currentLine.push({ ...wordObj, width: wordWidth });
            currentLineWidth += wordWidth;
          }
          if (currentLine.length > 0) tempLines.push(currentLine);
          return tempLines;
        };

        lines = calculateLayout(fontSize);
        while (lines.length * (fontSize + 15) > maxHeight && fontSize > 20) {
          fontSize -= 5;
          lines = calculateLayout(fontSize);
        }

        const totalHeight = lines.length * (fontSize + 15);
        let currentY = 1450 - totalHeight / 2;

        for (const line of lines) {
          const lineWidth = line.reduce((sum, w) => sum + w.width, 0);
          let currentX = (canvas.width - lineWidth) / 2;

          for (const word of line) {
            ctx.font = word.isGlorp
              ? `${fontSize}px "minecraft enchantment"`
              : `bold ${fontSize}px Arial`;
            ctx.strokeText(word.clean, currentX, currentY);
            ctx.fillText(word.clean, currentX, currentY);
            currentX += word.width;
          }
          currentY += fontSize + 15;
        }

        const buffer = canvas.toBuffer("image/png");
        const attachment = new AttachmentBuilder(buffer, {
          name: "therapy.png",
        });
        await interaction.editReply({ files: [attachment] });
      } catch (err) {
        console.error(err);
        const errorMsg =
          "<a:GlorpCokeExplodeBackflipXD:1355662246524747886> Error.";
        if (interaction.deferred)
          await interaction.editReply({ content: errorMsg });
      }
    },
  },
];
