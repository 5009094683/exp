"use client";

import { LazyMotion, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

const loadFeatures = () => import("./features").then((module) => module.default);

/**
 * Enables `m` components for its children. The animation code is fetched after
 * the page is interactive, so nothing waits for it, and until it arrives the
 * components render in their final state. Follows the reduced-motion setting.
 */
export function Motion({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

/** Spring for indicators that slide between options. */
export const INDICATOR_TRANSITION = {
  type: "spring",
  stiffness: 520,
  damping: 42,
  mass: 0.8,
} as const;
