"use client";

import { CalendarClock, CircleCheck } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSite } from "@/components/site-provider";
import { Button } from "@/components/ui/button";
import { useStoredValue } from "@/lib/use-stored-value";
import { EARLY_ACCESS_STORAGE_KEY } from "./early-access-provider";
import { LeadForm, type LeadFormVariant } from "./lead-form";

/** A form that replaces itself with a confirmation once the request is sent. */
export function LeadFormCard({
  variant,
  source,
  sourceFromQuery,
  successTitle,
  successAction,
}: {
  variant: LeadFormVariant;
  source: string;
  sourceFromQuery?: boolean;
  successTitle: string;
  /** Extra action shown next to the booking link after a successful submission. */
  successAction?: ReactNode;
}) {
  const site = useSite();
  const [sent, setSent] = useState<Record<string, string> | null>(null);
  const [, setRequestedEmail] = useStoredValue(EARLY_ACCESS_STORAGE_KEY);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (sent) headingRef.current?.focus();
  }, [sent]);

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-start py-6">
        <span className="inline-flex size-12 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success">
          <CircleCheck className="size-6" aria-hidden="true" />
        </span>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-5 text-2xl font-semibold tracking-tight text-fg focus:outline-none"
        >
          {successTitle}
        </h2>
        <p className="mt-3 max-w-md leading-relaxed text-fg-muted">
          Thanks, {sent.name.split(" ")[0]}. We&apos;ll reply to{" "}
          <span className="font-medium text-fg">{sent.email}</span>.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          {site.links.booking ? (
            <Button asChild>
              <a href={site.links.booking} target="_blank" rel="noreferrer">
                <CalendarClock aria-hidden="true" />
                Book an intro call
              </a>
            </Button>
          ) : null}
          {successAction}
        </div>
      </div>
    );
  }

  return (
    <LeadForm
      variant={variant}
      source={source}
      sourceFromQuery={sourceFromQuery}
      onSuccess={(fields) => {
        setSent(fields);
        if (variant !== "contact") setRequestedEmail(fields.email);
      }}
    />
  );
}
