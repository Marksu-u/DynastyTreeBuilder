import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // NEXT_DIST_DIR builds land here (see next.config.ts). Without this,
    // `eslint` with no arguments lints the compiled bundles and buries the
    // project's own findings under ~12k reports from generated code.
    ".next-build/**",
  ]),
]);

export default eslintConfig;
