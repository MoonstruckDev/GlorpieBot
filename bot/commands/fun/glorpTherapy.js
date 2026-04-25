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

        let avatarURL;

        if (useOriginalProfile) {
          avatarURL = user.displayAvatarURL({
            extension: "png",
            size: 1024,
          });
        } else {
          const member =
            interaction.guild?.members.cache.get(user.id) ??
            (await interaction.guild?.members.fetch(user.id).catch(() => null));

          avatarURL =
            member?.displayAvatarURL({
              extension: "png",
              size: 1024,
            }) ??
            user.displayAvatarURL({
              extension: "png",
              size: 1024,
            });
        }

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
        ctx.textAlign = "center";

        const textX = canvas.width / 2;
        const maxWidth = 1800;
        const maxHeight = 450;

        let fontSize = 70;

        const buildLines = () => {
          const lines = [];
          let line = "";

          ctx.font = `bold ${fontSize}px Sans`;

          for (const word of text.split(" ")) {
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

        let lines = buildLines();

        while (lines.length * (fontSize + 10) > maxHeight && fontSize > 20) {
          fontSize -= 5;
          lines = buildLines();
        }

        const totalHeight = lines.length * (fontSize + 10);
        let textY = 1450 - totalHeight / 2;

        ctx.font = `bold ${fontSize}px Sans`;

        for (const line of lines) {
          ctx.strokeText(line, textX, textY);
          ctx.fillText(line, textX, textY);
          textY += fontSize + 10;
        }

        const buffer = canvas.toBuffer("image/png");

        const attachment = new AttachmentBuilder(buffer, {
          name: "therapy.png",
        });

        await interaction.editReply({ files: [attachment] });
      } catch (err) {
        console.error(err);

        const errorMsg = "❌ Failed to generate image.";

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: errorMsg });
        } else {
          await interaction.reply({ content: errorMsg, ephemeral: true });
        }
      }
    },
  },
];
