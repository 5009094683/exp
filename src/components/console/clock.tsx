"use client";

import { createContext, useContext, type ReactNode } from "react";
import { formatAgo, formatTimestamp, minutesBefore } from "@/demo/format";

const ClockContext = createContext<number | null>(null);

/**
 * Fixes "now" for the demo workspace to the moment the site was built, so the
 * prerendered HTML and the browser agree on every relative time.
 */
export function DemoClock({ now, children }: { now: number; children: ReactNode }) {
  return <ClockContext.Provider value={now}>{children}</ClockContext.Provider>;
}

export function useNow(): number {
  const now = useContext(ClockContext);
  if (now === null) throw new Error("useNow must be used inside <DemoClock>.");
  return now;
}

/** "4m ago", with the exact UTC time on hover. */
export function TimeAgo({ minutes, className }: { minutes: number; className?: string }) {
  const now = useNow();
  const date = minutesBefore(now, minutes);
  return (
    <time dateTime={date.toISOString()} title={formatTimestamp(date)} className={className}>
      {formatAgo(minutes)}
    </time>
  );
}

/** Exact UTC timestamp for a moment `minutes` before the demo clock. */
export function Timestamp({ minutes, className }: { minutes: number; className?: string }) {
  const now = useNow();
  const date = minutesBefore(now, minutes);
  return (
    <time dateTime={date.toISOString()} className={className}>
      {formatTimestamp(date)}
    </time>
  );
}
