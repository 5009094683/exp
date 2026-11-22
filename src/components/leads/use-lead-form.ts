"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSite } from "@/components/site-provider";
import { describeLead, HONEYPOT_FIELD, validateLead, type LeadKind } from "@/lib/leads/schema";

export type LeadFormStatus = "idle" | "submitting" | "success" | "error";

export type LeadFormFailure = {
  message: string;
  /** Prefilled email link offered when the request could not be sent. */
  fallbackHref?: string;
};

const SUBJECTS: Record<LeadKind, string> = {
  "early-access": "Early access request",
  contact: "Website enquiry",
};

function buildMailto(to: string, subject: string, lines: string[]): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export function useLeadForm({
  kind,
  source,
  sourceFromQuery = false,
  onSuccess,
}: {
  kind: LeadKind;
  /** Where the request started, recorded with the submission. */
  source: string;
  /** Prefer `?source=` from the URL, set by links that lead to a form page. */
  sourceFromQuery?: boolean;
  onSuccess?: (fields: Record<string, string>) => void;
}) {
  const site = useSite();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<LeadFormStatus>("idle");
  const [failure, setFailure] = useState<LeadFormFailure | null>(null);
  const startedAt = useRef(0);
  const honeypot = useRef("");

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  const setValue = useCallback((name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!(name in current)) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }, []);

  const setHoneypot = useCallback((value: string) => {
    honeypot.current = value;
  }, []);

  const submit = useCallback(async (): Promise<{ invalid?: string }> => {
    const querySource = sourceFromQuery
      ? new URLSearchParams(window.location.search).get("source")
      : null;
    const validation = validateLead(kind, {
      ...values,
      source: querySource || source,
      page: window.location.pathname,
    });

    if (!validation.ok) {
      setErrors(validation.errors);
      return { invalid: Object.keys(validation.errors)[0] };
    }

    const { lead } = validation;
    const fail = (message: string) => {
      const contact = site.contact.email;
      setFailure({
        message,
        fallbackHref: contact
          ? buildMailto(
              contact,
              `${SUBJECTS[kind]}${lead.fields.company ? `: ${lead.fields.company}` : ""}`,
              describeLead(lead).map((line) => `${line.label}: ${line.value}`),
            )
          : undefined,
      });
      setStatus("error");
    };

    setStatus("submitting");
    setFailure(null);

    try {
      const response = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...lead.fields,
          source: lead.source,
          page: lead.page,
          [HONEYPOT_FIELD]: honeypot.current,
          elapsedMs: Math.round(performance.now() - startedAt.current),
        }),
      });

      const isJson = (response.headers.get("content-type") ?? "").includes("application/json");
      const body: { ok?: boolean; fields?: Record<string, string> } | null = isJson
        ? await response.json().catch(() => null)
        : null;

      if (response.ok && body?.ok) {
        setStatus("success");
        onSuccess?.(lead.fields);
        return {};
      }

      if (response.status === 422 && body?.fields) {
        setErrors(body.fields);
        setStatus("idle");
        return { invalid: Object.keys(body.fields)[0] };
      }

      if (response.status === 429) {
        fail("Too many requests from your network right now. Please try again in a minute.");
        return {};
      }

      // Includes static hosts with no function runtime, which answer 404 or 405 here.
      fail("We couldn't send your request.");
    } catch {
      fail("We couldn't send your request. Check your connection and try again.");
    }
    return {};
  }, [kind, onSuccess, site.contact.email, source, sourceFromQuery, values]);

  return { values, errors, status, failure, setValue, setHoneypot, submit };
}
