import eslintPluginAstro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**", "public/wasm/**", "src/data/**"],
  },
  // Make @typescript-eslint rules available globally (needed for eslint-disable comments)
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
  },
  ...eslintPluginAstro.configs["flat/recommended"],
  {
    files: ["**/*.ts", "**/*.mjs", "**/*.js"],
    languageOptions: {
      parser: tsParser,
    },
  },
  eslintConfigPrettier,
];
