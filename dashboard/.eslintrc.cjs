module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["enpitech", "plugin:@typescript-eslint/recommended"],
  globals: {
    heap: "writable",
    DD_RUM: "writable",
  },
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react"],
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
    "react/react-in-jsx-scope": "off", // Vite does not require you to import React into each component file
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
