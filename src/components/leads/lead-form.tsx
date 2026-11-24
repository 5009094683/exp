"use client";

import { ArrowRight, CircleAlert, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useId, useRef, type FormEvent, type ReactNode } from "react";
import { useSite } from "@/components/site-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import {
  AGENT_VOLUMES,
  COMPANY_SIZES,
  CONTACT_TOPICS,
  DEPLOYMENTS,
  HONEYPOT_FIELD,
  LEAD_FIELDS,
  USE_CASES,
  type LeadKind,
} from "@/lib/leads/schema";
import { telHref } from "@/lib/phone";
import { useLeadForm } from "./use-lead-form";

type FieldConfig = {
  name: string;
  control: "text" | "email" | "select" | "textarea";
  /** Overrides the label from the shared schema. */
  label?: string;
  placeholder?: string;
  autoComplete?: string;
  options?: readonly string[];
  /** Takes half the row on wider screens. */
  half?: boolean;
  rows?: number;
};

export type LeadFormVariant = "early-access-short" | "early-access-full" | "contact";

const FORMS: Record<
  LeadFormVariant,
  { kind: LeadKind; submitLabel: string; fields: FieldConfig[] }
> = {
  "early-access-short": {
    kind: "early-access",
    submitLabel: "Request access",
    fields: [
      {
        name: "email",
        control: "email",
        placeholder: "you@company.com",
        autoComplete: "email",
      },
      { name: "name", control: "text", autoComplete: "name", half: true },
      { name: "company", control: "text", autoComplete: "organization", half: true },
      { name: "useCase", control: "select", options: USE_CASES },
      {
        name: "message",
        control: "textarea",
        label: "What do you want to build?",
        placeholder: "A sentence or two is plenty.",
        rows: 3,
      },
    ],
  },
  "early-access-full": {
    kind: "early-access",
    submitLabel: "Request early access",
    fields: [
      {
        name: "email",
        control: "email",
        placeholder: "you@company.com",
        autoComplete: "email",
        half: true,
      },
      { name: "name", control: "text", autoComplete: "name", half: true },
      { name: "company", control: "text", autoComplete: "organization", half: true },
      {
        name: "role",
        control: "text",
        placeholder: "Head of Platform",
        autoComplete: "organization-title",
        half: true,
      },
      { name: "companySize", control: "select", options: COMPANY_SIZES, half: true },
      { name: "agents", control: "select", options: AGENT_VOLUMES, half: true },
      { name: "useCase", control: "select", options: USE_CASES, half: true },
      { name: "deployment", control: "select", options: DEPLOYMENTS, half: true },
      {
        name: "message",
        control: "textarea",
        label: "What do you want to build?",
        placeholder: "The workflows you have in mind, the systems involved and any constraints.",
        rows: 4,
      },
    ],
  },
  contact: {
    kind: "contact",
    submitLabel: "Send message",
    fields: [
      { name: "name", control: "text", autoComplete: "name", half: true },
      {
        name: "email",
        control: "email",
        placeholder: "you@company.com",
        autoComplete: "email",
        half: true,
      },
      { name: "company", control: "text", autoComplete: "organization", half: true },
      { name: "topic", control: "select", options: CONTACT_TOPICS, half: true },
      {
        name: "message",
        control: "textarea",
        placeholder: "How can we help?",
        rows: 6,
      },
    ],
  },
};

type FieldSpec = { label: string; required?: boolean };

export function LeadForm({
  variant,
  source,
  sourceFromQuery,
  onSuccess,
  footer,
  className,
}: {
  variant: LeadFormVariant;
  source: string;
  sourceFromQuery?: boolean;
  onSuccess: (fields: Record<string, string>) => void;
  /** Shown under the submit button. */
  footer?: ReactNode;
  className?: string;
}) {
  const config = FORMS[variant];
  const specs: Record<string, FieldSpec> = LEAD_FIELDS[config.kind];
  const { phone } = useSite().contact;
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const { values, errors, status, failure, setValue, setHoneypot, submit } = useLeadForm({
    kind: config.kind,
    source,
    sourceFromQuery,
    onSuccess,
  });
  const submitting = status === "submitting";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const { invalid } = await submit();
    if (invalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${invalid}"]`)?.focus();
    }
  }

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      className={cn("relative grid gap-4 sm:grid-cols-2", className)}
    >
      {config.fields.map((field) => {
        const spec = specs[field.name];
        const id = `${formId}-${field.name}`;
        const error = errors[field.name];
        const shared = {
          id,
          name: field.name,
          value: values[field.name] ?? "",
          required: Boolean(spec.required),
          disabled: submitting,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": error ? `${id}-error` : undefined,
        };

        return (
          <Field
            key={field.name}
            id={id}
            label={field.label ?? spec.label}
            optional={!spec.required}
            error={error}
            className={field.half ? undefined : "sm:col-span-2"}
          >
            {field.control === "select" ? (
              <Select {...shared} onChange={(event) => setValue(field.name, event.target.value)}>
                <option value="">Select…</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            ) : field.control === "textarea" ? (
              <Textarea
                {...shared}
                rows={field.rows}
                placeholder={field.placeholder}
                onChange={(event) => setValue(field.name, event.target.value)}
              />
            ) : (
              <Input
                {...shared}
                type={field.control}
                inputMode={field.control === "email" ? "email" : undefined}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                onChange={(event) => setValue(field.name, event.target.value)}
              />
            )}
          </Field>
        );
      })}

      {/* Decoy field: hidden from people, tempting to form-filling bots. */}
      <div aria-hidden="true" className="absolute top-0 -left-[9999px] size-px overflow-hidden">
        <label htmlFor={`${formId}-ref`}>Referral code</label>
        <input
          id={`${formId}-ref`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {failure ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/10 p-3.5 text-sm text-fg sm:col-span-2"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <p className="leading-relaxed">
            {failure.message}{" "}
            {failure.fallbackHref ? (
              <a
                href={failure.fallbackHref}
                className="font-medium text-fg underline underline-offset-4"
              >
                Send it by email instead
              </a>
            ) : null}
            {phone ? (
              <>
                {failure.fallbackHref ? ", or call us at " : "You can also call us at "}
                <a
                  href={telHref(phone)}
                  className="font-medium whitespace-nowrap text-fg underline underline-offset-4"
                >
                  {phone}
                </a>
                .
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full sm:w-auto sm:self-start"
        >
          {submitting ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              {config.submitLabel}
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </Button>
        {footer ?? (
          <p className="text-xs leading-relaxed text-fg-subtle">
            By submitting, you agree to our{" "}
            <Link
              href="/legal/privacy"
              className="underline underline-offset-4 transition-colors hover:text-fg"
            >
              privacy policy
            </Link>
            .
          </p>
        )}
      </div>
    </form>
  );
}
