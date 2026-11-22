import "server-only";

import {
  Activity,
  Box,
  Building2,
  CalendarClock,
  Cpu,
  Eye,
  EyeOff,
  FileCode,
  Fingerprint,
  Gauge,
  GitBranch,
  Globe,
  History,
  KeyRound,
  Layers,
  Link2,
  ListChecks,
  Lock,
  Network,
  Package,
  Plug,
  ScrollText,
  Search,
  Send,
  ShieldCheck,
  SquareTerminal,
  Timer,
  UserCheck,
  Waypoints,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { FaqItem } from "@/components/marketing/faq";
import { buildTime } from "@/config/build";
import { site } from "@/config/site";
import type { AppRoute } from "@/lib/routes";
import type { CapabilitySlug } from "./capabilities";
import {
  auditEventSample,
  integrationManifest,
  memoryManifest,
  policyManifest,
  sandboxManifest,
  workflowManifest,
  type CodeSample,
} from "./samples";

export type CapabilityPage = {
  headline: string;
  lede: string;
  metaDescription: string;
  /** Three short claims shown under the hero. */
  highlights: [string, string, string];
  features: Array<{ icon: LucideIcon; title: string; body: string }>;
  sections: Array<{ title: string; body: string; points: string[] }>;
  sample: CodeSample;
  sampleCaption: string;
  /** Where this capability can be seen in the demo console. */
  consoleHref: AppRoute;
  consoleLabel: string;
  faq: FaqItem[];
};

const product = site.product.name;

export const capabilityPages: Record<CapabilitySlug, CapabilityPage> = {
  orchestration: {
    headline: "Orchestrate thousands of agents like one system",
    lede: "Every agent runs as a durable workflow. Steps are checkpointed, failures retry from where they stopped, and people are brought in only when a decision needs them.",
    metaDescription:
      "Durable workflows, triggers, retries and human approval steps for fleets of autonomous AI agents.",
    highlights: [
      "Durable, resumable runs",
      "Schedules, webhooks and events",
      "Human approval steps",
    ],
    features: [
      {
        icon: History,
        title: "Durable execution",
        body: "Each step is checkpointed. If a model call times out or a worker restarts, the run resumes from the last completed step.",
      },
      {
        icon: Zap,
        title: "Triggers for everything",
        body: "Start runs from a schedule, a webhook, an event stream, an API call or another agent.",
      },
      {
        icon: Waypoints,
        title: "Agent-to-agent handoffs",
        body: "Agents call other agents as tools. Parent and child runs share one trace.",
      },
      {
        icon: UserCheck,
        title: "Human in the loop",
        body: "Pause at an approval step and route it to the right person in chat, by email or in the console.",
      },
      {
        icon: Gauge,
        title: "Concurrency and rate limits",
        body: "Set limits per agent, tool or tenant so a burst of work never overwhelms a downstream system.",
      },
      {
        icon: GitBranch,
        title: "Versioned rollouts",
        body: "Every change is a new version. Shift traffic gradually and roll back in one step.",
      },
    ],
    sections: [
      {
        title: "Built for long-running work",
        body: "Real tasks take minutes or days, not milliseconds. Runs survive deploys and provider outages, and wait as long as an approval takes without holding compute.",
        points: [
          "Checkpoint after every step",
          "Retries with backoff and per-step timeouts",
          "Resume, replay or cancel any run",
        ],
      },
      {
        title: "One trace for every run",
        body: "The plan, model calls, tool calls, policy decisions and outputs sit on one timeline, so you can see which step, input and version produced a result.",
        points: [
          "Inputs and outputs for each step",
          "Tokens, cost and latency per step",
          "Replay a run against a new version before shipping",
        ],
      },
      {
        title: "Operate agents like services",
        body: "Environments, quotas and progressive delivery apply to agents the same way they apply to the rest of your stack.",
        points: [
          "Separate staging and production",
          "Per-tenant concurrency and spend limits",
          "Canary a new version on a share of traffic",
        ],
      },
    ],
    sample: workflowManifest,
    sampleCaption: "A workflow with parallel tool calls, retries and an approval step.",
    consoleHref: "/console/runs",
    consoleLabel: "See runs in the demo console",
    faq: [
      {
        question: "How long can a run wait?",
        answer:
          "As long as you configure. A paused run holds no compute; its state is stored, and it continues when the approval or event arrives.",
      },
      {
        question: "Can agents call other agents?",
        answer:
          "Yes. An agent can be exposed to other agents as a tool. Child runs inherit the caller's permissions unless a policy narrows them.",
      },
      {
        question: "What happens when a step fails?",
        answer:
          "The step is retried with the backoff you set. If it still fails, the run stops at that step with its state intact, so you can fix the cause and resume instead of starting over.",
      },
    ],
  },

  memory: {
    headline: "Memory agents can use and you can govern",
    lede: "Give agents context that lasts beyond one run: facts, preferences and past work. Every entry has a scope, a source and an expiry, and can be removed on request.",
    metaDescription:
      "Scoped, governed memory for AI agents with retention, redaction, provenance and tenant isolation.",
    highlights: [
      "Run, agent, tenant and workspace scopes",
      "Retention and redaction rules",
      "Every read and write audited",
    ],
    features: [
      {
        icon: Layers,
        title: "Scoped by design",
        body: "Memory lives in a scope: one run, an agent, a user, a tenant or the whole workspace. Agents read only the scopes they are granted.",
      },
      {
        icon: Search,
        title: "Recall by key or by meaning",
        body: "Store structured records or embedded text. Retrieve by key, by filter or by semantic similarity.",
      },
      {
        icon: Link2,
        title: "Provenance on every entry",
        body: "Each entry records the run that wrote it, its source and the time, so an answer can be traced back.",
      },
      {
        icon: Timer,
        title: "Retention and expiry",
        body: "Set a time-to-live per scope. Entries expire on their own and can be purged for a user or tenant in one call.",
      },
      {
        icon: EyeOff,
        title: "Redaction before write",
        body: "Detect personal and payment data before it is stored. Redact it, hash it or block the write, by policy.",
      },
      {
        icon: Building2,
        title: "Tenant isolation",
        body: "Each customer's memory is stored and encrypted separately, so one tenant's context never appears in another's run.",
      },
    ],
    sections: [
      {
        title: "Context that outlives the run",
        body: "Agents stop asking the same questions. What one run learns, the next can use, within the scope you allow.",
        points: [
          "Customer context for support and success agents",
          "Shared playbooks for the whole workspace",
          "Working notes that end with the run",
        ],
      },
      {
        title: "Forget on purpose",
        body: "Memory that cannot be deleted is a liability. Retention is part of the scope, and deletion requests have one place to go.",
        points: [
          "Time-to-live per scope",
          "Purge by user, tenant or key",
          "Deletions recorded in the audit log",
        ],
      },
      {
        title: "See what an agent knew",
        body: "When an answer looks wrong, inspect the memory that was read during that run and where each entry came from.",
        points: [
          "Memory reads listed in the run trace",
          "Source run and timestamp for each entry",
          "Edit or remove an entry from the console",
        ],
      },
    ],
    sample: memoryManifest,
    sampleCaption: "Scopes with their own keys, retention and redaction rules.",
    consoleHref: "/console/memory",
    consoleLabel: "See memory in the demo console",
    faq: [
      {
        question: "Where is memory stored?",
        answer:
          "In the region you choose for your workspace, encrypted at rest. On the Enterprise plan it can live in your own cloud account.",
      },
      {
        question: "Is memory used to train models?",
        answer:
          "No. Memory belongs to your workspace and is only read by the agents you grant it to.",
      },
      {
        question: "Can a user ask for their data to be deleted?",
        answer:
          "Yes. Purge everything stored for a user or tenant with one call. The purge itself is recorded in the audit log.",
      },
    ],
  },

  integrations: {
    headline: "Connect every tool through one governed gateway",
    lede: `${product} speaks the Model Context Protocol. Register a server once, then decide which agents can call which tools, with whose credentials and under what conditions.`,
    metaDescription:
      "An MCP gateway for AI agents: connect any MCP server, set per-tool permissions and keep credentials out of the model's context.",
    highlights: [
      "Any MCP server, hosted or private",
      "Per-tool permissions",
      "Credentials never reach the model",
    ],
    features: [
      {
        icon: Plug,
        title: "MCP-native",
        body: "Connect remote MCP servers over HTTP, or run private servers inside your network. No custom adapters to maintain.",
      },
      {
        icon: ListChecks,
        title: "Tool-level allowlists",
        body: "Expose only the tools an agent needs. Mark each one as allowed, approval required or blocked.",
      },
      {
        icon: KeyRound,
        title: "Credential vault",
        body: "OAuth tokens and API keys are stored encrypted and attached at call time. Prompts and model outputs never contain them.",
      },
      {
        icon: UserCheck,
        title: "Per-user delegation",
        body: "Agents can act with the end user's own access, so they see only what that person is allowed to see.",
      },
      {
        icon: Activity,
        title: "Health and usage",
        body: "Track call volume, latency and error rates for each server and tool, and get alerted when one degrades.",
      },
      {
        icon: Network,
        title: "Private connectivity",
        body: "Reach internal systems through a connector you deploy in your own network, with no inbound firewall rules.",
      },
    ],
    sections: [
      {
        title: "One registry for the whole company",
        body: "Teams stop wiring the same integration five different ways. Platform owners register a server once, and every agent uses it through the same gateway.",
        points: [
          "A catalog of approved servers",
          "Credentials managed in one place",
          "Usage attributed to each agent and team",
        ],
      },
      {
        title: "Least privilege at the tool level",
        body: "Access is granted per tool, not per system. An agent that reads tickets does not automatically get to delete them.",
        points: [
          "Allow, require approval or deny for each tool",
          "Narrow access further for each agent",
          "Unlisted tools are denied by default",
        ],
      },
      {
        title: "Bring your own servers",
        body: "If a system has no public MCP server, run your own. Private servers are reached through an outbound-only connector.",
        points: [
          "Outbound-only connector in your network",
          "Mutual TLS between connector and platform",
          "The same policies and audit trail as hosted servers",
        ],
      },
    ],
    sample: integrationManifest,
    sampleCaption: "Per-tool permissions for a connected server.",
    consoleHref: "/console/integrations",
    consoleLabel: "See integrations in the demo console",
    faq: [
      {
        question: "What is MCP?",
        answer:
          "The Model Context Protocol is an open standard for connecting AI applications to tools and data. A server exposes tools, and clients such as agents call them.",
      },
      {
        question: "Do you host MCP servers for us?",
        answer:
          "You connect servers hosted by a vendor or by you. For internal systems, a connector in your network links private servers to the platform.",
      },
      {
        question: "Can an agent see our credentials?",
        answer:
          "No. Credentials are held in a vault and attached to the outgoing call by the gateway. They are never placed in the model's context.",
      },
    ],
  },

  permissions: {
    headline: "Least privilege for every agent, on every action",
    lede: "Agents act on your behalf, so each action is checked before it happens. Policies decide what an agent may do, with which data, and when a person has to approve.",
    metaDescription:
      "A policy engine for AI agents: least-privilege access, approval workflows, monitor mode and spend guardrails, checked on every action.",
    highlights: [
      "Policy check before every tool call",
      "Approvals for high-risk actions",
      "Test policies before enforcing them",
    ],
    features: [
      {
        icon: FileCode,
        title: "Policy as code",
        body: "Write policies in a readable format, review them in pull requests and version them with your agents.",
      },
      {
        icon: ShieldCheck,
        title: "Checked in the execution path",
        body: "Each tool call, memory access and model request is evaluated before it runs, not reported afterwards.",
      },
      {
        icon: UserCheck,
        title: "Approval workflows",
        body: "Require a named person or group to approve specific actions, such as refunds above a limit.",
      },
      {
        icon: Fingerprint,
        title: "Roles and single sign-on",
        body: "Map groups from your identity provider to roles. Add and remove members through SCIM.",
      },
      {
        icon: Eye,
        title: "Monitor mode",
        body: "Run a new policy in monitor mode to see what it would block before you enforce it.",
      },
      {
        icon: Gauge,
        title: "Spend and rate guardrails",
        body: "Cap spend, tokens and call rates per agent or tenant, and stop runaway loops.",
      },
    ],
    sections: [
      {
        title: "Decisions you can explain",
        body: "Each decision records the rule that matched and the values it looked at, so “why was this allowed?” has a precise answer.",
        points: [
          "Matching rule stored with every decision",
          "Allow, deny and approval outcomes in the trace",
          "Search decisions by agent, tool or policy",
        ],
      },
      {
        title: "People where it matters",
        body: "Most actions should run on their own. A few should wait for someone who is accountable for the outcome.",
        points: [
          "Route to a person, a group or the on-call engineer",
          "Approve from chat, email or the console",
          "Timeouts that deny or escalate",
        ],
      },
      {
        title: "Change policy without fear",
        body: "Test a rule against real traffic before it takes effect, then roll it out like any other change.",
        points: [
          "Monitor mode shows would-be denials",
          "Test cases run with every change",
          "Version history with one-step rollback",
        ],
      },
    ],
    sample: policyManifest,
    sampleCaption: "A policy that requires approval above a threshold.",
    consoleHref: "/console/policies",
    consoleLabel: "See policies in the demo console",
    faq: [
      {
        question: "What can a policy look at?",
        answer:
          "The agent, the tool and its arguments, the run's context, the caller's identity and attributes such as amount, environment or data classification.",
      },
      {
        question: "What happens when nobody approves?",
        answer:
          "Each approval step has a timeout and an outcome for it: deny the action or escalate to another approver.",
      },
      {
        question: "Do policies apply to model calls too?",
        answer:
          "Yes. Policies can restrict which model profiles an agent uses and cap its token and spend budgets.",
      },
    ],
  },

  "audit-logs": {
    headline: "A complete record of what every agent did, and why",
    lede: "Every prompt, decision, tool call and data access is recorded with who or what started it. Logs are append-only, searchable and ready to export to your SIEM.",
    metaDescription:
      "Tamper-evident audit logs for AI agents: every model call, tool call, policy decision and approval, attributed and exportable.",
    highlights: ["Every action attributed", "Tamper-evident hash chain", "Export to your SIEM"],
    features: [
      {
        icon: ScrollText,
        title: "Complete coverage",
        body: "Model calls, tool calls, memory reads and writes, policy decisions, approvals and configuration changes are all recorded.",
      },
      {
        icon: Fingerprint,
        title: "Attribution",
        body: "Each event names the agent, its version, the run and the person or system that triggered it.",
      },
      {
        icon: Link2,
        title: "Tamper-evident",
        body: "Events are hash-chained, so a gap or a modification is detectable.",
      },
      {
        icon: Search,
        title: "Search and filter",
        body: "Find events by actor, action, resource, outcome or time.",
      },
      {
        icon: Send,
        title: "Streaming export",
        body: "Stream events to your SIEM or data lake, or export on demand as JSON or CSV.",
      },
      {
        icon: CalendarClock,
        title: "Retention controls",
        body: "Keep logs for as long as your policy requires, set for each workspace.",
      },
    ],
    sections: [
      {
        title: "Answer “what happened?” in minutes",
        body: "Start from a customer complaint, an alert or a line in a report and follow it to the exact run, step and decision.",
        points: [
          "From an event to its run trace in one click",
          "Before and after values for configuration changes",
          "Filters you can save and share",
        ],
      },
      {
        title: "Evidence for audits",
        body: "Access reviews and change records come from the same log, so evidence is collected once and stays consistent.",
        points: [
          "Who approved what, and when",
          "Policy changes with author and diff",
          "Exports scoped to a period or a system",
        ],
      },
      {
        title: "Works with the tools you have",
        body: "Audit data is most useful next to the rest of your security telemetry.",
        points: [
          "Stream as JSON over HTTPS",
          "Deliver batches to object storage",
          "A stable, documented event schema",
        ],
      },
    ],
    sample: auditEventSample(new Date(buildTime)),
    sampleCaption: "One event: who approved a production change, and under which policy.",
    consoleHref: "/console/audit",
    consoleLabel: "See the audit log in the demo console",
    faq: [
      {
        question: "Can audit events be changed or deleted?",
        answer:
          "No. The log is append-only and each event includes the hash of the one before it, so tampering is detectable. Events leave the log only when their retention period ends.",
      },
      {
        question: "Are prompts and outputs logged?",
        answer:
          "Yes, by default. You can redact fields or switch off content capture for specific agents while keeping the metadata.",
      },
      {
        question: "How long are logs kept?",
        answer:
          "Retention depends on your plan and can be extended. Streaming export lets you keep your own copy for as long as you need.",
      },
    ],
  },

  sandboxes: {
    headline: "Let agents run code without trusting the code",
    lede: "When an agent writes and runs code, it runs in an isolated sandbox with no ambient credentials, a restricted network and hard resource limits. When the task ends, the sandbox is destroyed.",
    metaDescription:
      "Sandboxed code execution for AI agents: isolated per run, no ambient credentials, egress allowlists and hard resource limits.",
    highlights: [
      "Isolated for each run",
      "Network egress allowlists",
      "CPU, memory and time limits",
    ],
    features: [
      {
        icon: Box,
        title: "Isolation per run",
        body: "Each execution gets its own short-lived sandbox with a separate filesystem and process space.",
      },
      {
        icon: Lock,
        title: "No ambient access",
        body: "Sandboxes start with no credentials and no network. Access is granted explicitly, for each task.",
      },
      {
        icon: Globe,
        title: "Egress control",
        body: "Allow outbound traffic only to the hosts a task needs. Everything else is blocked and logged.",
      },
      {
        icon: Cpu,
        title: "Resource limits",
        body: "Set CPU, memory, disk and time limits. Runaway processes are stopped automatically.",
      },
      {
        icon: Package,
        title: "Reproducible environments",
        body: "Define images with the runtimes and packages your agents need, pinned by digest.",
      },
      {
        icon: SquareTerminal,
        title: "Full capture",
        body: "Commands, output, file changes and network attempts are recorded in the run trace.",
      },
    ],
    sections: [
      {
        title: "Assume the code is hostile",
        body: "Model-written code can be wrong, and it can be steered by a malicious input. The sandbox is designed so that neither can reach anything that matters.",
        points: [
          "No credentials unless a task grants them",
          "Network denied by default",
          "Destroyed when the task ends",
        ],
      },
      {
        title: "Give agents real tools",
        body: "Data analysis, test suites and document processing need a real runtime, not a restricted expression evaluator.",
        points: [
          "Images with the packages you choose",
          "Mount files in and collect artifacts out",
          "Reuse a warm sandbox within a run",
        ],
      },
      {
        title: "Everything is on the record",
        body: "What ran, what it printed and what it tried to reach are part of the trace, next to the model call that asked for it.",
        points: [
          "Command and output for each execution",
          "Blocked network attempts listed",
          "Resource usage for each sandbox",
        ],
      },
    ],
    sample: sandboxManifest,
    sampleCaption: "A sandbox template with a pinned image, limits and an egress allowlist.",
    consoleHref: "/console/sandboxes",
    consoleLabel: "See sandboxes in the demo console",
    faq: [
      {
        question: "How are sandboxes isolated from each other?",
        answer:
          "Each sandbox is a separate, short-lived environment with its own filesystem, process space and network policy. Workloads from different runs never share a sandbox.",
      },
      {
        question: "Can a sandbox reach our internal systems?",
        answer:
          "Only if you allow it. Network access is denied by default and opened to specific hosts, for a template or for a single task.",
      },
      {
        question: "Which languages are supported?",
        answer:
          "Any runtime you can put in an image. Start from the provided Python and Node.js images or bring your own.",
      },
    ],
  },
};
