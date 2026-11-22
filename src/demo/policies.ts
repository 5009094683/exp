export type PolicyDecision = "allow" | "deny" | "approval";

export type Policy = {
  id: string;
  name: string;
  description: string;
  /** What the policy applies to, in plain words. */
  scope: string;
  mode: "enforce" | "monitor";
  version: number;
  author: string;
  updatedHoursAgo: number;
  evaluations24h: number;
  denied24h: number;
  approvals24h: number;
  /** Policy source as stored in version control. */
  source: string;
  /** Example requests for the policy tester, with the decision each one gets. */
  tests: Array<{ label: string; request: string; decision: PolicyDecision; rule: string }>;
};

export const policies: Policy[] = [
  {
    id: "least-privilege",
    name: "Default deny",
    description: "Agents can call only the tools they have been granted.",
    scope: "Workspace · all agents",
    mode: "enforce",
    version: 7,
    author: "Elena Rossi",
    updatedHoursAgo: 312,
    evaluations24h: 118420,
    denied24h: 37,
    approvals24h: 0,
    source: `id: least-privilege
description: Agents can call only the tools they have been granted.
mode: enforce
applies_to:
  agents: "*"
rules:
  - effect: allow
    when: tool in agent.granted_tools
  - effect: deny
    reason: Tool is not granted to this agent.
`,
    tests: [
      {
        label: "Support Triage reads a ticket",
        request: "support-triage → zendesk.get_ticket",
        decision: "allow",
        rule: "rules[0] · tool in agent.granted_tools",
      },
      {
        label: "Support Triage tries to refund a payment",
        request: "support-triage → stripe.create_refund",
        decision: "deny",
        rule: "rules[1] · Tool is not granted to this agent.",
      },
    ],
  },
  {
    id: "payments-over-1000",
    name: "Approve payments over $1,000",
    description: "Refunds and ledger entries above the threshold need a finance approver.",
    scope: "Tools · stripe.create_refund, internal-erp.post_journal_entry",
    mode: "enforce",
    version: 4,
    author: "Marcus Tan",
    updatedHoursAgo: 71,
    evaluations24h: 2148,
    denied24h: 3,
    approvals24h: 149,
    source: `id: payments-over-1000
description: Money movement above $1,000 needs a finance approver.
mode: enforce
applies_to:
  tools:
    - stripe.create_refund
    - internal-erp.post_journal_entry
rules:
  - effect: allow
    when: args.amount <= 1000
  - effect: require_approval
    when: args.amount > 1000
    approvers: ["group:finance-controllers"]
    timeout: 4h
    on_timeout: deny
`,
    tests: [
      {
        label: "Refund of $240.00",
        request: "payment-risk-screener → stripe.create_refund { amount: 240.00 }",
        decision: "allow",
        rule: "rules[0] · args.amount <= 1000",
      },
      {
        label: "Journal entry of $3,120.00",
        request: "invoice-reconciler → internal-erp.post_journal_entry { amount: 3120.00 }",
        decision: "approval",
        rule: "rules[1] · args.amount > 1000 → group:finance-controllers",
      },
    ],
  },
  {
    id: "production-changes",
    name: "Production changes need a human",
    description:
      "Rollbacks, merges and monitor changes in production wait for the on-call engineer.",
    scope: "Tools · github.rollback_deployment, github.merge_pull_request, datadog.mute_monitor",
    mode: "enforce",
    version: 9,
    author: "Priya Natarajan",
    updatedHoursAgo: 44,
    evaluations24h: 64,
    denied24h: 1,
    approvals24h: 12,
    source: `id: production-changes
description: Changes to production wait for the on-call engineer.
mode: enforce
applies_to:
  tools:
    - github.rollback_deployment
    - github.merge_pull_request
    - datadog.mute_monitor
rules:
  - effect: allow
    when: args.environment != "production"
  - effect: require_approval
    approvers: ["oncall:platform"]
    channel: slack
    timeout: 15m
    on_timeout: deny
`,
    tests: [
      {
        label: "Rollback in staging",
        request: 'incident-responder → github.rollback_deployment { environment: "staging" }',
        decision: "allow",
        rule: 'rules[0] · args.environment != "production"',
      },
      {
        label: "Rollback in production",
        request: 'incident-responder → github.rollback_deployment { environment: "production" }',
        decision: "approval",
        rule: "rules[1] → oncall:platform",
      },
    ],
  },
  {
    id: "no-pii-external",
    name: "No personal data to external tools",
    description:
      "Blocks calls that would send personal data to tools outside the company boundary.",
    scope: "Tools · web-research.*",
    mode: "enforce",
    version: 5,
    author: "Elena Rossi",
    updatedHoursAgo: 140,
    evaluations24h: 12830,
    denied24h: 58,
    approvals24h: 0,
    source: `id: no-pii-external
description: Never send personal data to tools outside the company boundary.
mode: enforce
applies_to:
  tools: ["web-research.*"]
rules:
  - effect: deny
    when: args contains pii(email, phone, national_id)
    reason: Personal data cannot leave the company boundary.
  - effect: allow
`,
    tests: [
      {
        label: "Search for a company name",
        request: 'lead-enrichment → web-research.search { query: "Northgate Logistics funding" }',
        decision: "allow",
        rule: "rules[1]",
      },
      {
        label: "Search for a personal email address",
        request: 'lead-enrichment → web-research.search { query: "d.osei@northgate.example" }',
        decision: "deny",
        rule: "rules[0] · args contains pii(email)",
      },
    ],
  },
  {
    id: "access-grants",
    name: "Access grants need the manager",
    description: "Group changes are approved by the requester's manager before they are applied.",
    scope: "Tools · identity-provider.add_to_group, identity-provider.remove_from_group",
    mode: "enforce",
    version: 3,
    author: "Elena Rossi",
    updatedHoursAgo: 30,
    evaluations24h: 286,
    denied24h: 9,
    approvals24h: 271,
    source: `id: access-grants
description: Group changes are approved by the requester's manager.
mode: enforce
applies_to:
  tools:
    - identity-provider.add_to_group
    - identity-provider.remove_from_group
rules:
  - effect: deny
    when: args.group.sensitivity == "restricted"
    reason: Restricted groups are granted through the access review process.
  - effect: require_approval
    approvers: ["manager_of:args.user"]
    channel: slack
    timeout: 24h
    on_timeout: deny
`,
    tests: [
      {
        label: "Add a user to billing-dashboard-readers",
        request: "access-concierge → identity-provider.add_to_group",
        decision: "approval",
        rule: "rules[1] → manager_of:args.user",
      },
      {
        label: "Add a user to prod-db-admins",
        request: "access-concierge → identity-provider.add_to_group",
        decision: "deny",
        rule: 'rules[0] · group.sensitivity == "restricted"',
      },
    ],
  },
  {
    id: "p1-replies",
    name: "Review replies on P1 tickets",
    description: "Customer-facing replies on urgent tickets are reviewed by a support lead.",
    scope: "Agent · support-triage",
    mode: "enforce",
    version: 6,
    author: "Dana Whitfield",
    updatedHoursAgo: 19,
    evaluations24h: 12840,
    denied24h: 0,
    approvals24h: 46,
    source: `id: p1-replies
description: A support lead reviews replies on urgent tickets.
mode: enforce
applies_to:
  agents: [support-triage]
  tools: [zendesk.add_comment]
rules:
  - effect: require_approval
    when: run.context.priority == "p1" and args.public == true
    approvers: ["group:support-leads"]
    channel: slack
    timeout: 30m
    on_timeout: escalate
  - effect: allow
`,
    tests: [
      {
        label: "Public reply on a P2 ticket",
        request: "support-triage → zendesk.add_comment { public: true }",
        decision: "allow",
        rule: "rules[1]",
      },
      {
        label: "Public reply on a P1 ticket",
        request: "support-triage → zendesk.add_comment { public: true }",
        decision: "approval",
        rule: 'rules[0] · priority == "p1" → group:support-leads',
      },
    ],
  },
  {
    id: "sandbox-egress",
    name: "Sandbox egress allowlist",
    description: "Sandboxes can reach package registries and nothing else unless a task allows it.",
    scope: "Sandboxes · all templates",
    mode: "enforce",
    version: 8,
    author: "Noah Lindqvist",
    updatedHoursAgo: 8,
    evaluations24h: 21406,
    denied24h: 214,
    approvals24h: 0,
    source: `id: sandbox-egress
description: Outbound network access from sandboxes is denied by default.
mode: enforce
applies_to:
  sandboxes: "*"
rules:
  - effect: allow
    when: request.host in ["registry.npmjs.org", "pypi.org", "files.pythonhosted.org"]
  - effect: allow
    when: request.host in task.egress_allowlist
  - effect: deny
    reason: Host is not on the egress allowlist.
`,
    tests: [
      {
        label: "Install a package from the registry",
        request: "sandbox → GET registry.npmjs.org",
        decision: "allow",
        rule: "rules[0]",
      },
      {
        label: "Upload to an unknown host",
        request: "sandbox → POST paste.example",
        decision: "deny",
        rule: "rules[2] · Host is not on the egress allowlist.",
      },
    ],
  },
  {
    id: "spend-guardrail",
    name: "Daily spend guardrail",
    description:
      "Flags agents that exceed their daily budget. Running in monitor mode before enforcement.",
    scope: "Workspace · all agents",
    mode: "monitor",
    version: 2,
    author: "Marcus Tan",
    updatedHoursAgo: 52,
    evaluations24h: 35818,
    denied24h: 0,
    approvals24h: 0,
    source: `id: spend-guardrail
description: Stop agents that exceed their daily budget.
mode: monitor   # logs what it would block; switch to enforce when ready
applies_to:
  agents: "*"
rules:
  - effect: deny
    when: agent.spend_today > agent.daily_budget
    reason: Daily budget exceeded.
  - effect: allow
`,
    tests: [
      {
        label: "Agent within budget",
        request: "support-triage · $412.60 of $600.00",
        decision: "allow",
        rule: "rules[1]",
      },
      {
        label: "Agent over budget",
        request: "code-review · $268.90 of $250.00",
        decision: "deny",
        rule: "rules[0] · would deny (monitor mode)",
      },
    ],
  },
];

export function getPolicy(id: string): Policy | undefined {
  return policies.find((policy) => policy.id === id);
}
