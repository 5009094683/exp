import { deriveAccent, parseHex, type AccentPalette } from "@/lib/color";

/**
 * Parses the `SITE_*` environment variables into one typed config object.
 *
 * This module is pure (no `process.env`, no `server-only`) so it can be unit
 * tested and reused; `src/config/site.ts` applies it to the real environment.
 */

/** Page background the accent color is checked against for legibility. */
export const PAGE_BACKGROUND = "#07080a";

export const DEFAULT_PRODUCT_NAME = "AgentOS";
export const DEFAULT_ACCENT_COLOR = "#6366f1";

export type ComplianceStatus = "planned" | "in-progress" | "achieved";

export type ComplianceItem = {
  id: string;
  name: string;
  description: string;
  status: ComplianceStatus;
};

export type Testimonial = { quote: string; name: string; title?: string; company?: string };
export type TeamMember = { name: string; role: string; url?: string };
export type Stat = { value: string; label: string };

export type SiteConfig = {
  product: {
    name: string;
    tagline: string;
    description: string;
    /** Identifier-safe form of the name, used in code samples and file names. */
    slug: string;
  };
  company: {
    name: string;
    legalName: string;
    addressLines: string[];
    foundedYear?: number;
    registration?: string;
  };
  /** Canonical origin without a trailing slash, for example `https://example.com`. */
  url: string;
  host: string;
  /** Host shown in API examples; a reserved example domain until a real domain is set. */
  apiHost: string;
  contact: {
    email?: string;
    sales?: string;
    support?: string;
    security?: string;
    privacy?: string;
    phone?: string;
  };
  social: {
    x?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
    discord?: string;
  };
  links: {
    status?: string;
    careers?: string;
    booking?: string;
  };
  announcement?: { text: string; href?: string };
  theme: { accent: AccentPalette };
  legal: { effectiveDate?: string; jurisdiction?: string };
  compliance: ComplianceItem[];
  proof: {
    customers: string[];
    testimonials: Testimonial[];
    team: TeamMember[];
    backers: string[];
    stats: Stat[];
  };
  seo: {
    noindex: boolean;
    googleSiteVerification?: string;
    xHandle?: string;
  };
  copyrightYear: number;
};

export type SiteEnv = Record<string, string | undefined>;

export class SiteConfigError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(
      `Invalid site configuration:\n${issues.map((issue) => `  - ${issue}`).join("\n")}\n` +
        "See .env.example for the expected format of each variable.",
    );
    this.name = "SiteConfigError";
    this.issues = issues;
  }
}

const COMPLIANCE_FRAMEWORKS = [
  {
    id: "soc2",
    key: "SITE_COMPLIANCE_SOC2",
    name: "SOC 2 Type II",
    description: "Independent audit of security, availability and confidentiality controls.",
    defaultStatus: "planned",
  },
  {
    id: "iso27001",
    key: "SITE_COMPLIANCE_ISO27001",
    name: "ISO/IEC 27001",
    description: "Certified information security management system.",
    defaultStatus: "planned",
  },
  {
    id: "gdpr",
    key: "SITE_COMPLIANCE_GDPR",
    name: "GDPR",
    description: "Data processing agreement, EU data residency and data subject request tooling.",
    defaultStatus: "planned",
  },
  {
    id: "hipaa",
    key: "SITE_COMPLIANCE_HIPAA",
    name: "HIPAA",
    description: "Business associate agreements for workloads that handle protected health data.",
    defaultStatus: "hidden",
  },
] as const;

const COMPLIANCE_VALUES = ["planned", "in-progress", "achieved", "hidden"] as const;

const KNOWN_KEYS = new Set<string>([
  "SITE_PRODUCT_NAME",
  "SITE_PRODUCT_TAGLINE",
  "SITE_PRODUCT_DESCRIPTION",
  "SITE_URL",
  "SITE_ACCENT_COLOR",
  "SITE_COMPANY_NAME",
  "SITE_COMPANY_LEGAL_NAME",
  "SITE_COMPANY_ADDRESS",
  "SITE_COMPANY_FOUNDED",
  "SITE_COMPANY_REGISTRATION",
  "SITE_CONTACT_EMAIL",
  "SITE_SALES_EMAIL",
  "SITE_SUPPORT_EMAIL",
  "SITE_SECURITY_EMAIL",
  "SITE_PRIVACY_EMAIL",
  "SITE_CONTACT_PHONE",
  "SITE_SOCIAL_X",
  "SITE_SOCIAL_LINKEDIN",
  "SITE_SOCIAL_GITHUB",
  "SITE_SOCIAL_YOUTUBE",
  "SITE_SOCIAL_DISCORD",
  "SITE_STATUS_URL",
  "SITE_CAREERS_URL",
  "SITE_BOOKING_URL",
  "SITE_ANNOUNCEMENT_TEXT",
  "SITE_ANNOUNCEMENT_HREF",
  "SITE_LEGAL_EFFECTIVE_DATE",
  "SITE_LEGAL_JURISDICTION",
  "SITE_CUSTOMERS",
  "SITE_TESTIMONIALS",
  "SITE_TEAM",
  "SITE_BACKERS",
  "SITE_STATS",
  "SITE_NOINDEX",
  "SITE_GOOGLE_SITE_VERIFICATION",
  ...COMPLIANCE_FRAMEWORKS.map((framework) => framework.key),
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deriveApiHost(host: string): string {
  const hostname = host.replace(/:\d+$/, "");
  const isPlaceholder =
    !hostname.includes(".") ||
    /^[\d.]+$/.test(hostname) ||
    /\.(vercel\.app|workers\.dev|pages\.dev|netlify\.app)$/.test(hostname);
  return isPlaceholder ? "api.example.com" : `api.${hostname.replace(/^www\./, "")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

export function parseSiteConfig(
  env: SiteEnv,
  options: { now?: Date } = {},
): { site: SiteConfig; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];
  const now = options.now ?? new Date();

  const text = (key: string): string | undefined => {
    const value = env[key]?.trim();
    return value ? value : undefined;
  };

  const email = (key: string): string | undefined => {
    const value = text(key);
    if (value && !EMAIL_PATTERN.test(value)) {
      issues.push(`${key} must be an email address, received "${value}".`);
      return undefined;
    }
    return value;
  };

  const url = (key: string): string | undefined => {
    const value = text(key);
    if (!value) return undefined;
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("protocol");
      return parsed.toString();
    } catch {
      issues.push(`${key} must be an absolute http(s) URL, received "${value}".`);
      return undefined;
    }
  };

  /** Accepts absolute URLs and site-relative paths such as `/early-access`. */
  const href = (key: string): string | undefined => {
    const value = text(key);
    if (value?.startsWith("/") && !value.startsWith("//")) return value;
    return url(key);
  };

  const json = <T>(key: string, describe: string, isItem: (value: unknown) => value is T): T[] => {
    const value = text(key);
    if (!value) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      issues.push(`${key} must be valid JSON (${describe}).`);
      return [];
    }
    if (!Array.isArray(parsed) || !parsed.every(isItem)) {
      issues.push(`${key} must be a JSON array of ${describe}.`);
      return [];
    }
    return parsed;
  };

  for (const key of Object.keys(env)) {
    if (key.startsWith("SITE_") && !KNOWN_KEYS.has(key)) {
      warnings.push(`${key} is not a recognized setting and was ignored.`);
    }
  }

  const productName = text("SITE_PRODUCT_NAME") ?? DEFAULT_PRODUCT_NAME;
  const companyName = text("SITE_COMPANY_NAME") ?? productName;

  let origin = "http://localhost:3000";
  const configuredUrl = url("SITE_URL");
  const vercelHost = text("VERCEL_PROJECT_PRODUCTION_URL");
  if (configuredUrl) {
    const parsed = new URL(configuredUrl);
    origin = parsed.origin;
    if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
      warnings.push(`SITE_URL should be an origin only; "${parsed.pathname}" was ignored.`);
    }
  } else if (vercelHost) {
    origin = `https://${vercelHost.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
  } else if (env.NODE_ENV === "production" && !text("SITE_URL")) {
    warnings.push(
      "SITE_URL is not set: canonical links, the sitemap and social previews will point to http://localhost:3000.",
    );
  }
  const host = new URL(origin).host;

  const accentValue = text("SITE_ACCENT_COLOR") ?? DEFAULT_ACCENT_COLOR;
  if (!parseHex(accentValue)) {
    issues.push(
      `SITE_ACCENT_COLOR must be a hex color such as #6366f1, received "${accentValue}".`,
    );
  }
  const accent = deriveAccent(
    parseHex(accentValue) ? accentValue : DEFAULT_ACCENT_COLOR,
    PAGE_BACKGROUND,
  );

  let foundedYear: number | undefined;
  const foundedValue = text("SITE_COMPANY_FOUNDED");
  if (foundedValue) {
    const year = Number(foundedValue);
    if (/^\d{4}$/.test(foundedValue) && year >= 1900 && year <= now.getUTCFullYear()) {
      foundedYear = year;
    } else {
      issues.push(`SITE_COMPANY_FOUNDED must be a four-digit year, received "${foundedValue}".`);
    }
  }

  let effectiveDate = text("SITE_LEGAL_EFFECTIVE_DATE");
  if (
    effectiveDate &&
    (!DATE_PATTERN.test(effectiveDate) || Number.isNaN(Date.parse(effectiveDate)))
  ) {
    issues.push(`SITE_LEGAL_EFFECTIVE_DATE must use the YYYY-MM-DD format.`);
    effectiveDate = undefined;
  }

  let noindex = false;
  const noindexValue = text("SITE_NOINDEX")?.toLowerCase();
  if (noindexValue) {
    if (["true", "1", "yes"].includes(noindexValue)) noindex = true;
    else if (!["false", "0", "no"].includes(noindexValue)) {
      issues.push(`SITE_NOINDEX must be "true" or "false".`);
    }
  }

  const compliance: ComplianceItem[] = [];
  for (const framework of COMPLIANCE_FRAMEWORKS) {
    const value = text(framework.key)?.toLowerCase() ?? framework.defaultStatus;
    if (!(COMPLIANCE_VALUES as readonly string[]).includes(value)) {
      issues.push(`${framework.key} must be one of ${COMPLIANCE_VALUES.join(", ")}.`);
      continue;
    }
    if (value === "hidden") continue;
    compliance.push({
      id: framework.id,
      name: framework.name,
      description: framework.description,
      status: value as ComplianceStatus,
    });
  }

  const announcementText = text("SITE_ANNOUNCEMENT_TEXT");
  const announcementHref = href("SITE_ANNOUNCEMENT_HREF");

  const xUrl = url("SITE_SOCIAL_X");
  const xHandle = xUrl ? new URL(xUrl).pathname.split("/").filter(Boolean)[0] : undefined;

  const site: SiteConfig = {
    product: {
      name: productName,
      tagline: text("SITE_PRODUCT_TAGLINE") ?? "Enterprise AI agent infrastructure",
      description:
        text("SITE_PRODUCT_DESCRIPTION") ??
        `${productName} is the infrastructure layer for building, deploying and governing autonomous AI agents: orchestration, memory, MCP integrations, permissions, audit logs and sandboxed execution.`,
      slug: slugify(productName) || "platform",
    },
    company: {
      name: companyName,
      legalName: text("SITE_COMPANY_LEGAL_NAME") ?? companyName,
      addressLines: (text("SITE_COMPANY_ADDRESS") ?? "")
        .split(/\||\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
      foundedYear,
      registration: text("SITE_COMPANY_REGISTRATION"),
    },
    url: origin,
    host,
    apiHost: deriveApiHost(host),
    contact: {
      email: email("SITE_CONTACT_EMAIL"),
      sales: email("SITE_SALES_EMAIL"),
      support: email("SITE_SUPPORT_EMAIL"),
      security: email("SITE_SECURITY_EMAIL"),
      privacy: email("SITE_PRIVACY_EMAIL"),
      phone: text("SITE_CONTACT_PHONE"),
    },
    social: {
      x: xUrl,
      linkedin: url("SITE_SOCIAL_LINKEDIN"),
      github: url("SITE_SOCIAL_GITHUB"),
      youtube: url("SITE_SOCIAL_YOUTUBE"),
      discord: url("SITE_SOCIAL_DISCORD"),
    },
    links: {
      status: url("SITE_STATUS_URL"),
      careers: url("SITE_CAREERS_URL"),
      booking: url("SITE_BOOKING_URL"),
    },
    announcement: announcementText ? { text: announcementText, href: announcementHref } : undefined,
    theme: { accent },
    legal: {
      effectiveDate,
      jurisdiction: text("SITE_LEGAL_JURISDICTION"),
    },
    compliance,
    proof: {
      customers: json("SITE_CUSTOMERS", "customer names", isNonEmptyString),
      testimonials: json(
        "SITE_TESTIMONIALS",
        "objects with quote and name",
        (value): value is Testimonial =>
          isRecord(value) &&
          isNonEmptyString(value.quote) &&
          isNonEmptyString(value.name) &&
          isOptionalString(value.title) &&
          isOptionalString(value.company),
      ),
      team: json(
        "SITE_TEAM",
        "objects with name and role",
        (value): value is TeamMember =>
          isRecord(value) &&
          isNonEmptyString(value.name) &&
          isNonEmptyString(value.role) &&
          isOptionalString(value.url),
      ),
      backers: json("SITE_BACKERS", "backer names", isNonEmptyString),
      stats: json(
        "SITE_STATS",
        "objects with value and label",
        (value): value is Stat =>
          isRecord(value) && isNonEmptyString(value.value) && isNonEmptyString(value.label),
      ),
    },
    seo: {
      noindex,
      googleSiteVerification: text("SITE_GOOGLE_SITE_VERIFICATION"),
      xHandle: xHandle ? `@${xHandle.replace(/^@/, "")}` : undefined,
    },
    copyrightYear: now.getUTCFullYear(),
  };

  if (issues.length > 0) throw new SiteConfigError(issues);

  return { site, warnings };
}

/** The subset of the site config that client components may read. */
export type PublicSite = Pick<
  SiteConfig,
  "product" | "company" | "url" | "host" | "apiHost" | "contact" | "links"
>;

export function toPublicSite(site: SiteConfig): PublicSite {
  return {
    product: site.product,
    company: site.company,
    url: site.url,
    host: site.host,
    apiHost: site.apiHost,
    contact: site.contact,
    links: site.links,
  };
}
