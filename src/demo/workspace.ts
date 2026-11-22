import type { ModelProfile } from "./agents";

/** The sample organization behind the demo console. People and addresses are fictional. */
export const workspace = {
  name: "Demo workspace",
  slug: "demo",
  id: "ws_4h8k2n6q",
  plan: "business" as const,
  region: "eu-central (Frankfurt)",
  environments: ["Production", "Staging"],
  created: "14 months ago",
  retention: { runs: "90 days", audit: "1 year", memory: "Per scope" },
};

export type MemberRole = "Owner" | "Admin" | "Builder" | "Approver" | "Viewer";

export type Member = {
  name: string;
  email: string;
  role: MemberRole;
  team: string;
  lastActiveMinutesAgo: number;
  sso: boolean;
};

export const members: Member[] = [
  {
    name: "Elena Rossi",
    email: "elena.rossi@example.com",
    role: "Owner",
    team: "IT",
    lastActiveMinutesAgo: 6,
    sso: true,
  },
  {
    name: "Priya Natarajan",
    email: "priya.natarajan@example.com",
    role: "Admin",
    team: "Platform",
    lastActiveMinutesAgo: 14,
    sso: true,
  },
  {
    name: "Marcus Tan",
    email: "marcus.tan@example.com",
    role: "Approver",
    team: "Finance Operations",
    lastActiveMinutesAgo: 18,
    sso: true,
  },
  {
    name: "Dana Whitfield",
    email: "dana.whitfield@example.com",
    role: "Builder",
    team: "Customer Support",
    lastActiveMinutesAgo: 22,
    sso: true,
  },
  {
    name: "Aisha Karim",
    email: "aisha.karim@example.com",
    role: "Approver",
    team: "Risk",
    lastActiveMinutesAgo: 47,
    sso: true,
  },
  {
    name: "Noah Lindqvist",
    email: "noah.lindqvist@example.com",
    role: "Builder",
    team: "Data Platform",
    lastActiveMinutesAgo: 95,
    sso: true,
  },
  {
    name: "Tom Becker",
    email: "tom.becker@example.com",
    role: "Builder",
    team: "Engineering",
    lastActiveMinutesAgo: 190,
    sso: true,
  },
  {
    name: "Sofia Marin",
    email: "sofia.marin@example.com",
    role: "Approver",
    team: "Customer Success",
    lastActiveMinutesAgo: 412,
    sso: true,
  },
  {
    name: "Jonas Weber",
    email: "jonas.weber@example.com",
    role: "Viewer",
    team: "Internal Audit",
    lastActiveMinutesAgo: 2890,
    sso: true,
  },
];

export const ROLE_DESCRIPTIONS: Record<MemberRole, string> = {
  Owner: "Full access, including billing and deleting the workspace.",
  Admin: "Manage members, integrations, policies and settings.",
  Builder: "Create and deploy agents in the environments they are granted.",
  Approver: "Approve or reject actions routed to them or their groups.",
  Viewer: "Read-only access to agents, runs and the audit log.",
};

export type ApiKey = {
  name: string;
  /** Shown masked; the full value is displayed once, when a key is created. */
  prefix: string;
  scopes: string[];
  environment: "Production" | "Staging";
  createdDaysAgo: number;
  lastUsedMinutesAgo: number | null;
  createdBy: string;
};

export const apiKeys: ApiKey[] = [
  {
    name: "ci-deploy",
    prefix: "ak_live_7f3k",
    scopes: ["agents:deploy", "policies:write"],
    environment: "Production",
    createdDaysAgo: 88,
    lastUsedMinutesAgo: 190,
    createdBy: "Priya Natarajan",
  },
  {
    name: "support-app-backend",
    prefix: "ak_live_2m9x",
    scopes: ["runs:create", "runs:read"],
    environment: "Production",
    createdDaysAgo: 61,
    lastUsedMinutesAgo: 0,
    createdBy: "Dana Whitfield",
  },
  {
    name: "usage-export",
    prefix: "ak_live_9q4t",
    scopes: ["usage:read", "audit:read"],
    environment: "Production",
    createdDaysAgo: 37,
    lastUsedMinutesAgo: 412,
    createdBy: "Marcus Tan",
  },
  {
    name: "staging-experiments",
    prefix: "ak_test_5w1p",
    scopes: ["agents:deploy", "runs:create", "runs:read"],
    environment: "Staging",
    createdDaysAgo: 12,
    lastUsedMinutesAgo: 1460,
    createdBy: "Tom Becker",
  },
  {
    name: "legacy-integration",
    prefix: "ak_live_0x4e",
    scopes: ["runs:read"],
    environment: "Production",
    createdDaysAgo: 210,
    lastUsedMinutesAgo: null,
    createdBy: "Elena Rossi",
  },
];

/** Which provider serves each model profile. Agents ask for a profile, not a model. */
export const modelRouting: Array<{
  profile: ModelProfile;
  primary: string;
  fallback: string;
  share24h: number;
}> = [
  {
    profile: "fast",
    primary: "Provider A · small",
    fallback: "Provider B · small",
    share24h: 0.27,
  },
  {
    profile: "balanced",
    primary: "Provider A · medium",
    fallback: "Provider B · medium",
    share24h: 0.43,
  },
  {
    profile: "reasoning",
    primary: "Provider B · large",
    fallback: "Self-hosted · large",
    share24h: 0.3,
  },
];

export const identity = {
  sso: { protocol: "SAML 2.0", provider: "Corporate identity provider", enforced: true },
  scim: { enabled: true, lastSyncMinutesAgo: 22, groups: 14 },
  session: { idleTimeout: "30 minutes", maxLifetime: "12 hours" },
  ipAllowlist: ["203.0.113.0/24", "198.51.100.32/28"],
};
