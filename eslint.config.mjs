import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "coverage/**",
  ]),
  {
    // React Compiler / react-hooks experimental rules are very new and noisy
    // against patterns that are correct here (reading localStorage / navigator
    // on mount, etc.). Keep them visible as warnings — don't fail CI on them.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // opengraph-image.tsx renders to a PNG via satori, not the DOM — escaping
    // quotes with &quot; would render the literal entity, so the
    // no-unescaped-entities rule is a false positive here.
    files: ["**/opengraph-image.tsx", "**/twitter-image.tsx", "**/icon.tsx"],
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
]);

export default eslintConfig;
