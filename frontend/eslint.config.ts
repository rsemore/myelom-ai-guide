import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import perfectionist from "eslint-plugin-perfectionist";
import pluginPrettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/**"] },

  {
    files: ["**/*.{ts,tsx}"],

    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      prettier,
    ],

    plugins: {
      prettier: pluginPrettier,
      perfectionist,
      react,
      "react-refresh": reactRefresh,
    },

    languageOptions: {
      globals: {
        ...globals.es2022,
      },
    },

    settings: {
      react: { version: "detect" },
    },

    rules: {
      "prettier/prettier": "warn",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "perfectionist/sort-imports": "error",

      "react/jsx-curly-brace-presence": [
        "warn",
        { props: "never", children: "never" },
      ],

      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      "react-refresh/only-export-components": "warn",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["*.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["src/api/endpoints/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
);
