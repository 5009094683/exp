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
    ".wrangler/**",
    ".rebrand-check/**",
    "playwright-report/**",
    "test-results/**",
    "worker/worker-configuration.d.ts",
  ]),
]);

export default eslintConfig;
