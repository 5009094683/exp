"use client";

import * as m from "motion/react-m";
import { useId } from "react";
import { INDICATOR_TRANSITION, Motion } from "@/components/motion/provider";
import { cn } from "@/lib/cn";

/** Segmented filter. The highlight slides to the option that was chosen. */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const indicatorId = useId();

  return (
    <Motion>
      <div
        role="group"
        aria-label={label}
        className="flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-line bg-white/[0.02] p-0.5"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "relative inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors",
                active ? "text-fg" : "text-fg-subtle hover:text-fg",
              )}
            >
              {active ? (
                <m.span
                  layoutId={indicatorId}
                  transition={INDICATOR_TRANSITION}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-md bg-white/[0.09]"
                />
              ) : null}
              <span className="relative">{option.label}</span>
              {option.count !== undefined ? (
                <span
                  className={cn(
                    "relative tabular-nums",
                    active ? "text-fg-muted" : "text-fg-faint",
                  )}
                >
                  {option.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Motion>
  );
}
