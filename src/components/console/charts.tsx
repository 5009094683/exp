import { cn } from "@/lib/cn";

/** Compact trend line with a soft fill. */
export function Sparkline({
  values,
  className,
  stroke = "var(--accent-text)",
}: {
  values: number[];
  className?: string;
  stroke?: string;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100;
    const y = 28 - ((value - min) / span) * 24 - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={cn("h-8 w-full overflow-visible", className)}
    >
      <polygon points={`0,28 ${points.join(" ")} 100,28`} fill={stroke} opacity="0.12" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export type BarDatum = {
  key: string;
  /** Shown under the bar when `showLabel` is set. */
  label: string;
  value: number;
  /** Portion of `value` drawn in the warning color, for example failed runs. */
  highlight?: number;
  /** Tooltip text. */
  title: string;
  showLabel?: boolean;
};

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Vertical bars with gridlines; each bar can carry a highlighted portion. */
export function BarChart({
  data,
  formatValue,
  height = 190,
  className,
}: {
  data: BarDatum[];
  formatValue: (value: number) => string;
  height?: number;
  className?: string;
}) {
  const top = niceCeil(Math.max(...data.map((datum) => datum.value)));
  const ticks = [1, 0.75, 0.5, 0.25, 0];

  return (
    <div className={className}>
      <div className="flex gap-3" style={{ height }}>
        <div
          className="flex flex-col justify-between py-0 text-right font-mono text-[10px] text-fg-faint"
          aria-hidden="true"
        >
          {ticks.map((tick) => (
            <span key={tick} className="leading-none">
              {formatValue(top * tick)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className="h-px w-full bg-line" />
            ))}
          </div>
          <ul className="relative flex h-full items-end gap-[3px]">
            {data.map((datum) => {
              const total = (datum.value / top) * 100;
              const highlight = datum.highlight ? (datum.highlight / datum.value) * 100 : 0;
              return (
                <li
                  key={datum.key}
                  title={datum.title}
                  className="group flex h-full min-w-0 flex-1 items-end"
                >
                  <span
                    className="flex w-full flex-col overflow-hidden rounded-t-[3px] bg-accent/70 transition-colors group-hover:bg-accent-text"
                    style={{ height: `${Math.max(total, 0.8)}%` }}
                  >
                    {highlight > 0 ? (
                      <span
                        className="w-full bg-danger/90"
                        style={{ height: `${Math.max(highlight, 2.5)}%` }}
                      />
                    ) : null}
                  </span>
                  <span className="sr-only">{datum.title}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="mt-2 flex gap-3" aria-hidden="true">
        <span className="invisible font-mono text-[10px]">{formatValue(top)}</span>
        <ul className="flex min-w-0 flex-1 gap-[3px]">
          {data.map((datum) => (
            <li key={datum.key} className="relative min-w-0 flex-1">
              {datum.showLabel ? (
                <span className="absolute left-1/2 -translate-x-1/2 font-mono text-[10px] whitespace-nowrap text-fg-faint">
                  {datum.label}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div className="h-4" aria-hidden="true" />
    </div>
  );
}

/** Ranked horizontal bars, for "top agents" style lists. */
export function BarList({
  items,
  formatValue,
}: {
  items: Array<{ key: string; label: React.ReactNode; value: number; hint?: string }>;
  formatValue: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="min-w-0 truncate text-fg">{item.label}</span>
            <span className="shrink-0 font-mono text-xs text-fg-muted tabular-nums">
              {formatValue(item.value)}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent-text/80"
              style={{ width: `${Math.max((item.value / max) * 100, 1.5)}%` }}
            />
          </div>
          {item.hint ? <p className="mt-1 text-[11px] text-fg-subtle">{item.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Thin bar split into proportional segments. Small non-zero segments get a
 * minimum width so rare outcomes, such as denials, stay visible.
 */
export function SegmentBar({
  segments,
}: {
  segments: Array<{ key: string; value: number; className: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const widths = segments.map((segment) =>
    segment.value > 0 ? Math.max((segment.value / total) * 100, 1.5) : 0,
  );
  const scale = 100 / (widths.reduce((sum, width) => sum + width, 0) || 1);

  return (
    <div className="flex h-2 gap-px overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
      {segments.map((segment, index) => (
        <span
          key={segment.key}
          className={segment.className}
          style={{ width: `${(widths[index] * scale).toFixed(2)}%` }}
        />
      ))}
    </div>
  );
}
