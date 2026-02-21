import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import { configs as tseslintConf } from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { flatConfigs as importXFlatConf } from "eslint-plugin-import-x";
import prettierRecommended from "eslint-plugin-prettier/recommended";
// import tscPlugin from "eslint-plugin-tsc";

export default defineConfig(
  { ignores: ["dist", "node_modules"] },

  js.configs.recommended,
  tseslintConf.recommendedTypeChecked,
  // tsEslint.configs.strictTypeChecked, // The project is not ready yet
  // tsEslint.configs.stylisticTypeChecked, // Added for better 2026 coding standards, however the project is not ready yet
  importXFlatConf.recommended,
  importXFlatConf.typescript,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  prettierRecommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: { version: "detect" },
      "import-x/resolver": {
        node: true,
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    // plugins: {
    //   tsc: tscPlugin,
    // },
    rules: {
      /* ───────── Base Overrides ───────── */
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-debugger": "error",
      quotes: ["error", "double"],
      semi: ["error", "always"],

      /* ───────── Import Precision ───────── */
      "import-x/no-duplicates": ["error", { "prefer-inline": true }],

      /* ───────── React Precision ───────── */
      "no-restricted-properties": [
        "error",
        {
          object: "React",
          message:
            "Use named imports instead (e.g. import { useState } from 'react')",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          name: "react",
          importNames: ["default"],
          message: "Default React imports are prohibited. Use named imports.",
        },
      ],

      /* ───────── TypeScript & Verbatim Syntax ───────── */
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],

      "@typescript-eslint/no-restricted-types": [
        "error",
        {
          types: {
            "React.FC": "Use 'import type { FC }' instead.",
            "React.ReactNode": "Use 'import type { ReactNode }' instead.",
            // FC: "Avoid FC (Functional Component) type; prefer explicit return types.",
          },
        },
      ],
    },
  },
  {
    files: ["**/*.{js,mjs}"],
    ...tseslintConf.disableTypeChecked,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["eslint.config.js"],
    rules: { "import-x/no-unresolved": "off" },
  }
);
