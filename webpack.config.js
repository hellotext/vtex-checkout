const path = require("path");

module.exports = {
  mode: "production",
  entry: {
    funnel: "./src/funnel.js",
    confirmation: "./src/confirmation.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "hellotext-[name].js",
    library: {
      name: "Hellotext",
      type: "umd",
      export: "default",
    },
    globalObject: "typeof self !== 'undefined' ? self : this",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: [/node_modules/],
        use: [{ loader: "babel-loader" }],
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".mjs"],
    alias: {
      // Ensure it points to the core package if you're developing locally
      "hellotext.js": path.resolve(__dirname, "node_modules/hellotext.js"),
    },
  },
};
