const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: [".eleventy.js", "scripts/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        module: "readonly",
        require: "readonly",
        __dirname: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
    },
  },
  {
    files: ["src/assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        IntersectionObserver: "readonly",
        ResizeObserver: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
    },
  },
];
