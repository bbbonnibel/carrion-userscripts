import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["build/**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["src/**/*.{js,mjs,cjs}", "build/template/**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        GM_setValue: "readonly",
        GM_getValue: "readonly",
        $import: "readonly",
        ...globals.browser,
      },
    },
  },
  {
    files: ["build/template/**/*.{js,mjs,cjs}"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
]);
