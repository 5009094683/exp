import { expect, test, type Page } from "@playwright/test";
import { allRoutes, indexableRoutes } from "../../src/lib/site-routes";

/** The origin the e2e build is configured with (see scripts/e2e.mjs). */
const SITE_URL = "https://www.example.com";
const CONCURRENCY = 4;

type PageReport = {
  status: number;
  title: string;
  description: string;
  canonical: string;
  robots: string;
  headings: number;
  overflow: number;
  ids: string[];
  problems: string[];
};

type Link = { href: string; newTab: boolean; rel: string };

const isAsset = (path: string) => /\.[a-z0-9]+$/i.test(path);

/**
 * Follows every internal link from the home page and checks each page it
 * finds. This is what keeps the site free of dead links, console errors and
 * pages that scroll sideways on a phone.
 */
test("every page loads cleanly and every internal link leads somewhere", async ({
  context,
  request,
}) => {
  test.setTimeout(420_000);

  const queue = ["/"];
  const seen = new Set(queue);
  const reports = new Map<string, PageReport>();
  const assets = new Set<string>();
  const fragments: Array<{ from: string; path: string; id: string }> = [];
  const failures: string[] = [];
  let active = 0;

  async function visit(page: Page, problems: string[], path: string) {
    problems.length = 0;
    const response = await page.goto(path, { waitUntil: "load" });
    await page.waitForLoadState("networkidle");

    const found = await page.evaluate(() => {
      const root = document.documentElement;
      const meta = (selector: string, attribute: string) =>
        document.querySelector(selector)?.getAttribute(attribute) ?? "";
      return {
        title: document.title,
        description: meta('meta[name="description"]', "content"),
        canonical: meta('link[rel="canonical"]', "href"),
        robots: meta('meta[name="robots"]', "content"),
        headings: document.querySelectorAll("h1").length,
        overflow: root.scrollWidth - root.clientWidth,
        ids: [...document.querySelectorAll("[id]")].map((element) => element.id),
        text: document.body.innerText,
        links: [...document.querySelectorAll("a[href]")].map((anchor) => ({
          href: anchor.getAttribute("href") ?? "",
          newTab: anchor.getAttribute("target") === "_blank",
          rel: anchor.getAttribute("rel") ?? "",
        })),
      };
    });

    for (const leak of ["undefined", "NaN", "[object Object]"]) {
      if (found.text.includes(leak)) problems.push(`shows "${leak}" in its text`);
    }

    reports.set(path, {
      status: response?.status() ?? 0,
      title: found.title,
      description: found.description,
      canonical: found.canonical,
      robots: found.robots,
      headings: found.headings,
      overflow: found.overflow,
      ids: found.ids,
      problems: [...problems],
    });

    for (const link of found.links as Link[]) {
      if (link.newTab && !/noreferrer|noopener/.test(link.rel)) {
        failures.push(`${path}: link to ${link.href} opens a new tab without rel="noreferrer"`);
      }
      if (link.href.startsWith("#")) {
        const id = link.href.slice(1);
        if (id && !found.ids.includes(id)) failures.push(`${path}: no element for ${link.href}`);
        continue;
      }
      if (!link.href.startsWith("/") || link.href.startsWith("//")) continue;

      const url = new URL(link.href, SITE_URL);
      const target = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
      if (url.hash.length > 1) fragments.push({ from: path, path: target, id: url.hash.slice(1) });

      if (isAsset(target)) {
        assets.add(target);
      } else if (!seen.has(target)) {
        seen.add(target);
        queue.push(target);
      }
    }
  }

  async function worker() {
    const page = await context.newPage();
    const problems: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(`console error: ${message.text()}`);
    });
    page.on("pageerror", (error) => problems.push(`uncaught error: ${error.message}`));
    page.on("response", (response) => {
      if (response.status() >= 400) problems.push(`${response.status()} for ${response.url()}`);
    });

    for (;;) {
      const path = queue.shift();
      if (path === undefined) {
        if (active === 0) break;
        await page.waitForTimeout(50);
        continue;
      }
      active += 1;
      try {
        await visit(page, problems, path);
      } catch (error) {
        failures.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        active -= 1;
      }
    }
    await page.close();
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const indexable = new Set(indexableRoutes);
  const titles = new Map<string, string>();

  for (const [path, report] of reports) {
    if (report.status !== 200) failures.push(`${path}: status ${report.status}`);
    for (const problem of report.problems) failures.push(`${path}: ${problem}`);
    if (report.headings !== 1) failures.push(`${path}: has ${report.headings} h1 elements`);
    if (report.overflow > 0) failures.push(`${path}: scrolls sideways by ${report.overflow}px`);
    if (!report.ids.includes("main")) failures.push(`${path}: the skip link has no target`);
    if (report.title.trim() === "") failures.push(`${path}: has no title`);

    if (indexable.has(path)) {
      const canonical = `${SITE_URL}${path === "/" ? "" : path}`;
      if (report.canonical !== canonical) {
        failures.push(`${path}: canonical is "${report.canonical}", expected "${canonical}"`);
      }
      if (report.description.length < 50) failures.push(`${path}: description is too short`);
      if (/noindex/.test(report.robots)) failures.push(`${path}: is marked noindex`);

      const other = titles.get(report.title);
      if (other) failures.push(`${path}: shares its title with ${other}`);
      titles.set(report.title, path);
    } else if (!/noindex/.test(report.robots)) {
      failures.push(`${path}: should be marked noindex`);
    }
  }

  for (const fragment of fragments) {
    const target = reports.get(fragment.path);
    if (target && !target.ids.includes(fragment.id)) {
      failures.push(`${fragment.from}: ${fragment.path}#${fragment.id} has no such element`);
    }
  }

  for (const asset of assets) {
    const response = await request.get(asset);
    if (response.status() !== 200) failures.push(`${asset}: status ${response.status()}`);
  }

  expect(failures).toEqual([]);
  // Every known page is reachable by links, and nothing is served that is not registered.
  expect([...reports.keys()].sort()).toEqual([...allRoutes].sort());
});
