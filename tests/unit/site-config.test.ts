import { describe, expect, it } from "vitest";
import { parseSiteConfig, SiteConfigError, slugify, toPublicSite } from "@/config/site-schema";

const now = new Date("2026-11-22T12:00:00Z");
const parse = (env: Record<string, string | undefined>) => parseSiteConfig(env, { now });

describe("parseSiteConfig defaults", () => {
  const { site, warnings } = parse({});

  it("falls back to the default brand", () => {
    expect(site.product.name).toBe("AgentOS");
    expect(site.product.slug).toBe("agentos");
    expect(site.company.name).toBe("AgentOS");
    expect(site.company.legalName).toBe("AgentOS");
    expect(site.product.description).toContain("AgentOS");
  });

  it("uses localhost and an example API host until a URL is configured", () => {
    expect(site.url).toBe("http://localhost:3000");
    expect(site.apiHost).toBe("api.example.com");
  });

  it("leaves optional details unset so their UI stays hidden", () => {
    expect(site.contact).toEqual({});
    expect(site.company.addressLines).toEqual([]);
    expect(site.announcement).toBeUndefined();
    expect(site.proof).toEqual({
      customers: [],
      testimonials: [],
      team: [],
      backers: [],
      stats: [],
    });
  });

  it("shows a planned compliance roadmap without HIPAA", () => {
    expect(site.compliance.map((item) => [item.id, item.status])).toEqual([
      ["soc2", "planned"],
      ["iso27001", "planned"],
      ["gdpr", "planned"],
    ]);
  });

  it("does not warn in development", () => {
    expect(warnings).toEqual([]);
  });
});

describe("parseSiteConfig overrides", () => {
  it("rebrands product and company", () => {
    const { site } = parse({
      SITE_PRODUCT_NAME: "  Zephyrline ",
      SITE_COMPANY_NAME: "Northwind Systems",
      SITE_COMPANY_LEGAL_NAME: "Northwind Systems Ltd",
      SITE_COMPANY_ADDRESS: "1 Harbour Road | Dublin D02 | Ireland",
      SITE_COMPANY_FOUNDED: "2025",
    });
    expect(site.product.name).toBe("Zephyrline");
    expect(site.product.slug).toBe("zephyrline");
    expect(site.product.description).toContain("Zephyrline");
    expect(site.company.legalName).toBe("Northwind Systems Ltd");
    expect(site.company.addressLines).toEqual(["1 Harbour Road", "Dublin D02", "Ireland"]);
    expect(site.company.foundedYear).toBe(2025);
  });

  it("normalizes the site URL to an origin and derives the API host", () => {
    const { site, warnings } = parse({ SITE_URL: "https://www.zephyrline.io/pricing" });
    expect(site.url).toBe("https://www.zephyrline.io");
    expect(site.host).toBe("www.zephyrline.io");
    expect(site.apiHost).toBe("api.zephyrline.io");
    expect(warnings.join(" ")).toContain("origin only");
  });

  it("uses the Vercel production domain when SITE_URL is unset", () => {
    const { site } = parse({ VERCEL_PROJECT_PRODUCTION_URL: "zephyrline.vercel.app" });
    expect(site.url).toBe("https://zephyrline.vercel.app");
    expect(site.apiHost).toBe("api.example.com");
  });

  it("warns when a production build has no URL", () => {
    const { warnings } = parse({ NODE_ENV: "production" });
    expect(warnings.join(" ")).toContain("SITE_URL is not set");
  });

  it("reads contact details, links and the announcement", () => {
    const { site } = parse({
      SITE_CONTACT_EMAIL: "hello@zephyrline.io",
      SITE_SECURITY_EMAIL: "security@zephyrline.io",
      SITE_CONTACT_PHONE: "+1 415 555 0100",
      SITE_SOCIAL_X: "https://x.com/zephyrline",
      SITE_BOOKING_URL: "https://cal.com/zephyrline/intro",
      SITE_ANNOUNCEMENT_TEXT: "Now onboarding design partners",
      SITE_ANNOUNCEMENT_HREF: "/early-access",
    });
    expect(site.contact.email).toBe("hello@zephyrline.io");
    expect(site.contact.security).toBe("security@zephyrline.io");
    expect(site.contact.phone).toBe("+1 415 555 0100");
    expect(site.seo.xHandle).toBe("@zephyrline");
    expect(site.links.booking).toBe("https://cal.com/zephyrline/intro");
    expect(site.announcement).toEqual({
      text: "Now onboarding design partners",
      href: "/early-access",
    });
  });

  it("derives a legible accent palette", () => {
    const { site } = parse({ SITE_ACCENT_COLOR: "#0ea5e9" });
    expect(site.theme.accent.base).toBe("#0ea5e9");
    expect(site.theme.accent.text).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("applies compliance statuses and hides frameworks on request", () => {
    const { site } = parse({
      SITE_COMPLIANCE_SOC2: "achieved",
      SITE_COMPLIANCE_ISO27001: "hidden",
      SITE_COMPLIANCE_HIPAA: "in-progress",
    });
    expect(site.compliance.map((item) => [item.id, item.status])).toEqual([
      ["soc2", "achieved"],
      ["gdpr", "planned"],
      ["hipaa", "in-progress"],
    ]);
  });

  it("parses social proof JSON", () => {
    const { site } = parse({
      SITE_CUSTOMERS: '["Initech","Globex"]',
      SITE_TESTIMONIALS: '[{"quote":"Solid.","name":"Ada","company":"Initech"}]',
      SITE_TEAM: '[{"name":"Grace","role":"CTO"}]',
      SITE_STATS: '[{"value":"12","label":"design partners"}]',
    });
    expect(site.proof.customers).toEqual(["Initech", "Globex"]);
    expect(site.proof.testimonials[0].name).toBe("Ada");
    expect(site.proof.team[0].role).toBe("CTO");
    expect(site.proof.stats[0]).toEqual({ value: "12", label: "design partners" });
  });

  it("treats blank values as unset", () => {
    const { site } = parse({ SITE_PRODUCT_NAME: "   ", SITE_CONTACT_EMAIL: "" });
    expect(site.product.name).toBe("AgentOS");
    expect(site.contact.email).toBeUndefined();
  });

  it("warns about unrecognized SITE_ variables", () => {
    const { warnings } = parse({ SITE_PRODUCTNAME: "Typo" });
    expect(warnings).toEqual(["SITE_PRODUCTNAME is not a recognized setting and was ignored."]);
  });
});

describe("parseSiteConfig validation", () => {
  it("reports every invalid value at once", () => {
    let error: unknown;
    try {
      parse({
        SITE_URL: "zephyrline.io",
        SITE_ACCENT_COLOR: "indigo",
        SITE_CONTACT_EMAIL: "hello",
        SITE_COMPANY_FOUNDED: "next year",
        SITE_LEGAL_EFFECTIVE_DATE: "01/02/2026",
        SITE_COMPLIANCE_SOC2: "certified",
        SITE_CUSTOMERS: "Initech, Globex",
        SITE_TEAM: '[{"name":"Grace"}]',
        SITE_NOINDEX: "maybe",
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(SiteConfigError);
    const issues = (error as SiteConfigError).issues.join("\n");
    for (const key of [
      "SITE_URL",
      "SITE_ACCENT_COLOR",
      "SITE_CONTACT_EMAIL",
      "SITE_COMPANY_FOUNDED",
      "SITE_LEGAL_EFFECTIVE_DATE",
      "SITE_COMPLIANCE_SOC2",
      "SITE_CUSTOMERS",
      "SITE_TEAM",
      "SITE_NOINDEX",
    ]) {
      expect(issues).toContain(key);
    }
  });
});

describe("toPublicSite", () => {
  it("exposes only what client components need", () => {
    const { site } = parse({ SITE_CONTACT_EMAIL: "hello@zephyrline.io" });
    expect(Object.keys(toPublicSite(site)).sort()).toEqual([
      "apiHost",
      "company",
      "contact",
      "host",
      "links",
      "product",
      "url",
    ]);
  });
});

describe("slugify", () => {
  it("produces identifier-safe slugs", () => {
    expect(slugify("AgentOS")).toBe("agentos");
    expect(slugify("Zéphyr Line 2")).toBe("zephyr-line-2");
    expect(slugify("  --  ")).toBe("");
  });
});
