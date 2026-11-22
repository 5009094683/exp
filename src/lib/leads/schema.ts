/**
 * Shape and validation of early-access and contact requests. Shared by the
 * forms (client), the Next.js route handlers and the Cloudflare Worker, so
 * all three agree on what a valid request is.
 */

export type LeadKind = "early-access" | "contact";

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1,000", "1,001-5,000", "5,000+"];
export const AGENT_VOLUMES = ["Just exploring", "1-10", "10-100", "100-1,000", "1,000+"];
export const USE_CASES = [
  "Customer support",
  "Internal operations",
  "Engineering and DevOps",
  "Sales and revenue operations",
  "Data and analytics",
  "Agent features in our product",
  "Client automation (agency)",
  "Something else",
];
export const DEPLOYMENTS = ["Managed cloud", "Our own cloud (VPC)", "Self-hosted", "Not sure yet"];
export const CONTACT_TOPICS = [
  "Sales",
  "Partnerships",
  "Security",
  "Press",
  "Support",
  "Something else",
];

type FieldSpec = {
  /** Used in validation messages and notifications. */
  label: string;
  required?: boolean;
  /** Maximum length for free text. */
  max?: number;
  format?: "email";
  options?: readonly string[];
};

export const LEAD_FIELDS = {
  "early-access": {
    email: { label: "Work email", required: true, max: 254, format: "email" },
    name: { label: "Full name", required: true, max: 120 },
    company: { label: "Company", required: true, max: 160 },
    role: { label: "Role", max: 120 },
    companySize: { label: "Company size", options: COMPANY_SIZES },
    agents: { label: "Agents planned", options: AGENT_VOLUMES },
    useCase: { label: "Primary use case", options: USE_CASES },
    deployment: { label: "Deployment", options: DEPLOYMENTS },
    message: { label: "Notes", max: 2000 },
  },
  contact: {
    email: { label: "Email", required: true, max: 254, format: "email" },
    name: { label: "Full name", required: true, max: 120 },
    company: { label: "Company", max: 160 },
    topic: { label: "Topic", required: true, options: CONTACT_TOPICS },
    message: { label: "Message", required: true, max: 4000 },
  },
} as const satisfies Record<LeadKind, Record<string, FieldSpec>>;

export type LeadFieldName<K extends LeadKind = LeadKind> = keyof (typeof LEAD_FIELDS)[K] & string;

export type Lead = {
  kind: LeadKind;
  /** Validated, trimmed values for the fields that were filled in. */
  fields: Record<string, string>;
  /** Where on the site the request started, for example `header` or `console:deploy-agent`. */
  source: string;
  /** Path of the page the form was submitted from. */
  page: string;
};

export type LeadValidation =
  { ok: true; lead: Lead } | { ok: false; errors: Record<string, string> };

/** Name of the hidden field that people leave empty and naive bots fill in. */
export const HONEYPOT_FIELD = "referral_code";
/** Submissions faster than this after the form appeared are treated as automated. */
export const MIN_FILL_MS = 1500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  // Collapse control characters so values are safe in logs and notifications.
  return value
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

export function validateLead(kind: LeadKind, input: unknown): LeadValidation {
  const data =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const specs: Record<string, FieldSpec> = LEAD_FIELDS[kind];
  const errors: Record<string, string> = {};
  const fields: Record<string, string> = {};

  for (const [name, spec] of Object.entries(specs)) {
    const raw = data[name];
    const limit = spec.max ?? 200;
    const value = clean(raw, limit + 1);

    if (value === "") {
      if (spec.required) {
        errors[name] = spec.options
          ? `Choose a ${spec.label.toLowerCase()}.`
          : `Enter your ${spec.label.toLowerCase()}.`;
      }
      continue;
    }

    if (value.length > limit) {
      errors[name] = `${spec.label} must be ${limit.toLocaleString("en-US")} characters or fewer.`;
      continue;
    }

    if (spec.format === "email" && !EMAIL_PATTERN.test(value)) {
      errors[name] = "Enter a valid email address.";
      continue;
    }

    if (spec.options && !spec.options.includes(value)) {
      errors[name] = "Choose one of the listed options.";
      continue;
    }

    fields[name] = value;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    lead: {
      kind,
      fields,
      source: clean(data.source, 80).replace(/[^\w:./-]/g, "") || "unknown",
      page: clean(data.page, 200) || "/",
    },
  };
}

/** Labels for the fields of a lead, in form order, for notifications. */
export function describeLead(lead: Lead): Array<{ label: string; value: string }> {
  const specs: Record<string, FieldSpec> = LEAD_FIELDS[lead.kind];
  return Object.entries(specs)
    .filter(([name]) => lead.fields[name])
    .map(([name, spec]) => ({ label: spec.label, value: lead.fields[name] }));
}
