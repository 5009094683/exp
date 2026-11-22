"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { useGate } from "./early-access-button";

/**
 * Sign-in is invite-only during early access, so both paths explain that and
 * offer the request form instead of pretending to authenticate.
 */
export function SignInForm() {
  const id = useId();
  const gate = useGate();
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    gate("sign-in", "signin");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field id={`${id}-email`} label="Work email">
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full">
        Continue
        <ArrowRight aria-hidden="true" />
      </Button>

      <div className="flex items-center gap-3 py-1 text-xs text-fg-subtle">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => gate("sign-in", "signin-sso")}
      >
        <KeyRound aria-hidden="true" />
        Continue with single sign-on
      </Button>
    </form>
  );
}
