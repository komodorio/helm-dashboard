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
  rules: {
    // please dont make an error occure here we use console.error
    "no-console": ["warn", { allow: ["warn"] }],
    "no-alert": "error",
    "no-debugger": "error",
    "@typescript-eslint/ban-ts-comment": "off",
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
};
