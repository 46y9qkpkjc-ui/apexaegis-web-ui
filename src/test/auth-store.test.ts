import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/lib/auth-store";

describe("Auth Store", () => {
  beforeEach(() => {
    // Reset store between tests
    useAuthStore.setState({
      step: "detecting",
      ssoProbe: { kerberos: false, microsoft: false, checked: false },
      ssoMethod: "none",
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  });

  it("initializes with detecting step", () => {
    const state = useAuthStore.getState();
    expect(state.step).toBe("detecting");
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it("sets step correctly", () => {
    useAuthStore.getState().setStep("sso-prompt");
    expect(useAuthStore.getState().step).toBe("sso-prompt");
  });

  it("sets SSO probe results", () => {
    useAuthStore.getState().setSsoProbe({ kerberos: true, checked: true });
    const probe = useAuthStore.getState().ssoProbe;
    expect(probe.kerberos).toBe(true);
    expect(probe.checked).toBe(true);
    expect(probe.microsoft).toBe(false); // unchanged
  });

  it("sets SSO method", () => {
    useAuthStore.getState().setSsoMethod("kerberos");
    expect(useAuthStore.getState().ssoMethod).toBe("kerberos");
  });

  it("signs in and updates user state", () => {
    const user = {
      email: "admin@apexaegis.io",
      name: "Admin User",
      role: "administrator",
    };
    useAuthStore.getState().signIn(user);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
  });

  it("signs out and resets all state", () => {
    // Sign in first
    useAuthStore.getState().signIn({
      email: "test@test.com",
      name: "Test",
      role: "viewer",
    });
    useAuthStore.getState().setSsoMethod("microsoft");
    useAuthStore.getState().setStep("mfa");
    useAuthStore.getState().setSsoProbe({ kerberos: true, checked: true });

    // Sign out
    useAuthStore.getState().signOut();
    const state = useAuthStore.getState();

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.step).toBe("detecting");
    expect(state.ssoMethod).toBe("none");
    expect(state.ssoProbe).toEqual({
      kerberos: false,
      microsoft: false,
      checked: false,
    });
  });

  it("handles all SSO method types", () => {
    const methods = [
      "kerberos",
      "microsoft",
      "saml",
      "credentials",
      "none",
    ] as const;
    for (const method of methods) {
      useAuthStore.getState().setSsoMethod(method);
      expect(useAuthStore.getState().ssoMethod).toBe(method);
    }
  });

  it("handles all auth step types", () => {
    const steps = [
      "detecting",
      "sso-prompt",
      "credentials",
      "mfa",
    ] as const;
    for (const step of steps) {
      useAuthStore.getState().setStep(step);
      expect(useAuthStore.getState().step).toBe(step);
    }
  });
});
