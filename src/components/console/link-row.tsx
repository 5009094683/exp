"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AppRoute } from "@/lib/routes";
import { rowLink } from "./ui";

/**
 * Table row that opens a detail page when clicked. Each row also contains a
 * real link in its first cell, which is what keyboard and screen-reader users
 * activate.
 */
export function LinkRow({
  href,
  children,
  className,
}: {
  href: AppRoute;
  children: ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <tr
      className={cn(rowLink, className)}
      onClick={(event) => {
        // Let real links, buttons and text selection behave normally.
        if ((event.target as HTMLElement).closest("a, button")) return;
        if (window.getSelection()?.toString()) return;
        router.push(href);
      }}
    >
      {children}
    </tr>
  );
}
