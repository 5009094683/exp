"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { NavLinkItem, NavMenuItem } from "./desktop-nav";

function Group({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: NavMenuItem[];
  onNavigate: () => void;
}) {
  return (
    <div>
      <p className="px-3 font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase">
        {title}
      </p>
      <ul className="mt-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-fg transition-colors hover:bg-white/[0.05]"
            >
              <span className="text-fg-subtle">{item.icon}</span>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MobileNav({
  platform,
  solutions,
  links,
  brand,
  actions,
}: {
  platform: NavMenuItem[];
  solutions: NavMenuItem[];
  links: NavLinkItem[];
  brand: ReactNode;
  /** Buttons shown at the bottom of the menu. */
  actions: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
      >
        <Menu className="size-5" />
      </button>
      <SheetContent className="max-w-sm" aria-describedby={undefined}>
        <DialogTitle className="sr-only">Menu</DialogTitle>
        <DialogDescription className="sr-only">Site navigation</DialogDescription>
        <div className="flex h-(--header-height) shrink-0 items-center border-b border-line px-5">
          <Link href="/" onClick={close}>
            {brand}
          </Link>
        </div>
        <nav aria-label="Mobile" className="flex-1 space-y-6 overflow-y-auto px-2 py-6">
          <Group title="Platform" items={platform} onNavigate={close} />
          <Group title="Solutions" items={solutions} onNavigate={close} />
          <div>
            <p className="px-3 font-mono text-[11px] tracking-[0.16em] text-fg-subtle uppercase">
              More
            </p>
            <ul className="mt-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block rounded-lg px-3 py-2.5 text-[15px] text-fg transition-colors hover:bg-white/[0.05]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <div className="grid shrink-0 gap-2 border-t border-line p-5" onClick={close}>
          {actions}
        </div>
      </SheetContent>
    </Dialog>
  );
}
