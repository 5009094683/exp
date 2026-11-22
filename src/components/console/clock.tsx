"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { formatAgo, formatTimestamp, minutesBefore } from "@/demo/format";

const ClockContext = createContext<number | null>(null);

const MINUTE_MS = 60_000;
let visitTime: number | undefined;

/** The minute this visit started. Read once so every view agrees on it. */
function getVisitTime(): number {
  visitTime ??= Math.floor(Date.now() / MINUTE_MS) * MINUTE_MS;
  return visitTime;
}

const subscribe = () => () => {};

/**
 * "Now" for the demo workspace. The prerendered HTML is anchored to the build
 * time so the server and the browser agree while the page hydrates; after
 * that the clock moves to the visitor's present. Sample data is defined
 * relative to the clock, so a site built months ago still shows today's dates.
 */
export function DemoClock({ builtAt, children }: { builtAt: number; children: ReactNode }) {
  const now = useSyncExternalStore(subscribe, getVisitTime, () => builtAt);
  return <ClockContext value={now}>{children}</ClockContext>;
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
