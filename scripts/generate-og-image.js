const sharp = require("sharp");
const path = require("path");

sharp(path.join(__dirname, "..", "src", "assets", "og-image.svg"))
  .png()
  .toFile(path.join(__dirname, "..", "src", "assets", "og-image.png"))
  .then(() => console.log("og-image.png generated"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
