// eslint-disable-next-line no-undef
module.exports = {
  env: {
    browser: true,
  },
  // globals are for variables that are defined in other files or runtime
  globals: {
    heap: "writable", // for analytics.js
    DD_RUM: "writable", // for analytics.js
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:storybook/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
};
