import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/ui/code-block";
import type { DocBlock } from "@/content/docs/types";
import { Inline } from "./inline";

function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p className="text-[15px] leading-7 text-fg-muted">
          <Inline text={block.text} />
        </p>
      );

    case "h2":
      return (
        <h2
          id={block.id}
          className="group scroll-mt-28 pt-6 text-xl font-semibold tracking-tight text-fg first:pt-0"
        >
          <a href={`#${block.id}`} className="inline-flex items-baseline gap-2">
            {block.text}
            <span
              aria-hidden="true"
              className="font-mono text-sm font-normal text-fg-faint opacity-0 transition-opacity group-hover:opacity-100"
            >
              #
            </span>
          </a>
        </h2>
      );

    case "list": {
      const items = block.items.map((item, index) => (
        <li key={index} className="relative pl-7">
          <span
            aria-hidden="true"
            className={
              block.ordered
                ? "absolute top-[5px] left-0 inline-flex size-[18px] items-center justify-center rounded-full border border-line-strong font-mono text-[10px] text-fg-muted"
                : "absolute top-[11px] left-1.5 size-1.5 rounded-full bg-accent-text/70"
            }
          >
            {block.ordered ? index + 1 : null}
          </span>
          <Inline text={item} />
        </li>
      ));
      const className = "space-y-2.5 text-[15px] leading-7 text-fg-muted";
      return block.ordered ? (
        <ol className={className}>{items}</ol>
      ) : (
        <ul className={className}>{items}</ul>
      );
    }

    case "code":
      return (
        <CodeBlock
          code={block.sample.code}
          language={block.sample.language}
          title={block.sample.filename}
        />
      );

    case "table":
      return (
        <div className="relative overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th
                    key={cell}
                    scope="col"
                    className="border-b border-line bg-white/[0.03] px-4 py-2.5 text-xs font-medium whitespace-nowrap text-fg-subtle"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="[&:last-child>td]:border-b-0">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={
                        cellIndex === 0
                          ? "border-b border-line px-4 py-3 align-top text-fg sm:whitespace-nowrap"
                          : "border-b border-line px-4 py-3 align-top leading-6 text-fg-muted"
                      }
                    >
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "address":
      return (
        <address className="rounded-xl border border-line bg-surface px-4 py-3.5 text-sm leading-6 text-fg-muted not-italic">
          <span className="block font-medium text-fg">{block.name}</span>
          {block.lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>
      );

    case "cards":
      return (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href as Route}
                className="group flex h-full flex-col rounded-xl border border-line bg-surface p-4 transition-colors hover:border-line-strong hover:bg-surface-2"
              >
                <span className="flex items-center justify-between gap-3 text-sm font-medium text-fg">
                  {item.title}
                  <ArrowRight
                    className="size-3.5 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
                  {item.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      );
  }
}

export function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}
