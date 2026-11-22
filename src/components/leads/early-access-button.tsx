"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useEarlyAccess } from "./early-access-provider";
import type { GateId } from "./gates";

type TriggerProps = Omit<ButtonProps, "asChild" | "children" | "onClick"> & {
  /** Where the request started, recorded with the submission. */
  source: string;
  children?: ReactNode;
};

/**
 * Primary call to action. Opens the early-access dialog; without JavaScript,
 * or on a modified click, it is a normal link to the early-access page.
 */
export function EarlyAccessButton({
  source,
  children = "Request early access",
  ...props
}: TriggerProps) {
  const earlyAccess = useEarlyAccess();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    if (!earlyAccess || modified || event.button !== 0) return;
    event.preventDefault();
    earlyAccess.open({ source });
  }

  return (
    <Button asChild {...props}>
      <Link href={{ pathname: "/early-access", query: { source } }} onClick={handleClick}>
        {children}
      </Link>
    </Button>
  );
}

/**
 * A demo-console action that needs a real workspace. It looks and behaves like
 * the real button, then explains early access instead of committing a change.
 */
export function GateButton({
  gate,
  source,
  children,
  ...props
}: Omit<TriggerProps, "source"> & { gate: GateId; source?: string }) {
  const earlyAccess = useEarlyAccess();

  return (
    <Button
      {...props}
      onClick={() => earlyAccess?.open({ source: source ?? `console:${gate}`, gate })}
    >
      {children}
    </Button>
  );
}

/** Hook form of `GateButton` for menu items and other custom triggers. */
export function useGate(): (gate: GateId, source?: string) => void {
  const earlyAccess = useEarlyAccess();
  return (gate, source) => earlyAccess?.open({ source: source ?? `console:${gate}`, gate });
}
