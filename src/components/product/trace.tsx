import { formatDuration } from "@/demo/format";
import type { Run, RunStep } from "@/demo/runs";
import { cn } from "@/lib/cn";
import { STEP_BAR, STEP_KINDS, StepStatusIcon } from "./status";

/**
 * Steps run one after another and range from milliseconds to minutes, so the
 * waterfall compresses time with a power scale: short steps stay visible next
 * to a long approval wait, while order and relative magnitude are kept.
 */
export function layoutWaterfall(steps: RunStep[]): Array<{ left: number; width: number }> {
  const weights = steps.map((step) =>
    step.status === "pending" ? 0 : Math.max(step.durationMs ** 0.3, 2.2),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  // Two decimals: browsers shorten longer values in inline styles, which would
  // make the hydrated markup differ from the prerendered HTML.
  const percent = (value: number) => Math.round((value / total) * 10_000) / 100;
  let cursor = 0;
  return weights.map((weight) => {
    const left = percent(cursor);
    cursor += weight;
    return { left, width: percent(weight) };
  });
}

/** Step-by-step trace of a run: what happened, in order, and how long each step took. */
export function TraceWaterfall({
  run,
  selectedId,
  onSelect,
  density = "comfortable",
  animate = false,
  className,
}: {
  run: Run;
  selectedId?: string;
  onSelect?: (step: RunStep) => void;
  density?: "comfortable" | "compact";
  /** Stagger rows in on first paint (marketing visuals). */
  animate?: boolean;
  className?: string;
}) {
  const layout = layoutWaterfall(run.steps);
  const compact = density === "compact";

  return (
    <ol className={cn("flex flex-col", className)}>
      {run.steps.map((step, index) => {
        const kind = STEP_KINDS[step.kind];
        const selected = step.id === selectedId;
        const pending = step.status === "pending";
        const failed = step.status === "error" || step.status === "denied";
        const bar = layout[index];

        const content = (
          <>
            <span
              className={cn(
                "inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-white/[0.03]",
                compact ? "size-6" : "size-7",
                pending ? "text-fg-faint" : kind.color,
              )}
            >
              <kind.icon className={compact ? "size-3" : "size-3.5"} aria-hidden="true" />
            </span>

            <span
              className={cn(
                "min-w-0 shrink-0",
                compact ? "w-[46%] sm:w-[38%]" : "w-[46%] md:w-[34%]",
              )}
            >
              <span
                className={cn(
                  "block truncate font-medium",
                  compact ? "text-xs" : "text-[13px]",
                  pending ? "text-fg-subtle" : "text-fg",
                )}
              >
                {step.title}
              </span>
              <span
                className={cn(
                  "block truncate font-mono text-fg-subtle",
                  compact ? "text-[10px]" : "text-[11px]",
                )}
              >
                {step.ref}
              </span>
            </span>

            <span className="relative hidden h-5 min-w-0 flex-1 sm:block" aria-hidden="true">
              <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
              {pending ? null : (
                <span
                  className={cn(
                    "absolute top-1/2 h-2 min-w-1 -translate-y-1/2 rounded-full",
                    failed ? "bg-danger" : STEP_BAR[step.kind],
                    step.status === "waiting" && "animate-pulse-dot",
                    step.status === "running" && "animate-pulse-dot",
                    animate && "origin-left animate-bar-grow",
                  )}
                  style={{
                    left: `${bar.left}%`,
                    width: `${bar.width}%`,
                    animationDelay: animate ? `${300 + index * 90}ms` : undefined,
                  }}
                />
              )}
            </span>

            <span
              className={cn(
                "ml-auto flex shrink-0 items-center justify-end gap-2 font-mono tabular-nums",
                compact ? "w-16 text-[10px]" : "w-20 text-[11px]",
                pending ? "text-fg-faint" : "text-fg-muted",
              )}
            >
              {pending ? "—" : formatDuration(step.durationMs)}
              <StepStatusIcon status={step.status} className={compact ? "size-3" : undefined} />
            </span>
          </>
        );

        const rowClasses = cn(
          "flex w-full items-center gap-3 text-left transition-colors",
          compact ? "px-3 py-1.5" : "px-4 py-2.5",
          selected && "bg-accent/[0.09]",
          onSelect && !selected && "hover:bg-white/[0.03]",
          animate && "animate-fade-in",
        );

        return (
          <li
            key={step.id}
            className={cn("border-b border-line last:border-b-0", selected && "relative")}
            style={animate ? { animationDelay: `${200 + index * 90}ms` } : undefined}
          >
            {selected ? (
              <span className="absolute inset-y-0 left-0 w-0.5 bg-accent-text" aria-hidden="true" />
            ) : null}
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(step)}
                aria-current={selected ? "step" : undefined}
                className={rowClasses}
              >
                {content}
              </button>
            ) : (
              <div className={rowClasses}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
