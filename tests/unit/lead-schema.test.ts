import { describe, expect, it } from "vitest";
import { describeLead, validateLead } from "@/lib/leads/schema";

const earlyAccess = {
  email: "jane@initech.com",
  name: "Jane Doe",
  company: "Initech",
  source: "hero",
  page: "/",
};

describe("validateLead", () => {
  it("accepts a minimal early-access request", () => {
    const result = validateLead("early-access", earlyAccess);
    expect(result).toEqual({
      ok: true,
      lead: {
        kind: "early-access",
        fields: { email: "jane@initech.com", name: "Jane Doe", company: "Initech" },
        source: "hero",
        page: "/",
      },
    });
  });

  it("trims values and drops empty optional fields", () => {
    const result = validateLead("early-access", {
      ...earlyAccess,
      name: "  Jane Doe  ",
      role: "   ",
      useCase: "Customer support",
    });
    expect(result.ok && result.lead.fields).toEqual({
      email: "jane@initech.com",
      name: "Jane Doe",
      company: "Initech",
      useCase: "Customer support",
    });
  });

  it("reports each missing required field", () => {
    const result = validateLead("early-access", {});
    expect(result).toEqual({
      ok: false,
      errors: {
        email: "Enter your work email.",
        name: "Enter your full name.",
        company: "Enter your company.",
      },
    });
  });

  it("rejects malformed emails, unknown options and over-long text", () => {
    const result = validateLead("early-access", {
      ...earlyAccess,
      email: "jane@initech",
      companySize: "huge",
      message: "x".repeat(2001),
    });
    expect(result).toEqual({
      ok: false,
      errors: {
        email: "Enter a valid email address.",
        companySize: "Choose one of the listed options.",
        message: "Notes must be 2,000 characters or fewer.",
      },
    });
  });

  it("ignores fields that are not part of the form", () => {
    const result = validateLead("early-access", { ...earlyAccess, admin: "true", id: 7 });
    expect(result.ok && Object.keys(result.lead.fields)).toEqual(["email", "name", "company"]);
  });

  it("requires a topic and message for contact requests", () => {
    const result = validateLead("contact", { email: "jane@initech.com", name: "Jane Doe" });
    expect(result).toEqual({
      ok: false,
      errors: { topic: "Choose a topic.", message: "Enter your message." },
    });
  });

  it("strips control characters and sanitizes the source", () => {
    const result = validateLead("contact", {
      email: "jane@initech.com",
      name: "Jane\u0000 Doe\u001b",
      topic: "Sales",
      message: "Line one\nLine two",
      source: "console:deploy-agent<script>",
      page: "/console/agents/new",
    });
    expect(result.ok && result.lead).toMatchObject({
      fields: { name: "Jane Doe", message: "Line one\nLine two" },
      source: "console:deploy-agentscript",
      page: "/console/agents/new",
    });
  });

  it("handles input that is not an object", () => {
    expect(validateLead("contact", null).ok).toBe(false);
    expect(validateLead("contact", "text").ok).toBe(false);
  });
});

describe("describeLead", () => {
  it("lists filled fields with their labels in form order", () => {
    const result = validateLead("early-access", {
      ...earlyAccess,
      agents: "100-1,000",
      role: "VP Engineering",
    });
    if (!result.ok) throw new Error("expected a valid lead");
    expect(describeLead(result.lead)).toEqual([
      { label: "Work email", value: "jane@initech.com" },
      { label: "Full name", value: "Jane Doe" },
      { label: "Company", value: "Initech" },
      { label: "Role", value: "VP Engineering" },
      { label: "Agents planned", value: "100-1,000" },
    ]);
  });
});
