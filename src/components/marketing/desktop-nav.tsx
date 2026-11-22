"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { AppRoute } from "@/lib/routes";

export type NavMenuItem = {
  href: AppRoute;
  label: string;
  description: string;
  icon: ReactNode;
};

export type NavLinkItem = { href: AppRoute; label: string };

const triggerClasses = cn(
  "group inline-flex h-9 items-center gap-1 rounded-md px-3 text-sm text-fg-muted transition-colors",
  "hover:text-fg data-[state=open]:text-fg",
);

const panelClasses = cn(
  "absolute top-full left-0 mt-2 rounded-2xl border border-line-strong bg-surface p-2 shadow-2xl edge-highlight shadow-black/60",
  "origin-top-left data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in",
);

function MenuLink({ item }: { item: NavMenuItem }) {
  return (
    <NavigationMenu.Link asChild>
      <Link
        href={item.href}
        className="group/item flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/[0.05] focus-visible:bg-white/[0.05]"
      >
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-fg-muted transition-colors group-hover/item:border-accent/40 group-hover/item:text-accent-text">
          {item.icon}
        </span>
        <span>
          <span className="block text-sm font-medium text-fg">{item.label}</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-fg-subtle">
            {item.description}
          </span>
        </span>
      </Link>
    </NavigationMenu.Link>
  );
}

export function DesktopNav({
  platform,
  solutions,
  links,
}: {
  platform: NavMenuItem[];
  solutions: NavMenuItem[];
  links: NavLinkItem[];
}) {
  const pathname = usePathname();

  return (
    <NavigationMenu.Root className="relative hidden lg:block" delayDuration={60}>
      <NavigationMenu.List className="flex items-center gap-0.5">
        <NavigationMenu.Item className="relative">
          <NavigationMenu.Trigger
            className={cn(triggerClasses, pathname.startsWith("/platform") && "text-fg")}
          >
            Platform
            <ChevronDown
              aria-hidden="true"
              className="size-3.5 text-fg-subtle transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={cn(panelClasses, "w-[640px]")}>
            <ul className="grid grid-cols-2 gap-0.5">
              {platform.map((item) => (
                <li key={item.href}>
                  <MenuLink item={item} />
                </li>
              ))}
            </ul>
            <div className="mt-2 grid grid-cols-2 gap-0.5 border-t border-line pt-2">
              <NavigationMenu.Link asChild>
                <Link
                  href="/platform"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
                >
                  Platform overview
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </NavigationMenu.Link>
              <NavigationMenu.Link asChild>
                <Link
                  href="/console"
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-white/[0.05] hover:text-fg"
                >
                  Explore the demo console
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </NavigationMenu.Link>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item className="relative">
          <NavigationMenu.Trigger
            className={cn(triggerClasses, pathname.startsWith("/solutions") && "text-fg")}
          >
            Solutions
            <ChevronDown
              aria-hidden="true"
              className="size-3.5 text-fg-subtle transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={cn(panelClasses, "w-[360px]")}>
            <ul className="grid gap-0.5">
              {solutions.map((item) => (
                <li key={item.href}>
                  <MenuLink item={item} />
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        {links.map((link) => (
          <NavigationMenu.Item key={link.href}>
            <NavigationMenu.Link asChild active={pathname.startsWith(link.href)}>
              <Link
                href={link.href}
                className={cn(
                  "inline-flex h-9 items-center rounded-md px-3 text-sm text-fg-muted transition-colors hover:text-fg",
                  pathname.startsWith(link.href) && "text-fg",
                )}
              >
                {link.label}
              </Link>
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}
