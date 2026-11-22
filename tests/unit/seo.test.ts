import { describe, expect, it } from "vitest";
import { parseSiteConfig } from "@/config/site-schema";
import {
  allRoutes,
  docsRoutes,
  indexableRoutes,
  legalRoutes,
  marketingRoutes,
  unlistedRoutes,
} from "@/lib/site-routes";
import { buildSiteStructuredData, serializeJsonLd } from "@/lib/structured-data";

type Graph = { "@graph": Array<Record<string, unknown>> };

function structuredData(env: Record<string, string>) {
  const { site } = parseSiteConfig(env, { now: new Date("2026-11-22T00:00:00Z") });
  const data = buildSiteStructuredData(site) as unknown as Graph;
  const [organization, website] = data["@graph"];
  return { organization, website };
}

describe("site routes", () => {
  it("lists every page once", () => {
    expect(new Set(allRoutes).size).toBe(allRoutes.length);
    for (const route of allRoutes) expect(route).toMatch(/^\/([a-z0-9_-]+(\/[a-z0-9_-]+)*)?$/);
  });

  it("keeps the demo console and sign-in out of the indexable set", () => {
    expect(indexableRoutes).toEqual([...marketingRoutes, ...docsRoutes, ...legalRoutes]);
    for (const route of indexableRoutes) {
      expect(route.startsWith("/console"), route).toBe(false);
      expect(route).not.toBe("/signin");
    }
    expect(unlistedRoutes).toContain("/console");
    expect(unlistedRoutes).toContain("/signin");
  });

  it("covers the pages the plan calls for", () => {
    for (const route of [
      "/",
      "/platform",
      "/platform/orchestration",
      "/platform/sandboxes",
      "/solutions/enterprise",
      "/solutions/saas",
      "/solutions/agencies",
      "/pricing",
      "/security",
      "/company",
      "/contact",
      "/early-access",
      "/docs",
      "/docs/api",
      "/legal/privacy",
      "/console/audit",
      "/console/agents/new",
    ]) {
      expect(allRoutes).toContain(route);
    }
    expect(allRoutes.length).toBeGreaterThanOrEqual(70);
  });
});

describe("structured data", () => {
  it("describes the organization and the site with the minimum configuration", () => {
    const { organization, website } = structuredData({
      SITE_PRODUCT_NAME: "Zephyrline",
      SITE_URL: "https://zephyrline.example",
    });

    expect(organization).toEqual({
      "@type": "Organization",
      "@id": "https://zephyrline.example/#organization",
      name: "Zephyrline",
      url: "https://zephyrline.example",
      logo: "https://zephyrline.example/app-icon-512.png",
    });
    expect(website).toMatchObject({
      "@type": "WebSite",
      name: "Zephyrline",
      url: "https://zephyrline.example",
      publisher: { "@id": "https://zephyrline.example/#organization" },
    });
  });

  it("adds company details only when they are configured", () => {
    const { organization } = structuredData({
      SITE_URL: "https://example.com",
      SITE_COMPANY_NAME: "Northwind",
      SITE_COMPANY_LEGAL_NAME: "Northwind Systems, Inc.",
      SITE_COMPANY_ADDRESS: "1 Example Street|Springfield",
      SITE_COMPANY_FOUNDED: "2025",
      SITE_CONTACT_EMAIL: "hello@example.com",
      SITE_CONTACT_PHONE: "+1 555 0100",
      SITE_SOCIAL_LINKEDIN: "https://www.linkedin.com/company/example",
      SITE_SOCIAL_GITHUB: "https://github.com/example",
    });

    expect(organization).toMatchObject({
      name: "Northwind",
      legalName: "Northwind Systems, Inc.",
      address: "1 Example Street, Springfield",
      foundingDate: "2025",
      email: "hello@example.com",
      telephone: "+1 555 0100",
      sameAs: ["https://www.linkedin.com/company/example", "https://github.com/example"],
    });
  });

  it("cannot break out of its script tag", () => {
    const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
