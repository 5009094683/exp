"use client";

import * as m from "motion/react-m";
import { Tabs as TabsPrimitive } from "radix-ui";
import { createContext, useContext, useId, useState, type ComponentProps } from "react";
import { INDICATOR_TRANSITION, Motion } from "@/components/motion/provider";
import { cn } from "@/lib/cn";

const TabsContext = createContext<{ value?: string; indicatorId: string } | null>(null);

/** Tabs whose active underline slides from one tab to the next. */
export function Tabs({
  value: controlledValue,
  defaultValue,
  onValueChange,
  ...props
}: ComponentProps<typeof TabsPrimitive.Root>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;
  const indicatorId = useId();

  return (
    <Motion>
      <TabsContext value={{ value, indicatorId }}>
        <TabsPrimitive.Root
          value={value}
          onValueChange={(next) => {
            setUncontrolledValue(next);
            onValueChange?.(next);
          }}
          {...props}
        />
      </TabsContext>
    </Motion>
  );
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex items-center gap-1 border-b border-line", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  children,
  value,
  onPointerDown,
  onKeyDown,
  onBlur,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const tabs = useContext(TabsContext);
  const active = tabs !== null && tabs.value === value;

  return (
    <TabsPrimitive.Trigger
      value={value}
      // Roving tabindex makes browsers show the keyboard focus ring after a
      // click as well, so the ring is hidden while focus came from a pointer.
      onPointerDown={(event) => {
        event.currentTarget.setAttribute("data-pointer-focus", "");
        onPointerDown?.(event);
      }}
      onKeyDown={(event) => {
        event.currentTarget.removeAttribute("data-pointer-focus");
        onKeyDown?.(event);
      }}
      onBlur={(event) => {
        event.currentTarget.removeAttribute("data-pointer-focus");
        onBlur?.(event);
      }}
      className={cn(
        "relative -mb-px inline-flex h-10 items-center gap-2 px-3 text-sm font-medium whitespace-nowrap text-fg-subtle",
        "transition-colors hover:text-fg data-[state=active]:text-fg",
        "-outline-offset-2 data-[pointer-focus]:outline-none",
        className,
      )}
      {...props}
    >
      {children}
      {active ? (
        <m.span
          layoutId={tabs.indicatorId}
          transition={INDICATOR_TRANSITION}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-text"
        />
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content className={cn("focus-visible:outline-none", className)} {...props} />
  );
}
