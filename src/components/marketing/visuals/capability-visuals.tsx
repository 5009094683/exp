import {
  Check,
  Database,
  Flag,
  Link2,
  Lock,
  Plug,
  ShieldX,
  Sparkles,
  UserCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { DecisionBadge } from "@/components/product/status";
import { VisualPanel } from "@/components/product/window";
import { Badge, StatusDot } from "@/components/ui/badge";
import type { CapabilitySlug } from "@/content/capabilities";
import { servers, type McpTool, type ToolPermission } from "@/demo/integrations";
import type { PolicyDecision } from "@/demo/policies";
import { showcaseRun } from "@/demo/runs";
import { cn } from "@/lib/cn";

/* -------------------------------------------------------------------------
   Orchestration: a run fans out to tools, waits for a person, then acts.
   ------------------------------------------------------------------------- */

type FlowNode = {
  x: number;
  y: number;
  label: string;
  icon: LucideIcon;
  tone: "neutral" | "model" | "tool" | "approval" | "done";
};

const flowNodes: FlowNode[] = [
  { x: 8, y: 50, label: "Trigger", icon: Zap, tone: "neutral" },
  { x: 28, y: 50, label: "Plan", icon: Sparkles, tone: "model" },
  { x: 51, y: 18, label: "Search logs", icon: Plug, tone: "tool" },
  { x: 51, y: 50, label: "Query metrics", icon: Plug, tone: "tool" },
  { x: 51, y: 82, label: "List deploys", icon: Plug, tone: "tool" },
  { x: 74, y: 50, label: "Approve", icon: UserCheck, tone: "approval" },
  { x: 92, y: 50, label: "Act", icon: Flag, tone: "done" },
];

const flowEdges = [
  "M8 50 L28 50",
  "M28 50 C40 50 39 18 51 18",
  "M28 50 L51 50",
  "M28 50 C40 50 39 82 51 82",
  "M51 18 C63 18 62 50 74 50",
  "M51 50 L74 50",
  "M51 82 C63 82 62 50 74 50",
  "M74 50 L92 50",
];

const flowTones: Record<FlowNode["tone"], string> = {
  neutral: "border-line-strong text-fg-muted",
  model: "border-accent/50 text-accent-text",
  tool: "border-info/40 text-info",
  approval: "border-warning/50 text-warning",
  done: "border-success/40 text-success",
};

export function OrchestrationVisual({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-56 w-full", className)} aria-hidden="true">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
      >
        {flowEdges.map((path) => (
          <path
            key={path}
            d={path}
            fill="none"
            stroke="var(--line-strong)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {flowEdges.map((path, index) => (
          <path
            key={`flow-${path}`}
            d={path}
            fill="none"
            stroke="var(--accent-text)"
            strokeWidth="1.25"
            strokeDasharray="3 9"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="animate-dash opacity-80"
            style={{ animationDelay: `${index * -0.2}s` }}
          />
        ))}
      </svg>

      {flowNodes.map((node) => (
        <div
          key={node.label}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <span
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-xl border bg-surface-2 edge-highlight",
              flowTones[node.tone],
            )}
          >
            <node.icon className="size-4" />
          </span>
          <span className="absolute top-full mt-1.5 text-[10px] font-medium whitespace-nowrap text-fg-subtle">
            {node.label}
          </span>
        </div>
      ))}

      <span className="absolute top-[4%] left-[58%] rounded-full border border-line bg-surface px-1.5 py-px font-mono text-[9px] text-fg-subtle">
        retry ×3
      </span>
      <span className="absolute top-[72%] left-[74%] -translate-x-1/2 rounded-full border border-warning/30 bg-warning/10 px-1.5 py-px font-mono text-[9px] whitespace-nowrap text-warning">
        waits for a person
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------
   Permissions: three requests, three different decisions.
   ------------------------------------------------------------------------- */

const decisions: Array<{
  decision: PolicyDecision;
  agent: string;
  tool: string;
  detail: string;
  rule: string;
}> = [
  {
    decision: "allow",
    agent: "support-triage",
    tool: "zendesk.add_comment",
    detail: "priority p2",
    rule: "p1-replies",
  },
  {
    decision: "approval",
    agent: "invoice-reconciler",
    tool: "internal-erp.post_journal_entry",
    detail: "$43,090.55 > $1,000",
    rule: "payments-over-1000",
  },
  {
    decision: "deny",
    agent: "lead-enrichment",
    tool: "web-research.search",
    detail: "email address in query",
    rule: "no-pii-external",
  },
];

export function PermissionsVisual({ className }: { className?: string }) {
  return (
    <VisualPanel
      label="policy decisions"
      className={className}
      action={
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-fg-subtle">
          <StatusDot tone="success" live />
          enforcing
        </span>
      }
    >
      <ul className="divide-y divide-line">
        {decisions.map((item) => (
          <li key={item.tool} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-xs text-fg">
                <span className="text-fg-subtle">{item.agent} →</span> {item.tool}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-fg-subtle">
                {item.rule} · {item.detail}
              </p>
            </div>
            <DecisionBadge decision={item.decision} size="sm" />
          </li>
        ))}
      </ul>
    </VisualPanel>
  );
}

/* -------------------------------------------------------------------------
   MCP integrations: servers and what each tool is allowed to do.
   ------------------------------------------------------------------------- */

const permissionStyles: Record<ToolPermission, string> = {
  allow: "border-success/25 text-success",
  approval: "border-warning/30 text-warning",
  deny: "border-danger/30 text-danger line-through decoration-danger/50",
};

/** Up to four tools that between them show every permission level a server uses. */
function featuredTools(tools: McpTool[]): McpTool[] {
  const byPermission = (permission: ToolPermission) =>
    tools.filter((tool) => tool.permission === permission);
  const picked = [
    ...byPermission("allow").slice(0, 2),
    ...byPermission("approval").slice(0, 1),
    ...byPermission("deny").slice(0, 1),
  ];
  const rest = tools.filter((tool) => !picked.includes(tool));
  return [...picked, ...rest].slice(0, 4);
}

export function IntegrationsVisual({ className }: { className?: string }) {
  const featured = ["github", "stripe", "internal-erp"]
    .map((id) => servers.find((server) => server.id === id))
    .filter((server) => server !== undefined);

  return (
    <VisualPanel label="mcp servers" className={className}>
      <ul className="divide-y divide-line">
        {featured.map((server) => (
          <li key={server.id} className="px-3.5 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-6 items-center justify-center rounded-md border border-line bg-white/[0.04] font-mono text-[10px] font-semibold text-fg-muted">
                {server.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-[13px] font-medium text-fg">{server.name}</span>
              <span className="ml-auto truncate font-mono text-[10px] text-fg-subtle">
                {server.transport}
              </span>
            </div>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {featuredTools(server.tools).map((tool) => (
                <li
                  key={tool.name}
                  className={cn(
                    "rounded-md border bg-white/[0.02] px-1.5 py-0.5 font-mono text-[10px]",
                    permissionStyles[tool.permission],
                  )}
                >
                  {tool.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-4 border-t border-line px-3.5 py-2 font-mono text-[10px] text-fg-subtle">
        <span className="flex items-center gap-1.5">
          <StatusDot tone="success" /> allowed
        </span>
        <span className="flex items-center gap-1.5">
          <StatusDot tone="warning" /> needs approval
        </span>
        <span className="flex items-center gap-1.5">
          <StatusDot tone="danger" /> blocked
        </span>
      </div>
    </VisualPanel>
  );
}

/* -------------------------------------------------------------------------
   Memory: nested scopes, each with its own retention.
   ------------------------------------------------------------------------- */

const memoryScopes = [
  { name: "workspace", ttl: "no expiry", entry: "legal/playbook/msa · v2026.2" },
  { name: "tenant:northgate", ttl: "180 days", entry: "Exports over 50k rows run async" },
  { name: "agent:support-triage", ttl: "90 days", entry: "Tone: concise, no apologies loop" },
  { name: "run", ttl: "ends with run", entry: "ticket 48213 · draft v2" },
];

export function MemoryVisual({ className }: { className?: string }) {
  return (
    <VisualPanel
      label="memory scopes"
      className={className}
      action={<Database className="size-3.5 text-fg-subtle" aria-hidden="true" />}
    >
      <ul className="space-y-1.5 p-3">
        {memoryScopes.map((scope, index) => (
          <li
            key={scope.name}
            className="rounded-lg border border-line bg-white/[0.02] px-3 py-2"
            style={{ marginLeft: `${index * 10}px` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[11px] text-success">{scope.name}</span>
              <span className="shrink-0 font-mono text-[10px] text-fg-subtle">{scope.ttl}</span>
            </div>
            <p className="mt-1 truncate text-xs text-fg-muted">{scope.entry}</p>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 border-t border-line px-3.5 py-2 font-mono text-[10px] text-fg-subtle">
        <Lock className="size-3" aria-hidden="true" />2 fields redacted before write
      </div>
    </VisualPanel>
  );
}

/* -------------------------------------------------------------------------
   Sandboxed execution: a short-lived environment with a blocked request.
   ------------------------------------------------------------------------- */

export function SandboxVisual({ className }: { className?: string }) {
  return (
    <VisualPanel
      label="sandbox · node-ci"
      className={className}
      action={
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-fg-subtle">
          <StatusDot tone="success" live />
          41s
        </span>
      }
    >
      <pre className="overflow-x-auto p-3.5 font-mono text-[11px] leading-[1.75] text-fg-muted">
        <span className="text-fg-subtle">$</span> pnpm test --filter payments{"\n"}
        <span className="text-success"> ✓</span> refunds/create.test.ts{" "}
        <span className="text-fg-subtle">(14)</span>
        {"\n"}
        <span className="text-success"> ✓</span> webhooks/signature.test.ts{" "}
        <span className="text-fg-subtle">(9)</span>
        {"\n"}
        <span className="text-danger"> ✕ egress blocked</span> telemetry.vendor.example{"\n"}
        <span className="text-fg"> Tests 96 passed</span>{" "}
        <span className="text-fg-subtle">· exit 0</span>
      </pre>
      <div className="flex flex-wrap gap-1.5 border-t border-line px-3.5 py-2.5">
        {["4 vCPU", "8 GB", "20 min limit", "no credentials"].map((limit) => (
          <span
            key={limit}
            className="rounded-md border border-line bg-white/[0.02] px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle"
          >
            {limit}
          </span>
        ))}
      </div>
    </VisualPanel>
  );
}

/* -------------------------------------------------------------------------
   Audit logs: an append-only stream where each event links to the last.
   ------------------------------------------------------------------------- */

const auditRows: Array<{
  time: string;
  actor: string;
  action: string;
  resource: string;
  outcome: "ok" | "denied" | "approved";
  hash: string;
}> = [
  {
    time: "14:32:07.412",
    actor: "agent:incident-responder",
    action: "tool.call",
    resource: "github.rollback_deployment",
    outcome: "ok",
    hash: "a3f9…e21c",
  },
  {
    time: "14:31:58.036",
    actor: "user:priya.natarajan",
    action: "approval.grant",
    resource: `${showcaseRun.id.slice(0, 10)}…`,
    outcome: "approved",
    hash: "7c21…09bd",
  },
  {
    time: "14:29:26.901",
    actor: "agent:incident-responder",
    action: "policy.evaluate",
    resource: "production-changes",
    outcome: "ok",
    hash: "1e88…f4a0",
  },
  {
    time: "14:28:11.553",
    actor: "agent:lead-enrichment",
    action: "tool.call",
    resource: "web-research.search",
    outcome: "denied",
    hash: "d05b…77c3",
  },
  {
    time: "14:27:49.120",
    actor: "agent:support-triage",
    action: "memory.write",
    resource: "tenant:northgate",
    outcome: "ok",
    hash: "42aa…b6e9",
  },
];

const outcomeIcon = {
  ok: <Check className="size-3.5 text-success" aria-label="Succeeded" />,
  approved: <UserCheck className="size-3.5 text-warning" aria-label="Approved" />,
  denied: <ShieldX className="size-3.5 text-danger" aria-label="Denied" />,
};

export function AuditVisual({ className }: { className?: string }) {
  return (
    <VisualPanel
      label="audit log · append-only"
      className={className}
      action={
        <Badge tone="success" size="sm">
          <Link2 aria-hidden="true" />
          chain verified
        </Badge>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left font-mono text-[11px]">
          <thead className="text-fg-subtle">
            <tr className="border-b border-line">
              <th className="px-3.5 py-2 font-normal">Time (UTC)</th>
              <th className="px-3 py-2 font-normal">Actor</th>
              <th className="px-3 py-2 font-normal">Action</th>
              <th className="px-3 py-2 font-normal">Resource</th>
              <th className="px-3 py-2 font-normal">Hash</th>
              <th className="px-3.5 py-2 font-normal" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {auditRows.map((row) => (
              <tr key={row.hash}>
                <td className="px-3.5 py-2 whitespace-nowrap text-fg-subtle">{row.time}</td>
                <td className="px-3 py-2 whitespace-nowrap text-fg-muted">{row.actor}</td>
                <td className="px-3 py-2 whitespace-nowrap text-fg">{row.action}</td>
                <td className="px-3 py-2 whitespace-nowrap text-fg-muted">{row.resource}</td>
                <td className="px-3 py-2 whitespace-nowrap text-fg-subtle">{row.hash}</td>
                <td className="px-3.5 py-2">{outcomeIcon[row.outcome]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VisualPanel>
  );
}

export const capabilityVisuals: Record<CapabilitySlug, ComponentType<{ className?: string }>> = {
  orchestration: OrchestrationVisual,
  memory: MemoryVisual,
  integrations: IntegrationsVisual,
  permissions: PermissionsVisual,
  "audit-logs": AuditVisual,
  sandboxes: SandboxVisual,
};
