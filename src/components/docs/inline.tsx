import type { Route } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;
const LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

const linkClass =
  "font-medium text-fg underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-accent-text";

/** Renders the inline forms used in documentation text: `code`, **strong** and [links](/path). */
export function Inline({ text }: { text: string }): ReactNode {
  return text.split(INLINE).map((part, index) => {
    if (part === "") return null;

    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-md border border-line bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.85em] whitespace-nowrap text-fg"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      );
    }

    const link = LINK.exec(part);
    if (link) {
      const [, label, href] = link;
      if (href.startsWith("/")) {
        return (
          <Link key={index} href={href as Route} className={linkClass}>
            {label}
          </Link>
        );
      }
      const external = !href.startsWith("mailto:");
      return (
        <a
          key={index}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className={linkClass}
        >
          {label}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

/** Inline text with the markup removed, for places that need a plain string. */
export function plainText(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1");
}
