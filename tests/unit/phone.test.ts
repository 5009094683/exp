import { describe, expect, it } from "vitest";
import { telHref } from "@/lib/phone";

describe("telHref", () => {
  it("keeps the digits and the international prefix", () => {
    expect(telHref("+1 415 555 0100")).toBe("tel:+14155550100");
    expect(telHref("+1 (415) 555-0100")).toBe("tel:+14155550100");
    expect(telHref("415.555.0100")).toBe("tel:4155550100");
  });

  it("drops a trunk prefix written as (0)", () => {
    expect(telHref("+44 (0)20 7946 0958")).toBe("tel:+442079460958");
  });
});
