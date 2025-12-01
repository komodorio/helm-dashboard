import { defineConfig } from "eslint/config";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import tscPlugin from "eslint-plugin-tsc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    ignores: ["eslint.config.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        heap: "writable",
        DD_RUM: "writable",
      },

      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },

    extends: compat.extends(
      "enpitech",
      "eslint:recommended",
      "plugin:prettier/recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react-hooks/recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ),

    plugins: {
      "@typescript-eslint": typescriptEslint,
      tsc: tscPlugin,
      react,
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      "no-console": [
        "error",
        {
          allow: ["error"],
        },
      ],

      "no-alert": "error",
      "no-debugger": "error",
      "@typescript-eslint/ban-ts-comment": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
        },
      ],

      "react/react-in-jsx-scope": "off",
      "linebreak-style": ["error", "unix"],
      quotes: ["error", "double"],
      semi: ["error", "always"],

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],
      "tsc/config": ["error", { configFile: "./tsconfig.json" }],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },

      sourceType: "script",
      parserOptions: {},
    },

    files: ["**/.eslintrc.{js,cjs}"],
  },
]);
