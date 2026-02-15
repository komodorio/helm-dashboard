import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tsEslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import tscPlugin from "eslint-plugin-tsc";

export default defineConfig(
  {
    ignores: ["dist", "node_modules"],
  },

  js.configs.recommended,
  tsEslint.configs.recommendedTypeChecked,
  // tsEslint.configs.strictTypeChecked, // The project is not ready yet
  // tsEslint.configs.stylisticTypeChecked, // Added for better 2026 coding standards, however the project is not ready yet
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        heap: "writable",
        DD_RUM: "writable",
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
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      import: importPlugin,
      tsc: tscPlugin,
    },
    rules: {
      /* ───────── Base Overrides ───────── */
      "no-console": ["error", { allow: ["error", "warn"] }],
      "no-debugger": "error",
      quotes: ["error", "double"],
      semi: ["error", "always"],

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
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],

      // Ban Specific Types
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
    files: ["src/**/*.ts", "src/**/*.tsx", "cypress/**/*.ts"],
    rules: {
      "tsc/config": ["error", { configFile: "./tsconfig.app.json" }],
    },
  },
  {
    files: ["vite.config.ts", "cypress.config.ts"],
    rules: {
      "tsc/config": ["error", { configFile: "./tsconfig.node.json" }],
    },
  },
  {
    // Disable type-aware rules for the config file itself to prevent "unsafe" errors
    files: ["eslint.config.js"],
    rules: {
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },

  prettierRecommended
);
