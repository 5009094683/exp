"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Heading = { id: string; text: string };

/** "On this page" links that follow the reader's position. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string | undefined>(headings[0]?.id);

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    // The active heading is the last one that has passed the top of the viewport.
    const update = () => {
      const passed = elements.filter((element) => element.getBoundingClientRect().top <= 140);
      setActive((passed.at(-1) ?? elements[0]).id);
    };

    const observer = new IntersectionObserver(update, {
      rootMargin: "-140px 0px -60% 0px",
      threshold: [0, 1],
    });
    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page" className="text-[13px]">
      <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-fg-subtle uppercase">
        On this page
      </p>
      <ul className="mt-3 space-y-0.5 border-l border-line">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={active === heading.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1 pl-3.5 leading-snug transition-colors",
                active === heading.id
                  ? "border-accent-text text-fg"
                  : "border-transparent text-fg-subtle hover:text-fg",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
