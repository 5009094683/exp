import { describe, expect, it } from "vitest";
import { contrast, deriveAccent, parseHex, toHex } from "@/lib/color";

const background = "#07080a";

describe("parseHex", () => {
  it("parses long and short hex colors", () => {
    expect(parseHex("#6366f1")).toEqual({ r: 99, g: 102, b: 241 });
    expect(parseHex("#0af")).toEqual({ r: 0, g: 170, b: 255 });
    expect(parseHex("6366F1")).toEqual({ r: 99, g: 102, b: 241 });
  });

  it("rejects anything that is not a hex color", () => {
    expect(parseHex("indigo")).toBeNull();
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("rgb(0,0,0)")).toBeNull();
  });

  it("round-trips through toHex", () => {
    expect(toHex(parseHex("#0ea5e9")!)).toBe("#0ea5e9");
  });
});

describe("deriveAccent", () => {
  it.each(["#6366f1", "#0ea5e9", "#22c55e", "#f97316", "#e11d48", "#1e3a8a", "#facc15"])(
    "keeps accent text readable on the page background for %s",
    (accent) => {
      const palette = deriveAccent(accent, background);
      expect(contrast(parseHex(palette.text)!, parseHex(background)!)).toBeGreaterThanOrEqual(6);
    },
  );

  it("picks white text on dark fills and dark text on light fills", () => {
    expect(deriveAccent("#1e3a8a", background).contrast).toBe("#ffffff");
    expect(deriveAccent("#facc15", background).contrast).not.toBe("#ffffff");
  });

  it("keeps the configured color as the base fill", () => {
    expect(deriveAccent("#0EA5E9", background).base).toBe("#0ea5e9");
  });

  it("throws on invalid input", () => {
    expect(() => deriveAccent("blue", background)).toThrow();
  });
});
