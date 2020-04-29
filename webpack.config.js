const WebpackPwaManifest = require("webpack-pwa-manifest");
const path = require("path");

const config = {
  // Update the entry point
  entry: {
    index: "./public/index.js",
    // db: "./public/db.js",
  },
  output: {
    path: __dirname + "/public/dist",
    filename: "[name].bundle.js",
  },
  mode: "development",
  plugins: [
    new WebpackPwaManifest({
      name: "Budget Tracker PWA",
      filename: "manifest.json",
      inject: false,
      fingerprints: false,
      short_name: "Budget Tracker",
      description: "My awesome Progressive Web App!",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      start_url: "/",
      display: "standalone",
      crossorigin: "anonymous", //can be null, use-credentials or anonymous
      icons: [
        {
          src: path.resolve(
            __dirname,
            "public/icons/icon-512x512.png"
          ),
          // the plugin will generate an image for each size
          // included in the size array
          size: [72, 96, 128, 144, 152, 192, 384, 512],
        },
      ],
    }),
  ],
};

module.exports = config;
