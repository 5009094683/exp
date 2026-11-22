import { describe, expect, it } from "vitest";
import { handleLeadRequest } from "@/server/leads/handler";

describe("handleLeadRequest", () => {
  it("answers with JSON", async () => {
    const response = await handleLeadRequest(
      new Request("https://example.com/api/early-access", { method: "POST" }),
    );
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
