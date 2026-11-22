import "server-only";

import {
  Boxes,
  Braces,
  ChartNoAxesColumn,
  Copy,
  Fingerprint,
  Gauge,
  GitBranch,
  Globe,
  Layers,
  Network,
  Receipt,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { FaqItem } from "@/components/marketing/faq";
import type { CapabilitySlug } from "./capabilities";
import type { SolutionSlug } from "./solutions";

export type SolutionPage = {
  headline: string;
  lede: string;
  metaDescription: string;
  /** The capability whose visual illustrates the page. */
  visual: CapabilitySlug;
  challenges: Array<{ title: string; body: string }>;
  outcomes: Array<{ icon: LucideIcon; title: string; body: string }>;
  /** Example agents, each linked to an agent in the demo console. */
  examples: Array<{ title: string; body: string; agent: string }>;
  /** The capabilities that matter most to this audience, with the reason. */
  capabilities: Array<{ slug: CapabilitySlug; why: string }>;
  buying: { title: string; body: string; points: string[] };
  faq: FaqItem[];
};

export const solutionPages: Record<SolutionSlug, SolutionPage> = {
  enterprise: {
    headline: "Roll out agents across the company without losing control",
    lede: "Give every team a paved road for building agents, and give security and platform teams one place to set policy, review access and see what is running.",
    metaDescription:
      "Agent infrastructure for enterprises: central policy, single sign-on, audit evidence and private connectivity for agents across every team.",
    visual: "permissions",
    challenges: [
      {
        title: "Every team builds its own stack",
        body: "Each pilot picks its own framework, credentials and logging, and none of it passes a security review twice.",
      },
      {
        title: "Access is granted by API key",
        body: "Agents get broad, long-lived keys because scoping them down is nobody's job.",
      },
      {
        title: "Nobody can answer the auditor",
        body: "When asked what an agent did with customer data last quarter, the answer is spread across five systems.",
      },
    ],
    outcomes: [
      {
        icon: ShieldCheck,
        title: "Central policy, local autonomy",
        body: "Platform teams set the rules once. Product teams build and ship agents within them.",
      },
      {
        icon: Fingerprint,
        title: "Identity you already manage",
        body: "Single sign-on, SCIM and role mapping from your identity provider.",
      },
      {
        icon: ScrollText,
        title: "Audit evidence on demand",
        body: "One log for every agent action, exportable to your SIEM.",
      },
      {
        icon: Network,
        title: "Private connectivity",
        body: "Reach internal systems through connectors in your own network.",
      },
      {
        icon: Globe,
        title: "Residency and deployment options",
        body: "Choose a region, or deploy in your own cloud on the Enterprise plan.",
      },
      {
        icon: Gauge,
        title: "Budgets and chargeback",
        body: "Usage and spend attributed to each team and agent.",
      },
    ],
    examples: [
      {
        title: "Incident response",
        body: "Investigates alerts, correlates recent deploys and proposes a rollback that the on-call engineer approves.",
        agent: "incident-responder",
      },
      {
        title: "Finance operations",
        body: "Matches invoices to purchase orders and posts ledger entries after a controller signs off.",
        agent: "invoice-reconciler",
      },
      {
        title: "IT access requests",
        body: "Handles access requests end to end, with the requester's manager approving each grant.",
        agent: "access-concierge",
      },
    ],
    capabilities: [
      { slug: "permissions", why: "One policy layer for every team's agents." },
      { slug: "audit-logs", why: "Evidence for security and compliance reviews." },
      { slug: "integrations", why: "Approved tools, with credentials held centrally." },
      { slug: "sandboxes", why: "Agent-written code that cannot reach production." },
    ],
    buying: {
      title: "How enterprises buy",
      body: "Start with a scoped pilot, then move to an annual license sized to your fleet, with deployment and support terms agreed up front.",
      points: [
        "Pilot with a small number of agents",
        "Security review and data processing agreement",
        "Annual license with volume pricing",
      ],
    },
    faq: [
      {
        question: "Can we deploy in our own cloud account?",
        answer:
          "Yes, on the Enterprise plan. Tell us which cloud and region you need when you request access.",
      },
      {
        question: "Which identity providers do you support?",
        answer:
          "Any provider that supports SAML 2.0 or OpenID Connect for sign-on and SCIM for provisioning.",
      },
      {
        question: "How do you support security reviews?",
        answer:
          "We share architecture and security documentation, complete questionnaires and walk your team through the controls. The security page shows where our compliance roadmap stands today.",
      },
    ],
  },

  saas: {
    headline: "Ship agent features in your product, on infrastructure built for tenants",
    lede: "Run an agent for every customer with isolated memory, credentials and limits. Meter what each tenant uses, and keep your own engineers focused on the product.",
    metaDescription:
      "Multi-tenant agent infrastructure for SaaS companies: tenant isolation, per-tenant metering, per-user delegation and an API-first platform.",
    visual: "memory",
    challenges: [
      {
        title: "Multi-tenancy is the hard part",
        body: "Keeping one customer's data, credentials and context away from another's takes more engineering than the agent itself.",
      },
      {
        title: "Costs are invisible until the invoice",
        body: "Without usage per tenant you cannot price the feature, or spot the account that is consuming your margin.",
      },
      {
        title: "Customers ask what the agent can do",
        body: "Enterprise buyers want permissions, logs and controls before they switch the feature on.",
      },
    ],
    outcomes: [
      {
        icon: Layers,
        title: "A tenant boundary by default",
        body: "Memory, credentials, limits and logs are separated for each of your customers.",
      },
      {
        icon: ChartNoAxesColumn,
        title: "Usage you can bill on",
        body: "Executions, tokens and sandbox time metered per tenant and available through the API.",
      },
      {
        icon: UserCheck,
        title: "Act as the end user",
        body: "Agents call tools with each user's own access, through per-user delegation.",
      },
      {
        icon: SlidersHorizontal,
        title: "Controls your customers can use",
        body: "Expose policies, approvals and audit logs to your customers' administrators.",
      },
      {
        icon: GitBranch,
        title: "Safe rollouts",
        body: "Ship a new agent version to a few tenants first, then widen.",
      },
      {
        icon: Braces,
        title: "API-first",
        body: "Everything in the console is available through the API, so the agent lives inside your product.",
      },
    ],
    examples: [
      {
        title: "In-product support agent",
        body: "Classifies each customer's tickets and drafts replies using that customer's own history.",
        agent: "support-triage",
      },
      {
        title: "Risk and fraud review",
        body: "Reviews flagged payments and recommends an action, with refunds above a limit approved by a person.",
        agent: "payment-risk-screener",
      },
      {
        title: "Account insights",
        body: "Summarizes usage, tickets and CRM notes into a health view for every account.",
        agent: "renewal-forecaster",
      },
    ],
    capabilities: [
      { slug: "memory", why: "Context that is isolated for each tenant." },
      { slug: "orchestration", why: "Limits and rollouts per tenant." },
      { slug: "permissions", why: "Controls you can pass on to customers." },
      { slug: "integrations", why: "Each user's own access to their tools." },
    ],
    buying: {
      title: "How SaaS companies buy",
      body: "Pay per agent with executions included, plus metered usage beyond that. Per-tenant metering lets you carry usage through to your own pricing.",
      points: [
        "Per-agent pricing with included executions",
        "Usage metered per tenant",
        "Volume pricing as your customer base grows",
      ],
    },
    faq: [
      {
        question: "How is tenant data isolated?",
        answer:
          "Each tenant has its own memory scope, credential set and limits, and every run is tagged with the tenant it belongs to. Policies can refer to the tenant, so a rule cannot cross the boundary by accident.",
      },
      {
        question: "Can we keep our own brand in front of customers?",
        answer:
          "Yes. The platform is API-first, so your customers interact with your product. Approval prompts and admin controls can be embedded through the API.",
      },
      {
        question: "How do we attribute cost to customers?",
        answer:
          "Usage is metered per tenant and per agent: executions, tokens and sandbox time. Read it from the usage API or export it on a schedule.",
      },
    ],
  },

  agencies: {
    headline: "Run every client's agents from one place, with clean separation",
    lede: "Build an agent once, deploy it for each client in its own workspace, and show every client exactly what their agents did and what it cost.",
    metaDescription:
      "Agent infrastructure for automation agencies: a workspace per client, reusable templates, client approvals and usage reports.",
    visual: "integrations",
    challenges: [
      {
        title: "Each client is a custom project",
        body: "Different credentials, tools and rules for every client turn each deployment into one-off work.",
      },
      {
        title: "Clients want proof, not promises",
        body: "They ask what the automation did with their systems and data, and screenshots do not satisfy a security team.",
      },
      {
        title: "Margins disappear into usage",
        body: "Without usage by client, fixed-price retainers quietly lose money.",
      },
    ],
    outcomes: [
      {
        icon: Boxes,
        title: "A workspace per client",
        body: "Separate credentials, memory, policies and logs for every client.",
      },
      {
        icon: Copy,
        title: "Templates you reuse",
        body: "Package an agent with its policies once, then deploy it for the next client without starting over.",
      },
      {
        icon: Receipt,
        title: "Usage reports per client",
        body: "Executions, model usage and sandbox time broken down by client and agent.",
      },
      {
        icon: UserCheck,
        title: "Client approvals",
        body: "Route high-risk actions to an approver on the client's side.",
      },
      {
        icon: ScrollText,
        title: "A record you can hand over",
        body: "Give clients read access to their own audit log, or export it for them.",
      },
      {
        icon: Users,
        title: "Access for your team",
        body: "Role-based access for your builders across client workspaces.",
      },
    ],
    examples: [
      {
        title: "Lead operations",
        body: "Researches new leads, scores fit and routes them, without sending personal data to outside tools.",
        agent: "lead-enrichment",
      },
      {
        title: "Data quality monitoring",
        body: "Checks warehouse tables for freshness and anomalies and opens tickets with the evidence.",
        agent: "data-quality-monitor",
      },
      {
        title: "Contract review",
        body: "Extracts key clauses from contracts and flags deviations from the client's playbook.",
        agent: "contract-analyst",
      },
    ],
    capabilities: [
      { slug: "integrations", why: "Each client's tools, connected the same way." },
      { slug: "permissions", why: "Client-side approvals for sensitive actions." },
      { slug: "audit-logs", why: "A record clients can inspect themselves." },
      { slug: "orchestration", why: "Templates promoted from client to client." },
    ],
    buying: {
      title: "How agencies buy",
      body: "Per-agent pricing across your client workspaces, with usage reported per client so you can bill it on or build it into a retainer.",
      points: [
        "One account, many client workspaces",
        "Usage reported per client",
        "Volume pricing across your portfolio",
      ],
    },
    faq: [
      {
        question: "Can clients sign in to see their own agents?",
        answer: "Yes. Invite client users to their workspace with read-only or approver roles.",
      },
      {
        question: "Can we reuse an agent for another client?",
        answer:
          "Agents, integrations and policies are files. Promote them between workspaces and adjust what is specific to each client.",
      },
      {
        question: "Who owns the client's data?",
        answer:
          "Each client workspace is isolated. Its data stays in that workspace and can be exported or deleted when an engagement ends.",
      },
    ],
  },
};
