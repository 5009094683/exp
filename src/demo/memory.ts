import { fleet } from "./agents";
import { runs } from "./runs";

export type MemoryScope = {
  id: string;
  name: string;
  kind: "Workspace" | "Tenant" | "Agent" | "Run";
  description: string;
  entries: number;
  sizeMb: number;
  retention: string;
  redaction: string[];
  readers: string[];
  reads24h: number;
  writes24h: number;
};

export const memoryScopes: MemoryScope[] = [
  {
    id: "workspace",
    name: "workspace",
    kind: "Workspace",
    description: "Curated knowledge shared by every agent. Written by admins only.",
    entries: 184,
    sizeMb: 12.4,
    retention: "No expiry",
    redaction: [],
    readers: ["All agents"],
    reads24h: 6522,
    writes24h: 3,
  },
  {
    id: "tenant",
    name: "tenant:*",
    kind: "Tenant",
    description: "One isolated store for each customer, keyed by tenant ID.",
    entries: 48210,
    sizeMb: 361.8,
    retention: "180 days",
    redaction: ["email", "phone", "payment_card"],
    readers: ["support-triage", "renewal-forecaster"],
    reads24h: 13150,
    writes24h: 12912,
  },
  {
    id: "agent",
    name: "agent:*",
    kind: "Agent",
    description: "What each agent has learned about doing its own job.",
    entries: 2946,
    sizeMb: 28.1,
    retention: "90 days",
    redaction: ["email", "phone"],
    readers: ["The owning agent"],
    reads24h: 18204,
    writes24h: 1108,
  },
  {
    id: "run",
    name: "run",
    kind: "Run",
    description: "Working notes for a single run. Deleted when the run ends.",
    entries: 37,
    sizeMb: 0.4,
    retention: "Ends with the run",
    redaction: [],
    readers: ["The current run"],
    reads24h: fleet.runs24h * 2,
    writes24h: fleet.runs24h,
  },
];

export type MemoryEntry = {
  id: string;
  scope: string;
  /** Concrete store, for example `tenant:northgate`. */
  store: string;
  kind: "Fact" | "Preference" | "Episode" | "Document";
  key: string;
  content: string;
  writtenBy: string;
  sourceRunId?: string;
  createdMinutesAgo: number;
  expiresInDays: number | null;
  redactedFields: number;
  reads7d: number;
};

const runOf = (agent: string) => runs.find((run) => run.agentSlug === agent)?.id;

export const memoryEntries: MemoryEntry[] = [
  {
    id: "mem_8k2m4x9q",
    scope: "tenant",
    store: "tenant:northgate",
    kind: "Episode",
    key: "support/export-async",
    content: "Explained asynchronous exports for large scheduled reports (ticket 48213).",
    writtenBy: "support-triage",
    sourceRunId: runOf("support-triage"),
    createdMinutesAgo: 5,
    expiresInDays: 180,
    redactedFields: 0,
    reads7d: 1,
  },
  {
    id: "mem_3f7n1c5d",
    scope: "tenant",
    store: "tenant:northgate",
    kind: "Fact",
    key: "account/plan",
    content: "Enterprise plan. Exports over 50k rows run asynchronously since the March migration.",
    writtenBy: "support-triage",
    createdMinutesAgo: 12960,
    expiresInDays: 171,
    redactedFields: 0,
    reads7d: 46,
  },
  {
    id: "mem_9q5t2h8b",
    scope: "tenant",
    store: "tenant:harborline",
    kind: "Episode",
    key: "renewal/health",
    content: "At risk ahead of renewal: active seats down 12% in 8 weeks, open P1 on checkout.",
    writtenBy: "renewal-forecaster",
    sourceRunId: runOf("renewal-forecaster"),
    createdMinutesAgo: 412,
    expiresInDays: 90,
    redactedFields: 0,
    reads7d: 3,
  },
  {
    id: "mem_5w1p6r3v",
    scope: "tenant",
    store: "tenant:harborline",
    kind: "Preference",
    key: "contact/escalation",
    content:
      "Escalations go to the IT duty mailbox, [redacted email]. No phone calls outside 08:00-18:00 CET.",
    writtenBy: "support-triage",
    createdMinutesAgo: 30240,
    expiresInDays: 159,
    redactedFields: 1,
    reads7d: 9,
  },
  {
    id: "mem_2d7j4s9l",
    scope: "workspace",
    store: "workspace",
    kind: "Document",
    key: "legal/playbook/msa",
    content: "Approved positions for master service agreements, version 2026.2 (22 positions).",
    writtenBy: "Sofia Marin",
    createdMinutesAgo: 41760,
    expiresInDays: null,
    redactedFields: 0,
    reads7d: 118,
  },
  {
    id: "mem_8b3y6k1m",
    scope: "workspace",
    store: "workspace",
    kind: "Document",
    key: "icp/v3",
    content: "Ideal customer profile: logistics, retail and fintech; 500+ employees.",
    writtenBy: "Tom Becker",
    createdMinutesAgo: 86400,
    expiresInDays: null,
    redactedFields: 0,
    reads7d: 6410,
  },
  {
    id: "mem_4n9c2x7f",
    scope: "workspace",
    store: "workspace",
    kind: "Episode",
    key: "incidents/INC-7731",
    content:
      "Unindexed stock query in inventory-svc caused checkout latency. Mitigated by rollback.",
    writtenBy: "incident-responder",
    sourceRunId: runOf("incident-responder"),
    createdMinutesAgo: 14,
    expiresInDays: null,
    redactedFields: 0,
    reads7d: 0,
  },
  {
    id: "mem_6h1v8t3z",
    scope: "agent",
    store: "agent:support-triage",
    kind: "Preference",
    key: "style/replies",
    content: "Lead with the answer, then the steps. One apology at most. Link the help article.",
    writtenBy: "Dana Whitfield",
    createdMinutesAgo: 27360,
    expiresInDays: 71,
    redactedFields: 0,
    reads7d: 88204,
  },
  {
    id: "mem_1r6g5p2w",
    scope: "agent",
    store: "agent:payment-risk-screener",
    kind: "Fact",
    key: "signals/new-account",
    content:
      "First order on an account under 24 hours old with mismatched IP and card country: treat as high risk.",
    writtenBy: "payment-risk-screener",
    sourceRunId: runOf("payment-risk-screener"),
    createdMinutesAgo: 2890,
    expiresInDays: 88,
    redactedFields: 0,
    reads7d: 6120,
  },
  {
    id: "mem_0x4e7u9a",
    scope: "agent",
    store: "agent:data-quality-monitor",
    kind: "Fact",
    key: "tables/orders_daily",
    content: "orders_daily loads hourly; anything older than 60 minutes counts as stale.",
    writtenBy: "data-quality-monitor",
    sourceRunId: runOf("data-quality-monitor"),
    createdMinutesAgo: 8640,
    expiresInDays: 84,
    redactedFields: 0,
    reads7d: 336,
  },
  {
    id: "mem_7m2q8d5k",
    scope: "agent",
    store: "agent:code-review",
    kind: "Preference",
    key: "repos/payments-service",
    content: "Payments changes need an idempotency test. Flag any retry path without a key.",
    writtenBy: "Priya Natarajan",
    createdMinutesAgo: 20160,
    expiresInDays: 76,
    redactedFields: 0,
    reads7d: 412,
  },
  {
    id: "mem_3c9w1n6j",
    scope: "run",
    store: `run:${runOf("support-triage") ?? "current"}`,
    kind: "Episode",
    key: "draft/v2",
    content: "Second draft of the reply after adding the help article link.",
    writtenBy: "support-triage",
    sourceRunId: runOf("support-triage"),
    createdMinutesAgo: 0.1,
    expiresInDays: 0,
    redactedFields: 0,
    reads7d: 1,
  },
];
