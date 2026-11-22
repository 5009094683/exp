/**
 * Small, dependency-free syntax highlighter for the few languages the site
 * shows (YAML manifests, JSON payloads, shell and HTTP examples). It runs on
 * the server and in the browser, so generated snippets can be highlighted live.
 */

export type TokenType = "key" | "str" | "num" | "kw" | "com" | "punc" | "var" | "fn";
export type Token = { type?: TokenType; text: string };
export type CodeLanguage = "yaml" | "json" | "bash" | "http" | "text";

const KEYWORDS = new Set(["true", "false", "null", "yes", "no", "on", "off", "~"]);
const NUMBER = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;

function scalar(text: string): Token[] {
  const trimmed = text.trim();
  if (trimmed === "") return [{ text }];

  const leading = text.slice(0, text.indexOf(trimmed));
  const trailing = text.slice(leading.length + trimmed.length);

  let type: TokenType = "str";
  if (KEYWORDS.has(trimmed.toLowerCase())) type = "kw";
  else if (NUMBER.test(trimmed)) type = "num";
  else if (trimmed === "|" || trimmed === ">" || trimmed === "|-" || trimmed === ">-")
    type = "punc";

  const tokens: Token[] = [];
  if (leading) tokens.push({ text: leading });
  tokens.push({ type, text: trimmed });
  if (trailing) tokens.push({ text: trailing });
  return tokens;
}

/** Splits a YAML value into flow punctuation, quoted strings and plain scalars. */
function yamlValue(value: string): Token[] {
  const tokens: Token[] = [];
  const pattern =
    /("(?:\\.|[^"\\])*"|'(?:''|[^'])*')|([[\]{},])|(\$\{\{?[^}]*\}?\}|\{\{[^}]*\}\})/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(value)) !== null) {
    if (match.index > cursor) tokens.push(...flowScalar(value.slice(cursor, match.index)));
    if (match[1]) tokens.push({ type: "str", text: match[1] });
    else if (match[2]) tokens.push({ type: "punc", text: match[2] });
    else tokens.push({ type: "var", text: match[3] });
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) tokens.push(...flowScalar(value.slice(cursor)));
  return tokens;
}

/** Inside flow collections, `key: value` pairs can appear on one line. */
function flowScalar(text: string): Token[] {
  const pair = /^(\s*)([\w.\-/]+)(:)(\s+)(.*)$/.exec(text);
  if (pair) {
    return [
      { text: pair[1] },
      { type: "key", text: pair[2] },
      { type: "punc", text: pair[3] },
      { text: pair[4] },
      ...scalar(pair[5]),
    ];
  }
  return scalar(text);
}

function splitComment(line: string): [code: string, comment: string] {
  let quote: string | null = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (char === "\\" && quote === '"') index += 1;
      else if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "#" && (index === 0 || /\s/.test(line[index - 1]))) {
      return [line.slice(0, index), line.slice(index)];
    }
  }
  return [line, ""];
}

function highlightYaml(code: string): Token[][] {
  let blockIndent: number | null = null;

  return code.split("\n").map((line) => {
    const indent = line.length - line.trimStart().length;

    if (blockIndent !== null) {
      if (line.trim() === "" || indent > blockIndent) return [{ type: "str", text: line }];
      blockIndent = null;
    }

    const [body, comment] = splitComment(line);
    const tokens: Token[] = [];

    const match = /^(\s*)(-\s+)?(?:([\w.\-/$@]+|"[^"]*"|'[^']*')(\s*:)(?=\s|$))?(.*)$/.exec(body);
    if (match) {
      const [, lead, dash, key, colon, rest] = match;
      if (lead) tokens.push({ text: lead });
      if (dash) tokens.push({ type: "punc", text: dash });
      if (key) {
        tokens.push({ type: "key", text: key }, { type: "punc", text: colon });
        if (/^\s*[|>]-?\s*$/.test(rest)) blockIndent = indent;
      }
      if (rest) tokens.push(...yamlValue(rest));
    } else if (body) {
      tokens.push({ text: body });
    }

    if (comment) tokens.push({ type: "com", text: comment });
    return tokens.length > 0 ? tokens : [{ text: "" }];
  });
}

function highlightJsonLine(line: string): Token[] {
  const tokens: Token[] = [];
  const pattern =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > cursor) tokens.push({ text: line.slice(cursor, match.index) });
    if (match[1]) {
      tokens.push({ type: match[2] ? "key" : "str", text: match[1] });
      if (match[2]) tokens.push({ type: "punc", text: match[2] });
    } else if (match[3]) tokens.push({ type: "kw", text: match[3] });
    else if (match[4]) tokens.push({ type: "num", text: match[4] });
    else tokens.push({ type: "punc", text: match[5] });
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) tokens.push({ text: line.slice(cursor) });
  return tokens.length > 0 ? tokens : [{ text: "" }];
}

function highlightBashLine(line: string): Token[] {
  const [body, comment] = splitComment(line);
  const tokens: Token[] = [];
  const pattern =
    /("(?:\\.|[^"\\])*"|'[^']*')|(\$\{[^}]+\}|\$[A-Za-z_]\w*)|((?<=^|\s)--?[A-Za-z][\w-]*)|(\\$|\|\||&&|\|)/g;
  let cursor = 0;
  let expectCommand = true;
  let match: RegExpExecArray | null;

  const pushPlain = (text: string) => {
    if (!expectCommand) {
      tokens.push({ text });
      return;
    }
    const word = /^(\s*)([\w./-]+)(.*)$/s.exec(text);
    if (word) {
      if (word[1]) tokens.push({ text: word[1] });
      tokens.push({ type: "fn", text: word[2] });
      if (word[3]) tokens.push({ text: word[3] });
      expectCommand = false;
    } else {
      tokens.push({ text });
    }
  };

  while ((match = pattern.exec(body)) !== null) {
    if (match.index > cursor) pushPlain(body.slice(cursor, match.index));
    if (match[1]) tokens.push({ type: "str", text: match[1] });
    else if (match[2]) tokens.push({ type: "var", text: match[2] });
    else if (match[3]) tokens.push({ type: "kw", text: match[3] });
    else {
      tokens.push({ type: "punc", text: match[4] });
      if (match[4] !== "\\") expectCommand = true;
    }
    if (match[1] || match[2] || match[3]) expectCommand = false;
    cursor = match.index + match[0].length;
  }
  if (cursor < body.length) pushPlain(body.slice(cursor));
  if (comment) tokens.push({ type: "com", text: comment });
  return tokens.length > 0 ? tokens : [{ text: "" }];
}

function highlightBash(code: string): Token[][] {
  let continued = false;
  return code.split("\n").map((line) => {
    // A line that continues the previous command starts with arguments, not a command.
    const tokens = continued
      ? highlightBashLine(` ${line}`).map((token, index) =>
          index === 0 ? { ...token, text: token.text.slice(1) } : token,
        )
      : highlightBashLine(line);
    continued = /\\\s*$/.test(line);
    return tokens.filter((token, index) => token.text !== "" || index === 0);
  });
}

function highlightHttp(code: string): Token[][] {
  let inBody = false;
  return code.split("\n").map((line, index) => {
    if (inBody) return highlightJsonLine(line);
    if (line.trim() === "") {
      inBody = true;
      return [{ text: line }];
    }
    if (index === 0) {
      const request = /^([A-Z]+)(\s+)(\S+)(.*)$/.exec(line);
      if (request) {
        return [
          { type: "kw", text: request[1] },
          { text: request[2] },
          { type: "fn", text: request[3] },
          { type: "com", text: request[4] },
        ];
      }
      const status = /^(HTTP\/[\d.]+)(\s+)(\d{3})(.*)$/.exec(line);
      if (status) {
        return [
          { type: "com", text: status[1] },
          { text: status[2] },
          { type: "num", text: status[3] },
          { type: "kw", text: status[4] },
        ];
      }
    }
    const header = /^([\w-]+)(:)(.*)$/.exec(line);
    if (header) {
      return [
        { type: "key", text: header[1] },
        { type: "punc", text: header[2] },
        { type: "str", text: header[3] },
      ];
    }
    return [{ text: line }];
  });
}

/** Tokenizes `code` into lines of tokens for rendering. */
export function highlight(code: string, language: CodeLanguage): Token[][] {
  switch (language) {
    case "yaml":
      return highlightYaml(code);
    case "json":
      return code.split("\n").map(highlightJsonLine);
    case "bash":
      return highlightBash(code);
    case "http":
      return highlightHttp(code);
    default:
      return code.split("\n").map((line) => [{ text: line }]);
  }
}
