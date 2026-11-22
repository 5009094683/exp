import { cn } from "@/lib/cn";
import { highlight, type CodeLanguage } from "@/lib/highlight";
import { CopyButton } from "./copy-button";

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  yaml: "YAML",
  json: "JSON",
  bash: "Shell",
  http: "HTTP",
  text: "Text",
};

/** Highlighted code without chrome; use inside custom frames. */
export function Code({
  code,
  language,
  lineNumbers = false,
  className,
}: {
  code: string;
  language: CodeLanguage;
  lineNumbers?: boolean;
  className?: string;
}) {
  const lines = highlight(code.replace(/\n$/, ""), language);

  return (
    <pre
      className={cn(
        "overflow-x-auto font-mono text-[13px] leading-[1.7] [tab-size:2] text-fg-muted",
        className,
      )}
    >
      <code className="grid min-w-max">
        {lines.map((tokens, lineIndex) => (
          <span key={lineIndex} className="flex">
            {lineNumbers ? (
              <span
                aria-hidden="true"
                className="mr-4 inline-block w-6 shrink-0 text-right text-fg-faint select-none"
              >
                {lineIndex + 1}
              </span>
            ) : null}
            <span className="whitespace-pre">
              {tokens.map((token, tokenIndex) =>
                token.type ? (
                  <span key={tokenIndex} className={`tok-${token.type}`}>
                    {token.text}
                  </span>
                ) : (
                  token.text
                ),
              )}
              {tokens.every((token) => token.text === "") ? " " : null}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}

/** Code sample with a title bar and copy button. */
export function CodeBlock({
  code,
  language,
  title,
  lineNumbers = false,
  className,
}: {
  code: string;
  language: CodeLanguage;
  title?: string;
  lineNumbers?: boolean;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-surface edge-highlight",
        className,
      )}
    >
      <figcaption className="flex h-10 items-center justify-between gap-3 border-b border-line bg-white/[0.02] pr-1.5 pl-4">
        <span className="truncate font-mono text-xs text-fg-subtle">
          {title ?? LANGUAGE_LABELS[language]}
        </span>
        <span className="flex items-center gap-2">
          {title ? (
            <span className="font-mono text-[11px] text-fg-faint">{LANGUAGE_LABELS[language]}</span>
          ) : null}
          <CopyButton value={code} label="Copy code" />
        </span>
      </figcaption>
      <Code code={code} language={language} lineNumbers={lineNumbers} className="p-4" />
    </figure>
  );
}
