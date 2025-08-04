import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable unused variable warnings
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",

      // Allow console.log
      "no-console": "off",

      // Allow any type
      "@typescript-eslint/no-explicit-any": "off",

      // Allow empty functions
      "@typescript-eslint/no-empty-function": "off",

      // Allow non-null assertions
      "@typescript-eslint/no-non-null-assertion": "off",

      // Disable exhaustive deps warning for useEffect
      "react-hooks/exhaustive-deps": "off",

      // Allow unescaped entities
      "react/no-unescaped-entities": "off",

      // Allow missing display name
      "react/display-name": "off",

      // Allow empty interfaces
      "@typescript-eslint/no-empty-interface": "off",

      // Allow require() calls
      "@typescript-eslint/no-var-requires": "off",
    },
  },
];

export default eslintConfig;
