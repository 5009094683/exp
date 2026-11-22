"use client";

import { CalendarClock, CircleCheck, Lock } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useSite } from "@/components/site-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EARLY_ACCESS_STORAGE_KEY } from "@/lib/leads/storage";
import { useReturnFocus } from "@/lib/use-return-focus";
import { useStoredValue } from "@/lib/use-stored-value";
import { GATES, type GateId } from "./gates";
import { LeadForm } from "./lead-form";

type OpenOptions = {
  /** Where the request started, recorded with the submission. */
  source: string;
  /** Set when a demo-console action triggered the dialog. */
  gate?: GateId;
};

type EarlyAccessContextValue = { open: (options: OpenOptions) => void };

const EarlyAccessContext = createContext<EarlyAccessContextValue | null>(null);

/** Returns `null` outside the provider; callers then fall back to the form page. */
export function useEarlyAccess(): EarlyAccessContextValue | null {
  return useContext(EarlyAccessContext);
}

function Received({ email, onAgain }: { email: string; onAgain: () => void }) {
  const site = useSite();

  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
        <CircleCheck className="size-6" aria-hidden="true" />
      </span>
      <DialogTitle className="mt-5 text-xl">Request received</DialogTitle>
      <DialogDescription className="mt-2 max-w-sm">
        Thanks for your interest in {site.product.name}. We&apos;ll follow up at{" "}
        <span className="font-medium text-fg">{email}</span> with next steps.
      </DialogDescription>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
        {site.links.booking ? (
          <Button asChild>
            <a href={site.links.booking} target="_blank" rel="noreferrer">
              <CalendarClock aria-hidden="true" />
              Book an intro call
            </a>
          </Button>
        ) : null}
        <DialogClose asChild>
          <Button variant="secondary">Done</Button>
        </DialogClose>
      </div>
      <button
        type="button"
        onClick={onAgain}
        className="mt-5 text-xs text-fg-subtle underline underline-offset-4 transition-colors hover:text-fg"
      >
        Send another request
      </button>
    </div>
  );
}

export function EarlyAccessProvider({ children }: { children: ReactNode }) {
  const site = useSite();
  const [state, setState] = useState<{ open: boolean; attempt: number } & OpenOptions>({
    open: false,
    attempt: 0,
    source: "unknown",
  });
  const [requestedEmail, setRequestedEmail] = useStoredValue(EARLY_ACCESS_STORAGE_KEY);

  const { remember, restore } = useReturnFocus();

  const open = useCallback(
    (options: OpenOptions) => {
      remember();
      // A new `attempt` remounts the form, which restarts its fill timer.
      setState((current) => ({ ...options, open: true, attempt: current.attempt + 1 }));
    },
    [remember],
  );

  const value = useMemo(() => ({ open }), [open]);
  const gate = state.gate ? GATES[state.gate] : null;

  return (
    <EarlyAccessContext.Provider value={value}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(next) => setState((current) => ({ ...current, open: next }))}
      >
        <DialogContent className="max-w-xl sm:p-8" onCloseAutoFocus={restore}>
          {requestedEmail ? (
            <Received email={requestedEmail} onAgain={() => setRequestedEmail(null)} />
          ) : (
            <>
              <DialogHeader>
                {gate ? (
                  <Badge tone="accent" className="mb-2 w-fit">
                    <Lock aria-hidden="true" />
                    Early access
                  </Badge>
                ) : null}
                <DialogTitle className="text-xl">
                  {gate
                    ? gate.title.replace("{product}", site.product.name)
                    : "Request early access"}
                </DialogTitle>
                <DialogDescription>
                  {gate
                    ? gate.description
                    : `Tell us about your team and what you want to build with ${site.product.name}. We'll follow up by email.`}
                </DialogDescription>
              </DialogHeader>
              <LeadForm
                key={state.attempt}
                variant="early-access-short"
                source={state.source}
                onSuccess={(fields) => setRequestedEmail(fields.email)}
                className="mt-6"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </EarlyAccessContext.Provider>
  );
}
