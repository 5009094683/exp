import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SignInForm } from "@/components/leads/sign-in-form";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to your ${site.product.name} workspace.`,
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid mask-radial-from-0% mask-radial-to-70% opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-64 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent/20 blur-[140px]"
      />

      <header className="relative flex h-(--header-height) items-center px-5 sm:px-8">
        <Link href="/" aria-label={`${site.product.name} home`} className="rounded-md">
          <Logo name={site.product.name} />
        </Link>
      </header>

      <main id="main" className="relative flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-fade-up">
          <h1 className="text-center text-3xl font-semibold tracking-tight text-fg">
            Sign in to {site.product.name}
          </h1>
          <p className="mt-3 text-center text-[15px] text-fg-muted">
            Workspaces are invite-only during early access.
          </p>

          <div className="mt-8 rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl edge-highlight shadow-black/40 sm:p-7">
            <SignInForm />
          </div>

          <p className="mt-6 text-center text-sm text-fg-muted">
            No workspace yet?{" "}
            <Link
              href={{ pathname: "/early-access", query: { source: "signin" } }}
              className="font-medium text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg"
            >
              Request early access
            </Link>
          </p>
          <p className="mt-3 text-center">
            <Link
              href="/console"
              className="group inline-flex items-center gap-1.5 text-sm text-fg-subtle transition-colors hover:text-fg"
            >
              Or explore the demo console
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </p>
        </div>
      </main>

      <footer className="relative px-5 py-6 text-center text-xs text-fg-subtle sm:px-8">
        <Link href="/legal/privacy" className="transition-colors hover:text-fg">
          Privacy
        </Link>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        <Link href="/legal/terms" className="transition-colors hover:text-fg">
          Terms
        </Link>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        © {site.copyrightYear} {site.company.legalName}
      </footer>
    </div>
  );
}
