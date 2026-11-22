"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type HowItWorksStep = {
  id: string;
  label: string;
  title: string;
  body: string;
  /** Rendered code sample for the step. */
  sample: ReactNode;
};

/** Four steps on the left, the matching configuration on the right. */
export function HowItWorks({ steps }: { steps: HowItWorksStep[] }) {
  const [active, setActive] = useState(steps[0].id);
  const current = steps.find((step) => step.id === active) ?? steps[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.25fr] lg:gap-14">
      <div
        role="tablist"
        aria-label="How it works"
        aria-orientation="vertical"
        className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
      >
        {steps.map((step, index) => {
          const selected = step.id === current.id;
          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              id={`how-tab-${step.id}`}
              aria-selected={selected}
              aria-controls={`how-panel-${step.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(step.id)}
              onKeyDown={(event) => {
                const delta =
                  event.key === "ArrowDown" || event.key === "ArrowRight"
                    ? 1
                    : event.key === "ArrowUp" || event.key === "ArrowLeft"
                      ? -1
                      : 0;
                if (delta === 0) return;
                event.preventDefault();
                const next = steps[(index + delta + steps.length) % steps.length];
                setActive(next.id);
                document.getElementById(`how-tab-${next.id}`)?.focus();
              }}
              className={cn(
                "group relative shrink-0 rounded-xl border p-4 text-left transition-colors lg:p-5",
                selected
                  ? "border-line-strong bg-surface"
                  : "border-transparent hover:bg-white/[0.03]",
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full border font-mono text-[11px] transition-colors",
                    selected
                      ? "border-accent/60 bg-accent/15 text-accent-text"
                      : "border-line-strong text-fg-subtle",
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "font-medium whitespace-nowrap transition-colors lg:text-lg",
                    selected ? "text-fg" : "text-fg-muted group-hover:text-fg",
                  )}
                >
                  {step.title}
                </span>
              </span>
              <span
                className={cn(
                  "mt-2 hidden pl-9 text-[15px] leading-relaxed lg:block",
                  selected ? "text-fg-muted" : "text-fg-subtle",
                )}
              >
                {step.body}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`how-panel-${current.id}`}
        aria-labelledby={`how-tab-${current.id}`}
        className="min-w-0"
      >
        <p className="mb-4 text-[15px] leading-relaxed text-fg-muted lg:hidden">{current.body}</p>
        <div key={current.id} className="animate-fade-in">
          {current.sample}
        </div>
      </div>
    </div>
  );
}
