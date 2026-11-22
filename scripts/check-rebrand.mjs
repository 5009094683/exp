#!/usr/bin/env node
/**
 * Proves the site can be rebranded from environment variables alone.
 *
 * Builds the static target under a different product and company name, then
 * fails if the default product name still appears anywhere in the output.
 */
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const exportDir = ".rebrand-check";
const outputPath = join(root, exportDir);

/** Lowercase strings that must not survive a rebrand (the default product name). */
const forbidden = ["agentos", "agent os"];

/**
 * Only the names change. Every optional setting stays unset, so this build
 * also covers a site deployed with no contact details or social proof.
 */
const brand = {
  SITE_PRODUCT_NAME: "Zephyrline",
  SITE_PRODUCT_TAGLINE: "Fleet control for autonomous software",
  SITE_COMPANY_NAME: "Northwind Systems",
  SITE_COMPANY_LEGAL_NAME: "Northwind Systems Ltd",
  SITE_URL: "https://www.zephyrline.example",
  SITE_ACCENT_COLOR: "#0ea5e9",
};

/** Text that would mean an unset value was rendered instead of being hidden. */
const placeholders = [
  ">undefined<",
  ">null<",
  "mailto:undefined",
  "mailto:null",
  "[object Object]",
];

const textExtensions = new Set([
  ".html",
  ".js",
  ".css",
  ".txt",
  ".json",
  ".xml",
  ".svg",
  ".webmanifest",
]);

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");

console.log(`Building the static target as "${brand.SITE_PRODUCT_NAME}"...`);
const build = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  stdio: ["ignore", "ignore", "inherit"],
  env: { ...process.env, ...brand, BUILD_TARGET: "static", EXPORT_DIR: exportDir },
});
if (build.status !== 0) {
  console.error("The rebranded build failed.");
  process.exit(build.status ?? 1);
}

const files = listFiles(outputPath);
const findings = [];
let scanned = 0;

for (const file of files) {
  const extension = extname(file);
  if (extension !== "" && !textExtensions.has(extension)) continue;

  const content = readFileSync(file, "utf8");
  const lowered = content.toLowerCase();
  scanned += 1;

  for (const needle of forbidden) {
    const index = lowered.indexOf(needle);
    if (index === -1) continue;
    const snippet = content
      .slice(Math.max(0, index - 60), index + needle.length + 60)
      .replace(/\s+/g, " ");
    findings.push(`${relative(outputPath, file)}: ...${snippet}...`);
  }

  if (extension === ".html") {
    for (const placeholder of placeholders) {
      if (content.includes(placeholder)) {
        findings.push(`${relative(outputPath, file)}: renders "${placeholder}"`);
      }
    }
  }
}

const home = readFileSync(join(outputPath, "index.html"), "utf8");
if (!home.includes(brand.SITE_PRODUCT_NAME)) {
  findings.push(`index.html does not mention "${brand.SITE_PRODUCT_NAME}".`);
}

rmSync(outputPath, { recursive: true, force: true });

if (findings.length > 0) {
  console.error(`\nThe rebrand check found ${findings.length} problem(s):\n`);
  for (const finding of findings.slice(0, 50)) console.error(`  ${finding}`);
  if (findings.length > 50) console.error(`  ...and ${findings.length - 50} more`);
  console.error("\nRead product and company names from the site config instead of hard-coding.");
  process.exit(1);
}

console.log(`Rebrand check passed: ${scanned} text files scanned, no default branding found.`);
