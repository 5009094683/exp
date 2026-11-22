"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsHref, docsPages, type DocsNavGroup } from "@/content/docs/nav";
import { cn } from "@/lib/cn";

function NavList({ groups, pathname }: { groups: DocsNavGroup[]; pathname: string }) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 font-mono text-[11px] font-medium tracking-[0.14em] text-fg-subtle uppercase">
            {group.title}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const href = docsHref(item.slug);
              const active = pathname === href;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-white/[0.07] font-medium text-fg"
                        : "text-fg-muted hover:bg-white/[0.04] hover:text-fg",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function DocsSidebar({ groups }: { groups: DocsNavGroup[] }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const current = docsPages.find((page) => docsHref(page.slug) === pathname);

  return (
    <>
      {/* Keyed by path so the menu closes after navigating. */}
      <details
        key={pathname}
        className="group mb-8 rounded-xl border border-line bg-surface lg:hidden"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block font-mono text-[11px] tracking-[0.14em] text-fg-subtle uppercase">
              Documentation
            </span>
            <span className="mt-0.5 block truncate font-medium text-fg">
              {current?.title ?? "Contents"}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-fg-subtle transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <nav aria-label="Documentation" className="border-t border-line p-2 pt-4">
          <NavList groups={groups} pathname={pathname} />
        </nav>
      </details>

      <nav
        aria-label="Documentation"
        className="sticky top-[calc(var(--header-height)+2rem)] hidden max-h-[calc(100dvh-var(--header-height)-4rem)] overflow-y-auto pb-4 lg:block"
      >
        <NavList groups={groups} pathname={pathname} />
      </nav>
    </>
  );
}
