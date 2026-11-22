import { StatusDot } from "@/components/ui/badge";
import { createRandom } from "@/demo/random";
import { cn } from "@/lib/cn";

type CellState = "idle" | "busy" | "approval" | "failed";

const cellClasses: Record<CellState, string> = {
  idle: "bg-accent/25",
  busy: "bg-accent-text animate-cell",
  approval: "bg-warning/90",
  failed: "bg-danger/90",
};

/** One square per agent: most idle or working, a few waiting on a person, a rare failure. */
export function FleetGrid({ cells = 900, className }: { cells?: number; className?: string }) {
  const random = createRandom(20261122);
  const items = Array.from({ length: cells }, () => {
    const roll = random.next();
    const state: CellState =
      roll < 0.006 ? "failed" : roll < 0.034 ? "approval" : roll < 0.42 ? "busy" : "idle";
    return { state, delay: random.float(0, 6), duration: random.float(4.5, 9) };
  });

  return (
    <div className={className}>
      <div
        aria-hidden="true"
        className="flex h-[150px] flex-wrap content-start gap-1 overflow-hidden mask-r-from-85% mask-l-from-85% sm:h-[178px]"
      >
        {items.map((cell, index) => (
          <span
            key={index}
            className={cn("size-2.5 rounded-[3px]", cellClasses[cell.state])}
            style={
              cell.state === "busy"
                ? {
                    animationDelay: `-${cell.delay.toFixed(2)}s`,
                    animationDuration: `${cell.duration.toFixed(2)}s`,
                  }
                : undefined
            }
          />
        ))}
      </div>
      <ul className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-fg-subtle">
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-accent-text" aria-hidden="true" /> working
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-accent/25" aria-hidden="true" /> idle
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-warning/90" aria-hidden="true" /> waiting for
          approval
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-[3px] bg-danger/90" aria-hidden="true" /> failed
        </li>
        <li className="ml-auto hidden items-center gap-2 sm:flex">
          <StatusDot tone="success" live /> illustrative fleet view
        </li>
      </ul>
    </div>
  );
}
