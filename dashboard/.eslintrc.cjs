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
  extends: ["enpitech"],
  rules: {
    // please don't make an error occur here we use console.error
    "no-console": ["error", { allow: ["error"] }],
    "no-alert": "error",
    "no-debugger": "error",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { vars: "all", args: "after-used", ignoreRestSiblings: true },
    ],
  },
  root: true,
}
