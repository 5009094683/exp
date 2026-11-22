#!/usr/bin/env node
/**
 * Captures screenshots for visual review.
 *
 *   node scripts/screenshots.mjs --base http://localhost:3000 --out /tmp/shots / /pricing
 *
 * Options:
 *   --mobile          phone viewport
 *   --viewport        visible area only, instead of the full page
 *   --tiles           split the full page into viewport-height images
 *   --width/--height  desktop viewport size
 *   --wait <ms>       pause before capture
 *   --motion          keep animations (off by default so reveals are visible)
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
    tiles: { type: "boolean", default: false },
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

  const slug = path.replace(/^\/|\/$/g, "").replace(/[^\w-]+/g, "_") || "home";
  const name = `${slug}${values.mobile ? "-mobile" : ""}`;
  const files = [];

  if (values.tiles) {
    const { width, height } = page.viewportSize();
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let index = 0; index * height < total; index += 1) {
      const file = join(values.out, `${name}-${String(index + 1).padStart(2, "0")}.png`);
      await page.screenshot({
        path: file,
        fullPage: true,
        clip: { x: 0, y: index * height, width, height: Math.min(height, total - index * height) },
      });
      files.push(file);
    }
  } else {
    const file = join(values.out, `${name}.png`);
    await page.screenshot({ path: file, fullPage: !values.viewport });
    files.push(file);
  }

  console.log(
    `${files.join("\n")}${errors.length > 0 ? `\n  console errors: ${errors.join(" | ")}` : ""}`,
  );
  await page.close();
}

await browser.close();
