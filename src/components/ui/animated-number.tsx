"use client";

import { useEffect, useRef, useState } from "react";

type Animate = typeof import("motion").animate;

let animate: Animate | undefined;
let loading: Promise<void> | undefined;

/**
 * A number that glides to its new value instead of jumping.
 *
 * The exact value is always what gets rendered at rest: the tween only runs
 * once the animation code has loaded and the visitor has not asked for reduced
 * motion, so a failed download can never leave a stale figure on screen.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (value: number) => string;
  className?: string;
}) {
  /** The in-between value while a tween is running; `null` at rest. */
  const [tween, setTween] = useState<number | null>(null);
  const shown = useRef(value);

  useEffect(() => {
    loading ??= import("motion").then((module) => {
      animate = module.animate;
    });
  }, []);

  useEffect(() => {
    const from = shown.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduced || from === value) {
      shown.current = value;
      // A tween interrupted just before this point may have left its last frame behind.
      queueMicrotask(() => setTween(null));
      return;
    }

    const controls = animate(from, value, {
      duration: 0.35,
      ease: "easeOut",
      onUpdate: (latest) => {
        shown.current = latest;
        setTween(latest);
      },
      onComplete: () => {
        shown.current = value;
        setTween(null);
      },
    });
    return () => controls.stop();
  }, [value]);

  // Assistive technology gets the exact value once, not every frame of the tween.
  return (
    <span className={className}>
      <span aria-hidden="true">{format(tween ?? value)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
