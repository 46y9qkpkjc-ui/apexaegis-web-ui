import { describe, it, expect } from "vitest";
import { isMspUser } from "@/lib/auth-store";
import { brandForUser } from "@/lib/brands";

// The MSP demo hinges on the client distinguishing an operator (April/StarHub)
// from a single-tenant consumer (Samuel/Aspire). These lock that split: what the
// tenant switcher, partner ladder, consolidated overview, and welcome banner key
// off (isMspUser) and what skins the console (brandForUser).
describe("isMspUser", () => {
  const april = { role: "org_admin", operator_scope: "StarHub" };
  const samuel = { role: "org_admin", operator_scope: undefined };
  const superAdmin = { role: "super_admin" };

  it("treats an operator-scoped user as MSP (April/StarHub)", () => {
    expect(isMspUser(april)).toBe(true);
  });
  it("treats the platform super_admin as MSP", () => {
    expect(isMspUser(superAdmin)).toBe(true);
  });
  it("treats a plain tenant admin as a single-tenant consumer (Samuel/Aspire)", () => {
    expect(isMspUser(samuel)).toBe(false);
  });
  it("treats an empty/whitespace operator_scope as non-MSP", () => {
    expect(isMspUser({ role: "org_admin", operator_scope: "  " })).toBe(false);
  });
  it("handles null/undefined", () => {
    expect(isMspUser(null)).toBe(false);
    expect(isMspUser(undefined)).toBe(false);
  });
});

describe("brandForUser", () => {
  it("skins an operator to their operator brand (April -> starhub)", () => {
    expect(brandForUser({ email: "april.woon.starhub@apexaegis.app", operator_scope: "StarHub" })).toBe("starhub");
  });
  it("skins a consumer via the email map (Samuel -> aspire)", () => {
    expect(brandForUser({ email: "samuel.aspire@apexaegis.app" })).toBe("aspire");
  });
  it("falls back to apexaegis for unknown users", () => {
    expect(brandForUser({ email: "nobody@example.com" })).toBe("apexaegis");
    expect(brandForUser(null)).toBe("apexaegis");
  });
});
