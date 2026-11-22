import type { CodeSample } from "@/content/samples";

/**
 * Documentation pages are data, not markup, so headings, links and code
 * samples can be checked in tests. Text supports three inline forms:
 * `code`, **strong** and [links](/path).
 */
export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "code"; sample: CodeSample }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "cards"; items: Array<{ title: string; description: string; href: string }> }
  | { type: "address"; name: string; lines: string[] };

export type DocPage = {
  slug: string;
  title: string;
  description: string;
  blocks: DocBlock[];
};
