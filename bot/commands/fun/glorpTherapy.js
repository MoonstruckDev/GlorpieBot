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
      .addBooleanOption((option) =>
        option
          .setName("rounded")
          .setDescription("Make avatar rounded?")
          .setRequired(false),
      ),

    async execute(interaction) {
      try {
        const user = interaction.options.getUser("user");
        const rounded = interaction.options.getBoolean("rounded") === true;

        await interaction.deferReply();

        const canvas = createCanvas(2500, 1667);
        const ctx = canvas.getContext("2d");

        const background = await loadImage(
          "commands/fun/assets/theraglorp.png",
        );

        const avatarURL = user.displayAvatarURL({
          extension: "png",
          size: 1024,
        });

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
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
          ctx.restore();
        } else {
          ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
        }

        const buffer = canvas.toBuffer("image/png");

        const attachment = new AttachmentBuilder(buffer, {
          name: "therapy.png",
        });

        await interaction.editReply({ files: [attachment] });
      } catch (err) {
        console.error(err);

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply("❌ Failed to generate image.");
        } else {
          await interaction.reply("❌ Failed to generate image.");
        }
      }
    },
  },
];
