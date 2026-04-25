const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");

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
          .setDescription("Message to display on image (max 200 chars)")
          .setMaxLength(200),
      )

      .addBooleanOption((option) =>
        option
          .setName("use_original_profile_picture")
          .setDescription(
            "Use the user's original profile picture instead of their server avatar",
          ),
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

        const text = interaction.options.getString("text") || "";

        await interaction.deferReply();

        const canvas = createCanvas(2500, 1667);
        const ctx = canvas.getContext("2d");

        const background = await loadImage(
          "commands/fun/assets/theraglorp.png",
        );

        // =========================
        // AVATAR LOGIC (SAFE)
        // =========================
        let avatarURL;

        if (useOriginalProfile) {
          avatarURL = user.displayAvatarURL({
            extension: "png",
            size: 1024,
          });
        } else {
          const member = interaction.member;

          avatarURL =
            member?.displayAvatarURL?.({
              extension: "png",
              size: 1024,
            }) ??
            user.displayAvatarURL({
              extension: "png",
              size: 1024,
            });
        }

        const avatar = await loadImage(avatarURL);

        // =========================
        // BACKGROUND
        // =========================
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        const avatarSize = 300;
        const x = 160;
        const y = 550;

        // =========================
        // AVATAR DRAW
        // =========================
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

        // =========================
        // 🔥 BULLETPROOF TEXT ENGINE
        // =========================
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 6;
        ctx.textAlign = "center";

        const textX = canvas.width / 2;
        const maxWidth = 1800;
        const maxHeight = 450;

        let fontSize = 70;
        ctx.font = `bold ${fontSize}px Sans`;

        const wrapText = () => {
          const lines = [];
          let line = "";

          for (const word of text.split(" ")) {
            if (!word) continue;

            // handle extremely long single "word"
            if (ctx.measureText(word).width > maxWidth) {
              let chunk = "";

              for (const char of word) {
                const test = chunk + char;

                if (ctx.measureText(test).width > maxWidth) {
                  lines.push(chunk);
                  chunk = char;
                } else {
                  chunk = test;
                }
              }

              if (chunk) lines.push(chunk);
              continue;
            }

            const testLine = line ? `${line} ${word}` : word;

            if (ctx.measureText(testLine).width > maxWidth) {
              if (line) lines.push(line);
              line = word;
            } else {
              line = testLine;
            }
          }

          if (line) lines.push(line);

          return lines;
        };

        let lines = wrapText();

        // shrink font if too tall
        while (lines.length * (fontSize + 10) > maxHeight && fontSize > 20) {
          fontSize -= 5;
          ctx.font = `bold ${fontSize}px Sans`;
          lines = wrapText();
        }

        // vertical centering
        const totalHeight = lines.length * (fontSize + 10);
        let textY = 1450 - totalHeight / 2;

        for (const line of lines) {
          ctx.strokeText(line, textX, textY);
          ctx.fillText(line, textX, textY);
          textY += fontSize + 10;
        }

        // =========================
        // OUTPUT
        // =========================
        const buffer = canvas.toBuffer("image/png");

        const attachment = new AttachmentBuilder(buffer, {
          name: "therapy.png",
        });

        await interaction.editReply({
          files: [attachment],
        });
      } catch (err) {
        console.error(err);

        const errorMsg = "❌ Failed to generate image.";

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: errorMsg });
        } else {
          await interaction.reply({
            content: errorMsg,
            ephemeral: true,
          });
        }
      }
    },
  },
];
