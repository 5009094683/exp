import {
  Ban,
  Box,
  Check,
  CircleCheck,
  CircleDashed,
  CirclePause,
  CircleX,
  Database,
  Flag,
  Hourglass,
  LoaderCircle,
  Plug,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Sparkles,
  UserCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { AgentStatus } from "@/demo/agents";
import type { PolicyDecision } from "@/demo/policies";
import { RUN_STATUS_LABELS, type RunStatus, type StepKind, type StepStatus } from "@/demo/runs";
import { cn } from "@/lib/cn";

type Tone = NonNullable<BadgeProps["tone"]>;

const RUN_STATUS: Record<RunStatus, { tone: Tone; icon: LucideIcon; spin?: boolean }> = {
  succeeded: { tone: "success", icon: CircleCheck },
  failed: { tone: "danger", icon: CircleX },
  running: { tone: "info", icon: LoaderCircle, spin: true },
  awaiting_approval: { tone: "warning", icon: Hourglass },
  blocked: { tone: "danger", icon: Ban },
  cancelled: { tone: "neutral", icon: CircleDashed },
};

export function RunStatusBadge({
  status,
  size,
  className,
}: {
  status: RunStatus;
  size?: BadgeProps["size"];
  className?: string;
}) {
  const { tone, icon: Icon, spin } = RUN_STATUS[status];
  return (
    <Badge tone={tone} size={size} className={className}>
      <Icon className={cn(spin && "animate-spin")} aria-hidden="true" />
      {RUN_STATUS_LABELS[status]}
    </Badge>
  );
}

const AGENT_STATUS: Record<AgentStatus, { tone: Tone; label: string; icon: LucideIcon }> = {
  active: { tone: "success", label: "Active", icon: CircleCheck },
  degraded: { tone: "warning", label: "Degraded", icon: ShieldAlert },
  paused: { tone: "neutral", label: "Paused", icon: CirclePause },
  draft: { tone: "neutral", label: "Draft", icon: CircleDashed },
};

export function AgentStatusBadge({
  status,
  size,
}: {
  status: AgentStatus;
  size?: BadgeProps["size"];
}) {
  const { tone, label, icon: Icon } = AGENT_STATUS[status];
  return (
    <Badge tone={tone} size={size}>
      <Icon aria-hidden="true" />
      {label}
    </Badge>
  );
}

const DECISIONS: Record<PolicyDecision, { tone: Tone; label: string; icon: LucideIcon }> = {
  allow: { tone: "success", label: "Allowed", icon: ShieldCheck },
  approval: { tone: "warning", label: "Approval required", icon: UserCheck },
  deny: { tone: "danger", label: "Denied", icon: ShieldX },
};

export function DecisionBadge({
  decision,
  size,
  label,
}: {
  decision: PolicyDecision;
  size?: BadgeProps["size"];
  label?: string;
}) {
  const { tone, label: defaultLabel, icon: Icon } = DECISIONS[decision];
  return (
    <Badge tone={tone} size={size}>
      <Icon aria-hidden="true" />
      {label ?? defaultLabel}
    </Badge>
  );
}

export const STEP_KINDS: Record<StepKind, { label: string; icon: LucideIcon; color: string }> = {
  trigger: { label: "Trigger", icon: Zap, color: "text-fg-muted" },
  model: { label: "Model", icon: Sparkles, color: "text-accent-text" },
  tool: { label: "Tool call", icon: Plug, color: "text-info" },
  memory: { label: "Memory", icon: Database, color: "text-success" },
  sandbox: { label: "Sandbox", icon: Box, color: "text-[#f0abfc]" },
  approval: { label: "Approval", icon: UserCheck, color: "text-warning" },
  output: { label: "Output", icon: Flag, color: "text-fg-muted" },
};

/** Bar color in the trace waterfall, by step kind. */
export const STEP_BAR: Record<StepKind, string> = {
  trigger: "bg-fg-subtle",
  model: "bg-accent-text",
  tool: "bg-info",
  memory: "bg-success",
  sandbox: "bg-[#f0abfc]",
  approval: "bg-warning",
  output: "bg-fg-subtle",
};

export function StepStatusIcon({ status, className }: { status: StepStatus; className?: string }) {
  const base = cn("size-3.5 shrink-0", className);
  switch (status) {
    case "ok":
      return <Check className={cn(base, "text-success")} aria-label="Completed" />;
    case "error":
      return <CircleX className={cn(base, "text-danger")} aria-label="Failed" />;
    case "denied":
      return <ShieldX className={cn(base, "text-danger")} aria-label="Denied by policy" />;
    case "waiting":
      return <Hourglass className={cn(base, "text-warning")} aria-label="Waiting for approval" />;
    case "running":
      return <LoaderCircle className={cn(base, "animate-spin text-info")} aria-label="Running" />;
    default:
      return <CircleDashed className={cn(base, "text-fg-faint")} aria-label="Not started" />;
  }
}
