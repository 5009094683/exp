"use client";

import {
  Activity,
  ArrowLeft,
  BookOpen,
  Bot,
  Box,
  ChartNoAxesColumn,
  ChevronRight,
  Database,
  FlaskConical,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Plug,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";
import { EarlyAccessButton } from "@/components/leads/early-access-button";
import { useSite } from "@/components/site-provider";
import { Badge, StatusDot } from "@/components/ui/badge";
import { Dialog, DialogDescription, DialogTitle, SheetContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAgent } from "@/demo/agents";
import { workspace } from "@/demo/workspace";
import { cn } from "@/lib/cn";
import type { AppRoute } from "@/lib/routes";
import { Avatar } from "./ui";

type NavItem = { href: AppRoute; label: string; icon: LucideIcon };

const navigation: Array<{ label?: string; items: NavItem[] }> = [
  { items: [{ href: "/console", label: "Overview", icon: LayoutDashboard }] },
  {
    label: "Build",
    items: [
      { href: "/console/agents", label: "Agents", icon: Bot },
      { href: "/console/runs", label: "Runs", icon: Activity },
    ],
  },
  {
    label: "Platform",
    items: [
      { href: "/console/memory", label: "Memory", icon: Database },
      { href: "/console/integrations", label: "Integrations", icon: Plug },
      { href: "/console/sandboxes", label: "Sandboxes", icon: Box },
    ],
  },
  {
    label: "Govern",
    items: [
      { href: "/console/policies", label: "Policies", icon: KeyRound },
      { href: "/console/audit", label: "Audit log", icon: ScrollText },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/console/usage", label: "Usage", icon: ChartNoAxesColumn },
      { href: "/console/settings", label: "Settings", icon: Settings },
    ],
  },
];

const SECTION_LABELS: Record<string, string> = {
  agents: "Agents",
  runs: "Runs",
  memory: "Memory",
  integrations: "Integrations",
  sandboxes: "Sandboxes",
  policies: "Policies",
  audit: "Audit log",
  usage: "Usage",
  settings: "Settings",
  new: "New agent",
  members: "Members",
  "api-keys": "API keys",
  security: "Security",
  billing: "Billing",
};

function isActive(pathname: string, href: string): boolean {
  return href === "/console" ? pathname === "/console" : pathname.startsWith(href);
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Console" className="space-y-5">
      {navigation.map((group, index) => (
        <div key={group.label ?? index}>
          {group.label ? (
            <p className="mb-1.5 px-2.5 font-mono text-[10px] tracking-[0.16em] text-fg-faint uppercase">
              {group.label}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                      active
                        ? "bg-white/[0.08] font-medium text-fg"
                        : "text-fg-muted hover:bg-white/[0.04] hover:text-fg",
                    )}
                  >
                    <item.icon
                      className={cn("size-4", active ? "text-accent-text" : "text-fg-subtle")}
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function WorkspaceBadge() {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-line bg-white/[0.03] px-2.5 py-2">
      <LogoMark className="size-5" />
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-fg">{workspace.name}</p>
        <p className="truncate font-mono text-[10px] text-fg-subtle">{workspace.region}</p>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-accent/30 bg-accent/[0.07] p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-fg">
          <FlaskConical className="size-3.5 text-accent-text" aria-hidden="true" />
          Demo workspace
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
          Everything here is sample data. Get a workspace of your own.
        </p>
        <EarlyAccessButton source="console-sidebar" size="sm" className="mt-2.5 w-full">
          Request access
        </EarlyAccessButton>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-fg-subtle transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back to website
      </Link>
    </div>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs: Array<{ label: string; href: string }> = [];

  segments.forEach((segment, index) => {
    const href = `/console/${segments.slice(0, index + 1).join("/")}`;
    const parent = segments[index - 1];
    let label = SECTION_LABELS[segment];
    if (!label && parent === "agents") label = getAgent(segment)?.name ?? segment;
    if (!label) label = segment;
    crumbs.push({ label, href });
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <li className="shrink-0">
          <Link
            href="/console"
            className={cn(
              "transition-colors hover:text-fg",
              crumbs.length === 0 ? "font-medium text-fg" : "text-fg-subtle",
            )}
          >
            {crumbs.length === 0 ? "Overview" : "Console"}
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="size-3.5 shrink-0 text-fg-faint" aria-hidden="true" />
              {last ? (
                <span aria-current="page" className="truncate font-medium text-fg">
                  {crumb.label}
                </span>
              ) : (
                // Built from the current path, so it always points at an existing route.
                <a
                  href={crumb.href}
                  className="truncate text-fg-subtle transition-colors hover:text-fg"
                >
                  {crumb.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Frame for the demo console: sidebar, top bar and the notice that the data is sample data. */
export function ConsoleShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const site = useSite();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-bg">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-bg-subtle p-3 lg:flex">
        <WorkspaceBadge />
        <div className="flex-1">
          <NavList pathname={pathname} />
        </div>
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
          <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
              className="-ml-1 inline-flex size-9 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <SheetContent className="max-w-[17rem] gap-5 p-3" aria-describedby={undefined}>
              <DialogTitle className="sr-only">Console navigation</DialogTitle>
              <DialogDescription className="sr-only">
                Sections of the demo console
              </DialogDescription>
              <div className="pr-10">
                <WorkspaceBadge />
              </div>
              <div className="flex-1">
                <NavList pathname={pathname} onNavigate={() => setMenuOpen(false)} />
              </div>
              <SidebarFooter />
            </SheetContent>
          </Dialog>

          <Breadcrumbs pathname={pathname} />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Badge tone="neutral" className="hidden sm:inline-flex">
              <StatusDot tone="success" />
              Production
            </Badge>
            <Link
              href="/docs"
              className="hidden h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] text-fg-muted transition-colors hover:bg-white/[0.06] hover:text-fg md:inline-flex"
            >
              <BookOpen className="size-3.5" aria-hidden="true" />
              Docs
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="rounded-full transition-opacity hover:opacity-80"
              >
                <Avatar name="Guest Visitor" className="size-8" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  Signed in as a guest
                  <span className="mt-0.5 block font-normal text-fg-faint">
                    Read-only demo of {site.product.name}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/console/settings">
                    <Settings aria-hidden="true" />
                    Workspace settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/docs">
                    <BookOpen aria-hidden="true" />
                    Documentation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <LogOut aria-hidden="true" />
                    Leave the demo
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex items-center justify-center gap-x-3 gap-y-1 border-b border-line bg-accent/[0.06] px-4 py-2 text-center text-xs text-fg-muted">
          <FlaskConical
            className="hidden size-3.5 shrink-0 text-accent-text sm:block"
            aria-hidden="true"
          />
          <p>
            You are exploring a demo workspace. The agents, runs and people shown are sample data.
          </p>
        </div>

        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
