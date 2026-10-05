import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // Treat args/vars prefixed with `_` as intentionally unused
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  // scripts/spell-cards/: einmalige Node-Pipeline für den Kartendruck (kein
  // App-Code, kein Build-Input) — nutzt bewusst require() und CommonJS in der
  // 1:1-Kopie der Regel-Engine unter rules-js/.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/spell-cards/**"]),
]);

export default eslintConfig;
