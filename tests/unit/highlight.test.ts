import { describe, expect, it } from "vitest";
import { highlight, type CodeLanguage, type Token } from "@/lib/highlight";

const text = (lines: Token[][]) =>
  lines.map((line) => line.map((token) => token.text).join("")).join("\n");

const typesOf = (line: Token[]) =>
  line.filter((token) => token.type).map((token) => `${token.type}:${token.text}`);

describe("highlight", () => {
  const samples: Array<[CodeLanguage, string]> = [
    [
      "yaml",
      "name: support-triage # inline comment\nsteps:\n  - id: classify\n    retry: { attempts: 3, backoff: exponential }\n    when: \"priority == 'p1'\"\n  prompt: |\n    Summarize the ticket.\n    Be brief.\n  enabled: true",
    ],
    ["json", '{\n  "id": "evt_01",\n  "ok": true,\n  "count": 3,\n  "tags": ["a", null]\n}'],
    [
      "bash",
      'curl https://api.example.com/v1/runs \\\n  -H "Authorization: Bearer $API_KEY" \\\n  --data \'{"agent":"support-triage"}\' # start a run',
    ],
    [
      "http",
      'POST /v1/runs HTTP/1.1\nHost: api.example.com\nContent-Type: application/json\n\n{ "agent": "support-triage" }',
    ],
    ["text", "plain\ntext"],
  ];

  it.each(samples)("preserves the source text for %s", (language, code) => {
    expect(text(highlight(code, language))).toBe(code);
  });

  it("classifies YAML keys, scalars and comments", () => {
    const [first, , third] = highlight(samples[0][1], "yaml");
    expect(typesOf(first)).toEqual([
      "key:name",
      "punc::",
      "str:support-triage",
      "com:# inline comment",
    ]);
    expect(typesOf(third)).toEqual(["punc:- ", "key:id", "punc::", "str:classify"]);
  });

  it("classifies YAML flow mappings, numbers and booleans", () => {
    const lines = highlight(samples[0][1], "yaml");
    expect(typesOf(lines[3])).toContain("num:3");
    expect(typesOf(lines[3])).toContain("key:attempts");
    expect(typesOf(lines[8])).toEqual(["key:enabled", "punc::", "kw:true"]);
  });

  it("treats YAML block scalars as strings until the indentation ends", () => {
    const lines = highlight(samples[0][1], "yaml");
    expect(lines[6]).toEqual([{ type: "str", text: "    Summarize the ticket." }]);
    expect(lines[7]).toEqual([{ type: "str", text: "    Be brief." }]);
    expect(typesOf(lines[8])[0]).toBe("key:enabled");
  });

  it("does not treat a # inside quotes as a comment", () => {
    const [line] = highlight('color: "#6366f1"', "yaml");
    expect(typesOf(line)).toEqual(["key:color", "punc::", 'str:"#6366f1"']);
  });

  it("distinguishes JSON keys from string values", () => {
    const lines = highlight(samples[1][1], "json");
    expect(typesOf(lines[1])).toEqual(['key:"id"', "punc::", 'str:"evt_01"', "punc:,"]);
    expect(typesOf(lines[2])).toContain("kw:true");
    expect(typesOf(lines[3])).toContain("num:3");
  });

  it("marks shell commands, flags, strings and variables", () => {
    const lines = highlight(samples[2][1], "bash");
    expect(typesOf(lines[0])[0]).toBe("fn:curl");
    expect(typesOf(lines[1])).toContain("kw:-H");
    expect(typesOf(lines[2])).toContain("kw:--data");
    expect(typesOf(lines[2]).at(-1)).toBe("com:# start a run");
    // Continuation lines hold arguments, not a new command.
    expect(typesOf(lines[1]).some((entry) => entry.startsWith("fn:"))).toBe(false);
  });

  it("highlights an HTTP request line, headers and a JSON body", () => {
    const lines = highlight(samples[3][1], "http");
    expect(typesOf(lines[0]).slice(0, 2)).toEqual(["kw:POST", "fn:/v1/runs"]);
    expect(typesOf(lines[1])[0]).toBe("key:Host");
    expect(typesOf(lines[4])).toContain('key:"agent"');
  });
});
