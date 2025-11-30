import { defineConfig } from "eslint/config";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import react from "eslint-plugin-react";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
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
        },
    },

    extends: compat.extends(
        "enpitech",
        "eslint:recommended",
        "plugin:prettier/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react-hooks/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        react,
    },

    settings: {
        react: {
            version: "detect"
        },
    },

    rules: {
        "no-console": ["error", {
            allow: ["error"],
        }],

        "no-alert": "error",
        "no-debugger": "error",
        "@typescript-eslint/ban-ts-comment": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            vars: "all",
            args: "after-used",
            ignoreRestSiblings: true,
        }],

        "react/react-in-jsx-scope": "off",
        "linebreak-style": ["error", "unix"],
        quotes: ["error", "double"],
        semi: ["error", "always"],
        "@typescript-eslint/no-explicit-any": "warn",
    },
}, {
    languageOptions: {
        globals: {
            ...globals.node,
        },

        sourceType: "script",
        parserOptions: {},
    },

    files: ["**/.eslintrc.{js,cjs}"],
}]);
