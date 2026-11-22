import {
  Activity,
  Bot,
  Box,
  ChartNoAxesColumn,
  Database,
  KeyRound,
  LayoutDashboard,
  Plug,
  ScrollText,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { DecisionBadge, RunStatusBadge } from "@/components/product/status";
import { TraceWaterfall } from "@/components/product/trace";
import { ProductWindow } from "@/components/product/window";
import { Code } from "@/components/ui/code-block";
import { formatCurrency, formatDuration, formatNumber } from "@/demo/format";
import { showcaseRun } from "@/demo/runs";
import { cn } from "@/lib/cn";

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Agents", icon: Bot },
  { label: "Runs", icon: Activity, active: true },
  { label: "Memory", icon: Database },
  { label: "Integrations", icon: Plug },
  { label: "Policies", icon: KeyRound },
  { label: "Audit log", icon: ScrollText },
  { label: "Sandboxes", icon: Box },
  { label: "Usage", icon: ChartNoAxesColumn },
];

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

/**
 * The hero visual: a real run from the demo workspace, drawn with the same
 * trace component the console uses.
 */
export function HeroConsole({ className }: { className?: string }) {
  const run = showcaseRun;
  const approval = run.steps.find((step) => step.kind === "approval");
  const action = run.steps.find((step) => step.ref === "github.rollback_deployment");

  return (
    <div className={cn("relative", className)}>
      <ProductWindow
        title={
          <>
            Runs&nbsp;/&nbsp;<span className="text-fg-muted">{run.id}</span>
          </>
        }
      >
        <div className="grid lg:grid-cols-[188px_minmax(0,1fr)_304px]">
          <aside
            className="hidden border-r border-line bg-black/20 p-3 lg:block"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-2.5 py-2">
              <LogoMark className="size-4" />
              <span className="truncate text-xs font-medium text-fg">Demo workspace</span>
            </div>
            <ul className="mt-3 space-y-0.5">
              {navigation.map((item) => (
                <li
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs",
                    item.active ? "bg-white/[0.07] text-fg" : "text-fg-subtle",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </li>
              ))}
            </ul>
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{run.agentName}</p>
                <p className="truncate font-mono text-[11px] text-fg-subtle">{run.trigger.label}</p>
              </div>
              <RunStatusBadge status={run.status} size="sm" className="ml-auto" />
              <dl className="flex w-full items-center gap-5 font-mono text-[11px] text-fg-subtle sm:w-auto">
                <div className="flex gap-1.5">
                  <dt>Duration</dt>
                  <dd className="text-fg-muted">{formatDuration(run.durationMs)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Tokens</dt>
                  <dd className="text-fg-muted">{formatNumber(run.tokens)}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Cost</dt>
                  <dd className="text-fg-muted">{formatCurrency(run.cost, 3)}</dd>
                </div>
              </dl>
            </div>
            <TraceWaterfall run={run} selectedId={approval?.id} density="compact" animate />
          </div>

          {approval?.approval && approval.policy ? (
            <aside className="hidden border-l border-line bg-black/20 p-4 lg:block">
              <p className="font-mono text-[10px] tracking-[0.14em] text-fg-subtle uppercase">
                Step {approval.index + 1} · Approval
              </p>
              <p className="mt-1.5 text-sm font-semibold text-fg">{approval.title}</p>

              <div className="mt-4 rounded-lg border border-line bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-fg-muted">{approval.policy.id}</span>
                  <DecisionBadge decision="approval" size="sm" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-fg-subtle">
                  {approval.policy.reason}
                </p>
              </div>

              <div className="mt-3 rounded-lg border border-line bg-white/[0.02] p-3">
                <p className="text-xs leading-relaxed text-fg-muted">
                  “{approval.approval.request}”
                </p>
                <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-success/15 font-mono text-[10px] font-medium text-success">
                    {initials(approval.approval.decidedBy ?? "")}
                  </span>
                  <p className="text-xs text-fg-muted">
                    <span className="font-medium text-fg">{approval.approval.decidedBy}</span>{" "}
                    approved in {approval.approval.channel}
                    <span className="block font-mono text-[10px] text-fg-subtle">
                      after {formatDuration(approval.durationMs)}
                    </span>
                  </p>
                </div>
              </div>

              {action?.input ? (
                <div className="mt-3 rounded-lg border border-line bg-white/[0.02] p-3">
                  <p className="font-mono text-[11px] text-fg-subtle">then → {action.ref}</p>
                  <Code
                    code={JSON.stringify(action.input, null, 2)}
                    language="json"
                    className="mt-2 text-[11px] leading-relaxed"
                  />
                </div>
              ) : null}
            </aside>
          ) : null}
        </div>
      </ProductWindow>
    </div>
  );
}
