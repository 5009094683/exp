import type { TriggerType } from "./agents";
import type { PolicyDecision } from "./policies";

export type RunStatus =
  "succeeded" | "failed" | "running" | "awaiting_approval" | "blocked" | "cancelled";

export type StepKind = "trigger" | "model" | "tool" | "memory" | "sandbox" | "approval" | "output";

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type StepTemplate = {
  kind: StepKind;
  title: string;
  /** Tool reference, model profile, memory scope or sandbox template. */
  ref: string;
  /** Duration range in milliseconds. */
  ms: [number, number];
  tokens?: [input: number, output: number];
  input?: Json;
  output?: Json;
  policy?: { id: string; decision: PolicyDecision; reason: string };
  approval?: {
    approvers: string;
    channel: "Slack" | "Console" | "Email";
    request: string;
    decidedBy: string;
    waitMs: [number, number];
  };
  sandbox?: {
    template: string;
    command: string;
    logs: string[];
    egress?: Array<{ host: string; allowed: boolean }>;
    cpuSeconds: number;
    peakMemoryMb: number;
  };
  /** How this step fails in a failed run. */
  fails?: { error: string; logs?: string[] };
  /** How this step is denied in a blocked run. */
  blocks?: { policy: string; reason: string; input?: Json };
};

export type Scenario = {
  trigger: { type: TriggerType; label: string };
  steps: StepTemplate[];
  /** One-line outcome for each status the scenario supports. */
  outcomes: Partial<Record<RunStatus, string>>;
};

const granted = (reason = "Tool is granted to this agent."): StepTemplate["policy"] => ({
  id: "least-privilege",
  decision: "allow",
  reason,
});

/**
 * Sample runs, written as step templates. `runs.ts` turns them into concrete
 * runs with timings. People, companies and identifiers are fictional.
 */
export const scenarios: Record<string, Scenario[]> = {
  "support-triage": [
    {
      trigger: { type: "webhook", label: "zendesk · ticket.created" },
      steps: [
        {
          kind: "trigger",
          title: "Ticket created",
          ref: "zendesk · ticket.created",
          ms: [4, 12],
          output: {
            ticket_id: 48213,
            subject: "Scheduled report export stopped working",
            requester: "dana.osei@northgate.example",
            organization: "Northgate Logistics",
          },
        },
        {
          kind: "memory",
          title: "Recall customer context",
          ref: "memory.read · tenant:northgate",
          ms: [18, 46],
          input: { query: "report export", scope: "tenant:northgate", limit: 5 },
          output: {
            matches: 2,
            top: "Enterprise plan. Exports over 50k rows run asynchronously since the March migration.",
          },
        },
        {
          kind: "model",
          title: "Classify ticket",
          ref: "balanced",
          ms: [640, 1100],
          tokens: [1840, 96],
          output: { category: "bug", area: "reporting", priority: "p2", sentiment: "frustrated" },
        },
        {
          kind: "tool",
          title: "Search help center",
          ref: "knowledge-base.search",
          ms: [80, 190],
          policy: granted(),
          input: { query: "scheduled export fails large report", limit: 4 },
          output: { results: 4, top: "HC-2291 · Export limits and asynchronous exports" },
          fails: { error: "upstream timeout after 3 attempts (10s, 20s, 40s)" },
        },
        {
          kind: "tool",
          title: "Read ticket history",
          ref: "zendesk.search_tickets",
          ms: [170, 320],
          policy: granted(),
          input: { organization: "Northgate Logistics", status: "solved", limit: 10 },
          output: { tickets: 3, related: [47102] },
        },
        {
          kind: "model",
          title: "Draft reply",
          ref: "balanced",
          ms: [2100, 3400],
          tokens: [3210, 412],
          output: {
            draft:
              "Hi Dana, thanks for flagging this. Your scheduled export now exceeds 50,000 rows, so it runs asynchronously and arrives by email instead of downloading...",
            cites: ["HC-2291"],
          },
        },
        {
          kind: "tool",
          title: "Post reply",
          ref: "zendesk.add_comment",
          ms: [190, 340],
          policy: {
            id: "p1-replies",
            decision: "allow",
            reason: "Priority is p2; no review needed.",
          },
          input: { ticket_id: 48213, public: true },
          output: { comment_id: 993120, status: "pending" },
        },
        {
          kind: "memory",
          title: "Remember resolution",
          ref: "memory.write · tenant:northgate",
          ms: [22, 51],
          input: {
            scope: "tenant:northgate",
            ttl: "180d",
            content: "Explained async exports for large scheduled reports (ticket 48213).",
          },
          output: { stored: true, redacted_fields: 0 },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { resolution: "replied", priority: "p2", handoff: false },
        },
      ],
      outcomes: {
        succeeded: "Replied to ticket 48213 with the async export explanation.",
        failed: "Help center search timed out after 3 attempts.",
        running: "Drafting a reply to ticket 48213.",
      },
    },
    {
      trigger: { type: "webhook", label: "zendesk · ticket.created" },
      steps: [
        {
          kind: "trigger",
          title: "Ticket created",
          ref: "zendesk · ticket.created",
          ms: [4, 12],
          output: {
            ticket_id: 48267,
            subject: "URGENT: checkout failing for all users",
            requester: "it@harborline.example",
            organization: "Harborline Retail",
          },
        },
        {
          kind: "model",
          title: "Classify ticket",
          ref: "balanced",
          ms: [620, 980],
          tokens: [1910, 104],
          output: { category: "incident", area: "checkout", priority: "p1", sentiment: "urgent" },
        },
        {
          kind: "tool",
          title: "Search help center",
          ref: "knowledge-base.search",
          ms: [80, 190],
          policy: granted(),
          input: { query: "checkout failing all users", limit: 4 },
          output: { results: 2, top: "HC-1180 · Checkout troubleshooting" },
        },
        {
          kind: "tool",
          title: "Notify support leads",
          ref: "slack.post_message",
          ms: [140, 260],
          policy: granted(),
          input: { channel: "#support-p1", text: "P1 from Harborline Retail: checkout failing" },
          output: { ok: true, ts: "1795.4410" },
        },
        {
          kind: "model",
          title: "Draft reply",
          ref: "balanced",
          ms: [1900, 3000],
          tokens: [2980, 356],
          output: {
            draft:
              "Hi, we're treating this as a priority incident. Our engineers are investigating checkout failures now and I'll update you within 30 minutes...",
          },
        },
        {
          kind: "approval",
          title: "Support lead review",
          ref: "group:support-leads",
          ms: [1, 2],
          policy: {
            id: "p1-replies",
            decision: "approval",
            reason: "Public reply on a P1 ticket needs a support lead.",
          },
          approval: {
            approvers: "group:support-leads",
            channel: "Slack",
            request: "Send this reply to Harborline Retail (P1, ticket 48267)?",
            decidedBy: "Dana Whitfield",
            waitMs: [95_000, 260_000],
          },
        },
        {
          kind: "tool",
          title: "Post reply",
          ref: "zendesk.add_comment",
          ms: [190, 340],
          policy: {
            id: "p1-replies",
            decision: "allow",
            reason: "Approved by Dana Whitfield.",
          },
          input: { ticket_id: 48267, public: true },
          output: { comment_id: 993388, status: "open" },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { resolution: "replied", priority: "p1", handoff: true },
        },
      ],
      outcomes: {
        succeeded: "P1 reply sent to Harborline Retail after support lead review.",
        awaiting_approval: "Waiting for a support lead to review the P1 reply.",
      },
    },
  ],

  "payment-risk-screener": [
    {
      trigger: { type: "event", label: "stripe · early_fraud_warning" },
      steps: [
        {
          kind: "trigger",
          title: "Fraud warning received",
          ref: "stripe · early_fraud_warning",
          ms: [3, 9],
          output: {
            payment: "pi_3Qd81x",
            amount: 1840.0,
            currency: "usd",
            reason: "card_never_received",
          },
        },
        {
          kind: "tool",
          title: "Read payment",
          ref: "stripe.get_payment_intent",
          ms: [150, 260],
          policy: granted(),
          input: { id: "pi_3Qd81x" },
          output: { risk_score: 78, card_country: "US", ip_country: "RO", "3ds": "not_attempted" },
          fails: { error: "429 Too Many Requests from upstream after 3 attempts" },
        },
        {
          kind: "tool",
          title: "Query order history",
          ref: "postgres.query",
          ms: [24, 70],
          policy: granted(),
          input: {
            sql: "select count(*), min(created_at) from orders where customer_id = $1",
            params: ["cus_8841"],
          },
          output: { orders: 1, account_age_days: 0, shipping_matches_billing: false },
        },
        {
          kind: "model",
          title: "Assess risk",
          ref: "reasoning",
          ms: [3800, 6200],
          tokens: [5640, 480],
          output: {
            verdict: "likely_fraud",
            confidence: 0.91,
            evidence: ["IP and card country differ", "First order on a new account", "No 3DS"],
            recommendation: "refund_and_block",
          },
        },
        {
          kind: "approval",
          title: "Risk analyst approval",
          ref: "group:risk-analysts",
          ms: [1, 2],
          policy: {
            id: "payments-over-1000",
            decision: "approval",
            reason: "Refund of $1,840.00 is above the $1,000 threshold.",
          },
          approval: {
            approvers: "group:risk-analysts",
            channel: "Console",
            request: "Refund $1,840.00 on pi_3Qd81x and block the card?",
            decidedBy: "Aisha Karim",
            waitMs: [140_000, 420_000],
          },
        },
        {
          kind: "tool",
          title: "Create refund",
          ref: "stripe.create_refund",
          ms: [210, 380],
          policy: {
            id: "payments-over-1000",
            decision: "allow",
            reason: "Approved by Aisha Karim.",
          },
          input: { payment: "pi_3Qd81x", amount: 1840.0, reason: "fraudulent" },
          output: { refund: "re_3Qd9aa", status: "succeeded" },
        },
        {
          kind: "tool",
          title: "Notify risk channel",
          ref: "slack.post_message",
          ms: [130, 240],
          policy: granted(),
          input: {
            channel: "#risk-alerts",
            text: "Refunded pi_3Qd81x ($1,840.00) as likely fraud.",
          },
          output: { ok: true },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { action: "refunded", amount: 1840.0, approved_by: "Aisha Karim" },
        },
      ],
      outcomes: {
        succeeded: "Refunded $1,840.00 as likely fraud after analyst approval.",
        awaiting_approval: "Waiting for a risk analyst to approve a $1,840.00 refund.",
        failed: "Payment lookup was rate limited by the upstream API.",
      },
    },
  ],

  "lead-enrichment": [
    {
      trigger: { type: "event", label: "salesforce · lead.created" },
      steps: [
        {
          kind: "trigger",
          title: "Lead created",
          ref: "salesforce · lead.created",
          ms: [3, 9],
          output: { lead: "00Q8d00000Xk2", company: "Northgate Logistics", source: "webinar" },
        },
        {
          kind: "tool",
          title: "Read lead",
          ref: "salesforce.get_lead",
          ms: [220, 380],
          policy: granted(),
          input: { id: "00Q8d00000Xk2" },
          output: { company: "Northgate Logistics", title: "VP Operations", country: "US" },
        },
        {
          kind: "tool",
          title: "Research company",
          ref: "web-research.search",
          ms: [820, 1500],
          policy: {
            id: "no-pii-external",
            decision: "allow",
            reason: "Query contains no personal data.",
          },
          input: { query: "Northgate Logistics company size funding" },
          output: { results: 8, employees: "1,200-1,500", industry: "Freight and logistics" },
          blocks: {
            policy: "no-pii-external",
            reason: "Personal data cannot leave the company boundary (email detected in query).",
            input: { query: "d.osei@northgate.example linkedin" },
          },
        },
        {
          kind: "memory",
          title: "Recall ideal customer profile",
          ref: "memory.read · workspace",
          ms: [16, 40],
          input: { key: "icp/v3", scope: "workspace" },
          output: { segments: ["logistics", "retail", "fintech"], min_employees: 500 },
        },
        {
          kind: "model",
          title: "Score fit",
          ref: "fast",
          ms: [380, 720],
          tokens: [2240, 142],
          output: { score: 86, tier: "A", reasons: ["Target industry", "1,200+ employees"] },
        },
        {
          kind: "tool",
          title: "Update lead",
          ref: "salesforce.update_lead",
          ms: [260, 420],
          policy: granted(),
          input: { id: "00Q8d00000Xk2", fit_score: 86, tier: "A", owner: "enterprise-west" },
          output: { updated: true },
        },
        {
          kind: "tool",
          title: "Notify owner",
          ref: "slack.post_message",
          ms: [130, 240],
          policy: granted(),
          input: {
            channel: "#leads-enterprise",
            text: "New tier A lead: Northgate Logistics (86)",
          },
          output: { ok: true },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { tier: "A", score: 86, routed_to: "enterprise-west" },
        },
      ],
      outcomes: {
        succeeded: "Scored Northgate Logistics 86 (tier A) and routed to enterprise-west.",
        blocked: "Blocked: a web search would have sent a personal email address off-platform.",
      },
    },
  ],

  "data-quality-monitor": [
    {
      trigger: { type: "schedule", label: "Every 30 min" },
      steps: [
        {
          kind: "trigger",
          title: "Scheduled run",
          ref: "schedule · */30 * * * *",
          ms: [2, 6],
          output: { tables: 42, window: "30m" },
        },
        {
          kind: "tool",
          title: "Check freshness",
          ref: "snowflake.query",
          ms: [640, 1400],
          policy: granted("Read-only role; tool is granted to this agent."),
          input: {
            sql: "select table_name, max(loaded_at) from analytics.load_audit group by 1",
          },
          output: { rows: 42, stale: ["orders_daily"] },
          fails: { error: "warehouse query timed out after 60s (statement cancelled)" },
        },
        {
          kind: "sandbox",
          title: "Run anomaly checks",
          ref: "python-data",
          ms: [6200, 11000],
          sandbox: {
            template: "python-data",
            command: "python checks/anomaly.py --tables stale.json",
            logs: [
              "$ python checks/anomaly.py --tables stale.json",
              "loading 1 table(s) from stale.json",
              "orders_daily: last load 3h 12m ago (threshold 1h)",
              "orders_daily: row count -38.4% vs 7-day median",
              "wrote report.json (1 finding)",
              "exit 0",
            ],
            cpuSeconds: 4.8,
            peakMemoryMb: 312,
          },
          output: { findings: 1, table: "orders_daily", severity: "high" },
        },
        {
          kind: "model",
          title: "Summarize finding",
          ref: "fast",
          ms: [420, 800],
          tokens: [1320, 164],
          output: {
            summary:
              "orders_daily is 3h stale and 38% below its usual row count; the upstream load job last succeeded at 09:14 UTC.",
          },
        },
        {
          kind: "tool",
          title: "Open ticket",
          ref: "jira.create_issue",
          ms: [240, 400],
          policy: granted(),
          input: {
            project: "DATA",
            type: "Incident",
            title: "orders_daily stale and under-loaded",
          },
          output: { key: "DATA-2291" },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { checked: 42, findings: 1, ticket: "DATA-2291" },
        },
      ],
      outcomes: {
        succeeded: "Checked 42 tables; opened DATA-2291 for orders_daily.",
        failed: "Freshness query timed out in the warehouse.",
      },
    },
  ],

  "code-review": [
    {
      trigger: { type: "webhook", label: "github · pull_request.opened" },
      steps: [
        {
          kind: "trigger",
          title: "Pull request opened",
          ref: "github · pull_request.opened",
          ms: [3, 9],
          output: { repo: "payments-service", number: 1842, author: "t.becker", files: 7 },
        },
        {
          kind: "tool",
          title: "Read diff",
          ref: "github.get_diff",
          ms: [210, 420],
          policy: granted("Runs with the pull request author's own access."),
          input: { repo: "payments-service", number: 1842 },
          output: { files: 7, additions: 214, deletions: 38 },
        },
        {
          kind: "sandbox",
          title: "Run test suite",
          ref: "node-ci",
          ms: [34000, 52000],
          sandbox: {
            template: "node-ci",
            command: "pnpm install --frozen-lockfile && pnpm test --filter payments",
            logs: [
              "$ pnpm install --frozen-lockfile",
              "Packages: +412 (registry.npmjs.org)",
              "$ pnpm test --filter payments",
              " ✓ refunds/create.test.ts (14 tests)",
              " ✓ refunds/idempotency.test.ts (6 tests)",
              " ✓ webhooks/signature.test.ts (9 tests)",
              "Test Files  11 passed (11)",
              "     Tests  96 passed (96)",
              "exit 0",
            ],
            egress: [
              { host: "registry.npmjs.org", allowed: true },
              { host: "telemetry.vendor.example", allowed: false },
            ],
            cpuSeconds: 61.4,
            peakMemoryMb: 1840,
          },
          output: { passed: 96, failed: 0, duration_s: 41 },
          fails: {
            error: "test suite failed: 2 of 96 tests (exit 1)",
            logs: [
              "$ pnpm install --frozen-lockfile",
              "Packages: +412 (registry.npmjs.org)",
              "$ pnpm test --filter payments",
              " ✓ refunds/create.test.ts (14 tests)",
              " ✗ refunds/idempotency.test.ts (6 tests | 2 failed)",
              "   × replays a refund with the same key",
              "     expected 1 refund, received 2",
              "Test Files  1 failed | 10 passed (11)",
              "     Tests  2 failed | 94 passed (96)",
              "exit 1",
            ],
          },
        },
        {
          kind: "model",
          title: "Review changes",
          ref: "balanced",
          ms: [5200, 8400],
          tokens: [12400, 890],
          output: {
            findings: [
              {
                severity: "medium",
                file: "refunds/create.ts",
                note: "Idempotency key is not passed to the retry path.",
              },
              { severity: "nit", file: "refunds/types.ts", note: "Unused export." },
            ],
            verdict: "comment",
          },
        },
        {
          kind: "tool",
          title: "Submit review",
          ref: "github.create_review",
          ms: [280, 460],
          policy: granted(),
          input: { number: 1842, event: "COMMENT", comments: 2 },
          output: { review_id: 220184, state: "commented" },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { tests: "96 passed", comments: 2 },
        },
      ],
      outcomes: {
        succeeded: "Reviewed payments-service #1842: tests pass, 2 comments.",
        failed: "Tests failed in the sandbox: 2 of 96 (refund idempotency).",
        running: "Running the payments test suite in a sandbox.",
      },
    },
  ],

  "invoice-reconciler": [
    {
      trigger: { type: "schedule", label: "Hourly" },
      steps: [
        {
          kind: "trigger",
          title: "Scheduled run",
          ref: "schedule · 0 * * * *",
          ms: [2, 6],
          output: { period: "last 60 min" },
        },
        {
          kind: "tool",
          title: "List unmatched invoices",
          ref: "internal-erp.list_unmatched_invoices",
          ms: [120, 240],
          policy: granted(),
          input: { status: "unmatched", limit: 200 },
          output: { invoices: 14, total: 48210.55 },
        },
        {
          kind: "tool",
          title: "Load purchase orders",
          ref: "postgres.query",
          ms: [30, 80],
          policy: granted(),
          input: { sql: "select * from purchase_orders where vendor_id = any($1) and open" },
          output: { rows: 31 },
        },
        {
          kind: "sandbox",
          title: "Match invoices",
          ref: "python-data",
          ms: [4800, 8200],
          sandbox: {
            template: "python-data",
            command: "python reconcile.py invoices.json purchase_orders.json",
            logs: [
              "$ python reconcile.py invoices.json purchase_orders.json",
              "14 invoices, 31 open purchase orders",
              "matched 12 (exact 9, tolerance 3)",
              "unmatched 2: INV-20931 (qty), INV-20944 (price +6.2%)",
              "wrote matches.json, exceptions.json",
              "exit 0",
            ],
            cpuSeconds: 3.1,
            peakMemoryMb: 264,
          },
          output: { matched: 12, exceptions: 2, matched_total: 43090.55 },
        },
        {
          kind: "model",
          title: "Explain exceptions",
          ref: "reasoning",
          ms: [3200, 5200],
          tokens: [4860, 520],
          output: {
            exceptions: [
              { invoice: "INV-20931", cause: "Billed 120 units against a PO for 100." },
              { invoice: "INV-20944", cause: "Unit price is 6.2% above the PO; tolerance is 2%." },
            ],
          },
        },
        {
          kind: "approval",
          title: "Controller approval",
          ref: "group:finance-controllers",
          ms: [1, 2],
          policy: {
            id: "payments-over-1000",
            decision: "approval",
            reason: "Journal entry of $43,090.55 is above the $1,000 threshold.",
          },
          approval: {
            approvers: "group:finance-controllers",
            channel: "Console",
            request: "Post 12 matched invoices ($43,090.55) to the ledger?",
            decidedBy: "Marcus Tan",
            waitMs: [240_000, 720_000],
          },
        },
        {
          kind: "tool",
          title: "Post journal entry",
          ref: "internal-erp.post_journal_entry",
          ms: [180, 320],
          policy: {
            id: "payments-over-1000",
            decision: "allow",
            reason: "Approved by Marcus Tan.",
          },
          input: { entries: 12, amount: 43090.55 },
          output: { journal: "JE-118204", posted: true },
        },
        {
          kind: "tool",
          title: "Report exceptions",
          ref: "slack.post_message",
          ms: [130, 240],
          policy: granted(),
          input: {
            channel: "#ap-exceptions",
            text: "2 invoices need review: INV-20931, INV-20944",
          },
          output: { ok: true },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { posted: 12, exceptions: 2, journal: "JE-118204" },
        },
      ],
      outcomes: {
        succeeded: "Posted 12 matched invoices ($43,090.55); 2 exceptions sent for review.",
        awaiting_approval: "Waiting for a finance controller to approve a $43,090.55 entry.",
      },
    },
  ],

  "renewal-forecaster": [
    {
      trigger: { type: "schedule", label: "Daily · 06:00 UTC" },
      steps: [
        {
          kind: "trigger",
          title: "Scheduled run",
          ref: "schedule · 0 6 * * *",
          ms: [2, 6],
          output: { account: "Harborline Retail", renews_in_days: 41 },
        },
        {
          kind: "tool",
          title: "Read account",
          ref: "salesforce.get_account",
          ms: [240, 400],
          policy: granted("Runs with the account owner's own access."),
          input: { name: "Harborline Retail" },
          output: { arr: 186000, owner: "s.marin", seats: 240 },
        },
        {
          kind: "tool",
          title: "Query product usage",
          ref: "snowflake.query",
          ms: [700, 1500],
          policy: granted(),
          input: { sql: "select week, active_seats from usage.weekly where account_id = $1" },
          output: { active_seats: 171, trend_8w: "-12%" },
        },
        {
          kind: "tool",
          title: "Search open tickets",
          ref: "zendesk.search_tickets",
          ms: [170, 320],
          policy: granted(),
          input: { organization: "Harborline Retail", status: "open" },
          output: { open: 4, p1: 1 },
        },
        {
          kind: "model",
          title: "Write health summary",
          ref: "balanced",
          ms: [2600, 4200],
          tokens: [6120, 540],
          output: {
            health: "at_risk",
            risks: ["Active seats down 12% in 8 weeks", "Open P1 on checkout"],
            next_steps: ["Schedule an executive check-in", "Share the incident review"],
          },
        },
        {
          kind: "memory",
          title: "Store summary",
          ref: "memory.write · tenant:harborline",
          ms: [22, 51],
          input: { scope: "tenant:harborline", ttl: "90d", key: "renewal/health" },
          output: { stored: true },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { account: "Harborline Retail", health: "at_risk" },
        },
      ],
      outcomes: {
        succeeded: "Harborline Retail flagged at risk ahead of renewal in 41 days.",
      },
    },
  ],

  "access-concierge": [
    {
      trigger: { type: "event", label: "slack · message in #it-help" },
      steps: [
        {
          kind: "trigger",
          title: "Access request",
          ref: "slack · message in #it-help",
          ms: [3, 9],
          output: {
            user: "j.alvarez",
            text: "Can I get read access to the billing dashboard?",
          },
        },
        {
          kind: "model",
          title: "Understand request",
          ref: "balanced",
          ms: [520, 900],
          tokens: [1180, 88],
          output: {
            system: "billing-dashboard",
            level: "read",
            group: "billing-dashboard-readers",
          },
        },
        {
          kind: "tool",
          title: "Look up user",
          ref: "identity-provider.get_user",
          ms: [900, 1800],
          policy: granted(),
          input: { user: "j.alvarez" },
          output: { department: "Customer Success", manager: "s.marin", status: "active" },
          fails: { error: "connector timeout: identity service did not respond within 10s" },
        },
        {
          kind: "approval",
          title: "Manager approval",
          ref: "manager_of:j.alvarez",
          ms: [1, 2],
          policy: {
            id: "access-grants",
            decision: "approval",
            reason: "Group changes are approved by the requester's manager.",
          },
          approval: {
            approvers: "Sofia Marin (manager)",
            channel: "Slack",
            request: "Add j.alvarez to billing-dashboard-readers?",
            decidedBy: "Sofia Marin",
            waitMs: [180_000, 900_000],
          },
        },
        {
          kind: "tool",
          title: "Add to group",
          ref: "identity-provider.add_to_group",
          ms: [1100, 2100],
          policy: { id: "access-grants", decision: "allow", reason: "Approved by Sofia Marin." },
          input: { user: "j.alvarez", group: "billing-dashboard-readers" },
          output: { added: true },
        },
        {
          kind: "tool",
          title: "Record ticket",
          ref: "jira.create_issue",
          ms: [240, 400],
          policy: granted(),
          input: { project: "IT", type: "Access", title: "billing-dashboard-readers: j.alvarez" },
          output: { key: "IT-5512" },
        },
        {
          kind: "tool",
          title: "Reply in thread",
          ref: "slack.post_message",
          ms: [130, 240],
          policy: granted(),
          input: { channel: "#it-help", thread: true, text: "Done. You now have read access." },
          output: { ok: true },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { granted: "billing-dashboard-readers", ticket: "IT-5512" },
        },
      ],
      outcomes: {
        succeeded: "Granted billing dashboard read access after manager approval.",
        awaiting_approval: "Waiting for Sofia Marin to approve an access request.",
        failed: "Identity provider connector timed out while looking up the user.",
      },
    },
  ],

  "contract-analyst": [
    {
      trigger: { type: "api", label: "POST /v1/agents/contract-analyst/runs" },
      steps: [
        {
          kind: "trigger",
          title: "Run requested",
          ref: "api · POST /v1/runs",
          ms: [3, 9],
          output: { file: "MSA - Northgate Logistics (v3).pdf", requested_by: "s.marin" },
        },
        {
          kind: "tool",
          title: "Download contract",
          ref: "google-drive.get_file",
          ms: [320, 620],
          policy: granted("Runs with the requesting user's own access."),
          input: { name: "MSA - Northgate Logistics (v3).pdf" },
          output: { pages: 34, size_kb: 812 },
        },
        {
          kind: "sandbox",
          title: "Extract text",
          ref: "python-docs",
          ms: [5200, 9000],
          sandbox: {
            template: "python-docs",
            command: "python extract.py contract.pdf --ocr auto",
            logs: [
              "$ python extract.py contract.pdf --ocr auto",
              "34 pages, 2 scanned (ocr)",
              "extracted 18,412 words, 61 clauses",
              "wrote contract.json",
              "exit 0",
            ],
            egress: [],
            cpuSeconds: 7.2,
            peakMemoryMb: 508,
          },
          output: { words: 18412, clauses: 61 },
        },
        {
          kind: "memory",
          title: "Load legal playbook",
          ref: "memory.read · workspace",
          ms: [20, 48],
          input: { key: "legal/playbook/msa", scope: "workspace" },
          output: { positions: 22, version: "2026.2" },
        },
        {
          kind: "model",
          title: "Compare against playbook",
          ref: "reasoning",
          ms: [14000, 24000],
          tokens: [31200, 1840],
          output: {
            deviations: [
              {
                clause: "12.2 Limitation of liability",
                issue: "Cap is 6 months of fees; playbook minimum is 12.",
              },
              { clause: "15.1 Data processing", issue: "No sub-processor notification period." },
            ],
            risk: "medium",
          },
        },
        {
          kind: "tool",
          title: "Publish summary",
          ref: "notion.create_page",
          ms: [300, 520],
          policy: granted(),
          input: { parent: "Legal / Contract reviews", title: "Northgate MSA v3: review" },
          output: { page: "Northgate MSA v3: review", url: "notion.example/p/8f2c" },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { deviations: 2, risk: "medium" },
        },
      ],
      outcomes: {
        succeeded: "Reviewed a 34-page MSA: 2 deviations from the playbook, medium risk.",
      },
    },
  ],

  "incident-responder": [
    {
      trigger: { type: "event", label: "pagerduty · incident.triggered" },
      steps: [
        {
          kind: "trigger",
          title: "Incident triggered",
          ref: "pagerduty · incident.triggered",
          ms: [3, 9],
          output: { incident: "INC-7731", service: "checkout-api", alert: "p95 latency above 2s" },
        },
        {
          kind: "tool",
          title: "Query latency",
          ref: "datadog.query_metrics",
          ms: [360, 700],
          policy: granted(),
          input: { query: "p95:trace.http.request{service:checkout-api}", range: "1h" },
          output: { p95_ms: 2840, baseline_ms: 410, started: "14 min ago" },
        },
        {
          kind: "tool",
          title: "Search error logs",
          ref: "datadog.search_logs",
          ms: [420, 820],
          policy: granted(),
          input: { query: "service:checkout-api status:error", range: "30m" },
          output: { errors: 1284, top: "upstream timeout: inventory-svc (92%)" },
        },
        {
          kind: "tool",
          title: "List recent deployments",
          ref: "github.list_deployments",
          ms: [220, 420],
          policy: granted(),
          input: { services: ["checkout-api", "inventory-svc"], since: "2h" },
          output: { latest: "inventory-svc@4f2c1a9", deployed: "22 min ago", previous: "9be07d1" },
        },
        {
          kind: "model",
          title: "Correlate and plan",
          ref: "reasoning",
          ms: [6800, 11000],
          tokens: [8420, 640],
          output: {
            hypothesis: "inventory-svc@4f2c1a9 added an unindexed query on the stock check path.",
            confidence: 0.86,
            proposal: "Roll inventory-svc back to 9be07d1.",
          },
        },
        {
          kind: "approval",
          title: "On-call approval",
          ref: "oncall:platform",
          ms: [1, 2],
          policy: {
            id: "production-changes",
            decision: "approval",
            reason: "Rollback targets production.",
          },
          approval: {
            approvers: "oncall:platform",
            channel: "Slack",
            request: "Roll inventory-svc back to 9be07d1 in production?",
            decidedBy: "Priya Natarajan",
            waitMs: [95_000, 210_000],
          },
        },
        {
          kind: "tool",
          title: "Roll back deployment",
          ref: "github.rollback_deployment",
          ms: [8200, 14000],
          policy: {
            id: "production-changes",
            decision: "allow",
            reason: "Approved by Priya Natarajan.",
          },
          input: { service: "inventory-svc", to: "9be07d1", environment: "production" },
          output: { status: "success", release: "inventory-svc@9be07d1" },
        },
        {
          kind: "tool",
          title: "Verify recovery",
          ref: "datadog.query_metrics",
          ms: [360, 700],
          policy: granted(),
          input: { query: "p95:trace.http.request{service:checkout-api}", range: "5m" },
          output: { p95_ms: 432, recovered: true },
        },
        {
          kind: "tool",
          title: "Post incident summary",
          ref: "slack.post_message",
          ms: [130, 240],
          policy: granted(),
          input: {
            channel: "#incidents",
            text: "INC-7731 mitigated by rolling back inventory-svc.",
          },
          output: { ok: true },
        },
        {
          kind: "memory",
          title: "Record learning",
          ref: "memory.write · workspace",
          ms: [22, 51],
          input: {
            scope: "workspace",
            key: "incidents/INC-7731",
            content: "Unindexed stock query in inventory-svc caused checkout latency.",
          },
          output: { stored: true },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { incident: "INC-7731", mitigation: "rollback", recovered: true },
        },
      ],
      outcomes: {
        succeeded: "INC-7731 mitigated: rolled inventory-svc back after on-call approval.",
        cancelled: "Cancelled by Priya Natarajan: incident was a duplicate.",
        awaiting_approval: "Waiting for the on-call engineer to approve a rollback.",
      },
    },
  ],

  "release-notes-writer": [
    {
      trigger: { type: "webhook", label: "github · release.created" },
      steps: [
        {
          kind: "trigger",
          title: "Release created",
          ref: "github · release.created",
          ms: [3, 9],
          output: { repo: "web-app", tag: "v4.18.0", merged_prs: 23 },
        },
        {
          kind: "tool",
          title: "Read merged pull requests",
          ref: "github.get_pull_request",
          ms: [1400, 2600],
          policy: granted(),
          input: { repo: "web-app", range: "v4.17.0..v4.18.0" },
          output: { pull_requests: 23, labelled: 21 },
        },
        {
          kind: "model",
          title: "Write notes",
          ref: "fast",
          ms: [2400, 3800],
          tokens: [9840, 760],
          output: { sections: ["New", "Improved", "Fixed"], items: 17 },
        },
        {
          kind: "tool",
          title: "Publish draft",
          ref: "notion.create_page",
          ms: [300, 520],
          policy: granted(),
          input: { parent: "Product / Release notes", title: "v4.18.0 (draft)" },
          output: { page: "v4.18.0 (draft)" },
        },
        {
          kind: "tool",
          title: "Ask for review",
          ref: "slack.post_message",
          ms: [130, 240],
          policy: granted(),
          input: { channel: "#product", text: "Draft release notes for v4.18.0 are ready." },
          output: { ok: true },
        },
        {
          kind: "output",
          title: "Run complete",
          ref: "result",
          ms: [2, 6],
          output: { release: "v4.18.0", items: 17 },
        },
      ],
      outcomes: { succeeded: "Drafted release notes for v4.18.0 (17 items)." },
    },
  ],
};
