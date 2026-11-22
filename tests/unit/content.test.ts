import { afterEach, describe, expect, it, vi } from "vitest";
import { docsPages } from "@/content/docs/nav";
import { docs } from "@/content/docs/pages";
import type { DocBlock } from "@/content/docs/types";
import { legalDocuments } from "@/content/legal";
import { highlight } from "@/lib/highlight";
import { EARLY_ACCESS_STORAGE_KEY } from "@/lib/leads/storage";
import { buildSecurityTxt } from "@/lib/security-txt";
import { allRoutes } from "@/lib/site-routes";

const routes = new Set(allRoutes);

function textOf(block: DocBlock): string[] {
  switch (block.type) {
    case "p":
    case "h2":
      return [block.text];
    case "list":
      return block.items;
    case "table":
      return [...block.head, ...block.rows.flat()];
    case "cards":
      return block.items.flatMap((item) => [item.title, item.description]);
    case "address":
      return [block.name, ...block.lines];
    case "code":
      return [];
  }
}

/** Internal link targets in a block, with any #fragment removed. */
function linksOf(block: DocBlock): string[] {
  const inline = textOf(block).flatMap((text) =>
    [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((match) => match[1]),
  );
  const cards = block.type === "cards" ? block.items.map((item) => item.href) : [];
  return [...inline, ...cards]
    .filter((href) => href.startsWith("/"))
    .map((href) => href.split("#")[0]);
}

function expectWellFormed(label: string, blocks: DocBlock[]) {
  const ids = blocks.flatMap((block) => (block.type === "h2" ? [block.id] : []));
  expect(new Set(ids).size, `${label}: duplicate heading ids`).toBe(ids.length);
  for (const id of ids) expect(id, label).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);

  for (const block of blocks) {
    for (const href of linksOf(block)) {
      expect(routes, `${label} links to ${href}`).toContain(href);
    }
    for (const text of textOf(block)) {
      expect(text.trim(), label).not.toBe("");
      expect(text, label).not.toMatch(/undefined|\[object Object\]|\bNaN\b/);
      // Unbalanced markup would show up as stray symbols on the page.
      expect((text.match(/`/g) ?? []).length % 2, `${label}: ${text}`).toBe(0);
      expect((text.match(/\*\*/g) ?? []).length % 2, `${label}: ${text}`).toBe(0);
    }
    if (block.type === "table") {
      for (const row of block.rows) expect(row, label).toHaveLength(block.head.length);
    }
  }
}

describe("documentation", () => {
  it("has content for every page in the navigation", () => {
    expect(docs.map((page) => page.slug)).toEqual(docsPages.map((page) => page.slug));
    for (const page of docs) {
      expect(page.blocks.length, page.slug).toBeGreaterThan(5);
      expect(page.blocks[0].type, page.slug).toBe("p");
      expect(
        page.blocks.some((block) => block.type === "h2"),
        page.slug,
      ).toBe(true);
    }
  });

  it("is well formed and only links to pages that exist", () => {
    for (const page of docs) expectWellFormed(`docs/${page.slug}`, page.blocks);
  });

  it("shows code samples that the highlighter can render", () => {
    const samples = docs.flatMap((page) =>
      page.blocks.flatMap((block) => (block.type === "code" ? [block.sample] : [])),
    );
    expect(samples.length).toBeGreaterThan(10);
    for (const sample of samples) {
      expect(sample.code.trim(), sample.filename).not.toBe("");
      expect(sample.code, sample.filename).not.toMatch(/undefined|\[object Object\]/);
      const rendered = highlight(sample.code, sample.language)
        .map((line) => line.map((token) => token.text).join(""))
        .join("\n");
      expect(rendered).toBe(sample.code);
    }
  });

  it("contains valid JSON wherever a sample is labelled as JSON", () => {
    for (const page of docs) {
      for (const block of page.blocks) {
        if (block.type !== "code") continue;
        const { code, language, filename } = block.sample;
        if (language === "json") expect(() => JSON.parse(code), filename).not.toThrow();
        if (language === "http") {
          const body = code.slice(code.indexOf("\n\n") + 2);
          expect(() => JSON.parse(body), filename).not.toThrow();
        }
      }
    }
  });

  it("does not tell readers to install packages that do not exist yet", () => {
    const installs =
      /\b(npm|pnpm|yarn|bun|pip|pipx|uv|brew|cargo|gem|go)\s+(install|add|i|get)\b|\bnpx\b|\|\s*(sh|bash)\b/;
    for (const page of docs) {
      for (const block of page.blocks) {
        const text = block.type === "code" ? block.sample.code : textOf(block).join("\n");
        expect(text, `docs/${page.slug}`).not.toMatch(installs);
      }
    }
  });
});

describe("legal documents", () => {
  it("cover privacy, terms and cookies", () => {
    expect(legalDocuments.map((document) => document.slug)).toEqual([
      "privacy",
      "terms",
      "cookies",
    ]);
    for (const document of legalDocuments) {
      expectWellFormed(`legal/${document.slug}`, document.blocks);
      expect(document.blocks.at(-1)?.type, document.slug).toBe("address");
    }
  });

  it("name the browser storage the site really uses", () => {
    const cookies = legalDocuments.find((document) => document.slug === "cookies")!;
    const text = cookies.blocks.flatMap(textOf).join("\n");
    expect(text).toContain(EARLY_ACCESS_STORAGE_KEY);
  });

  describe("with company details configured", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.resetModules();
    });

    async function load(env: Record<string, string>) {
      vi.unstubAllEnvs();
      vi.resetModules();
      for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
      const { legalDocuments: documents } = await import("@/content/legal");
      return Object.fromEntries(
        documents.map((document) => [
          document.slug,
          { blocks: document.blocks, text: document.blocks.flatMap(textOf).join("\n") },
        ]),
      );
    }

    it("uses the legal name, address, registration and privacy mailbox", async () => {
      const documents = await load({
        SITE_PRODUCT_NAME: "Zephyrline",
        SITE_COMPANY_LEGAL_NAME: "Northwind Systems, Inc.",
        SITE_COMPANY_ADDRESS: "1 Example Street|Springfield",
        SITE_COMPANY_REGISTRATION: "Company no. 000000",
        SITE_PRIVACY_EMAIL: "privacy@example.com",
        SITE_CONTACT_EMAIL: "hello@example.com",
        SITE_LEGAL_JURISDICTION: "England and Wales",
      });

      expect(documents.privacy.text).toContain("Northwind Systems, Inc.");
      expect(documents.privacy.text).toContain("[privacy@example.com](mailto:privacy@example.com)");
      expect(documents.privacy.text).not.toContain("hello@example.com");
      expect(documents.privacy.blocks.at(-1)).toEqual({
        type: "address",
        name: "Northwind Systems, Inc.",
        lines: ["1 Example Street", "Springfield", "Company no. 000000"],
      });
      expect(documents.terms.text).toContain("governed by the laws of England and Wales");
      expect(documents.terms.text).toContain("Zephyrline");
      expect(
        Object.values(documents)
          .map((document) => document.text)
          .join("\n"),
      ).not.toMatch(/AgentOS/);
    });

    it("falls back to the general mailbox, then to the contact page", async () => {
      const withEmail = await load({ SITE_CONTACT_EMAIL: "hello@example.com" });
      expect(withEmail.privacy.text).toContain("[hello@example.com](mailto:hello@example.com)");

      const bare = await load({});
      expect(bare.privacy.text).toContain("[contact page](/contact)");
      expect(bare.privacy.text).not.toContain("mailto:");
      expect(bare.terms.text).toContain("the laws of the place where");
    });
  });
});

describe("security.txt", () => {
  const builtAt = Date.UTC(2026, 10, 22, 21, 41);

  it("uses the security mailbox when one is configured", () => {
    const text = buildSecurityTxt({
      url: "https://example.com",
      securityEmail: "security@example.com",
      builtAt,
    });
    expect(text.split("\n")).toEqual([
      "Contact: mailto:security@example.com",
      "Expires: 2027-11-21T00:00:00.000Z",
      "Preferred-Languages: en",
      "Canonical: https://example.com/.well-known/security.txt",
      "Policy: https://example.com/security#disclosure",
      "",
    ]);
  });

  it("points to the contact page otherwise, and expires within a year", () => {
    const text = buildSecurityTxt({ url: "https://example.com", builtAt });
    expect(text).toContain("Contact: https://example.com/contact\n");
    const expires = Date.parse(/^Expires: (.+)$/m.exec(text)![1]);
    expect(expires).toBeGreaterThan(builtAt);
    expect(expires - builtAt).toBeLessThan(365 * 86_400_000);
  });
});
