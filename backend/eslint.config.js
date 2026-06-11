import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules", "prisma.config.ts"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: globals.node,
    },
  },
];
