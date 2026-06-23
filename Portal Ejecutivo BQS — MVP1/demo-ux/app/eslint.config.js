// ESLint flat config mínimo para el demo (TS + React 19).
// Mantenido "lo más simple posible" (Demo-First v2 §1).
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
);
