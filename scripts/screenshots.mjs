#!/usr/bin/env node
/**
 * Captures full-page screenshots for visual review.
 *
 *   node scripts/screenshots.mjs --base http://localhost:3000 --out /tmp/shots / /pricing
 *
 * Options: --mobile (phone viewport), --viewport (visible area only),
 * --width/--height, --wait <ms> before capture, --motion (keep animations).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { chromium, devices } from "@playwright/test";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    base: { type: "string", default: "http://localhost:3000" },
    out: { type: "string", default: "screenshots" },
    mobile: { type: "boolean", default: false },
    viewport: { type: "boolean", default: false },
    motion: { type: "boolean", default: false },
    width: { type: "string", default: "1440" },
    height: { type: "string", default: "900" },
    wait: { type: "string", default: "400" },
  },
});

const paths = positionals.length > 0 ? positionals : ["/"];
mkdirSync(values.out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  ...(values.mobile
    ? devices["Pixel 7"]
    : {
        viewport: { width: Number(values.width), height: Number(values.height) },
        deviceScaleFactor: 1,
      }),
  // Scroll-driven reveals stay hidden below the fold in full-page captures otherwise.
  reducedMotion: values.motion ? "no-preference" : "reduce",
});

for (const path of paths) {
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(new URL(path, values.base).toString(), { waitUntil: "networkidle" });
  await page.waitForTimeout(Number(values.wait));

  const name = `${path.replace(/^\/|\/$/g, "").replace(/[^\w-]+/g, "_") || "home"}${values.mobile ? "-mobile" : ""}.png`;
  const file = join(values.out, name);
  await page.screenshot({ path: file, fullPage: !values.viewport });
  console.log(`${file}${errors.length > 0 ? `  (console errors: ${errors.join(" | ")})` : ""}`);
  await page.close();
}

await browser.close();
