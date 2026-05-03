import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ── navGroups data tests (extracted for unit testing) ───────────────

const navGroups = [
  {
    label: "Dashboard",
    items: [
      { href: "/", label: "Overview" },
      { href: "/logs", label: "Logs & Events" },
    ],
  },
  {
    label: "Policy & Objects",
    items: [
      { href: "/policies", label: "Security Policies" },
      { href: "/objects/addresses", label: "Addresses" },
      { href: "/objects/services", label: "Services" },
      { href: "/objects/url-categories", label: "URL Categories" },
      { href: "/objects/cloud-apps", label: "Cloud Applications" },
    ],
  },
  {
    label: "Security Profiles",
    items: [
      { href: "/profiles/atp", label: "ATP Profiles" },
      { href: "/profiles/ssl", label: "SSL Inspection" },
      { href: "/profiles/dns", label: "DNS Filter" },
      { href: "/profiles/web", label: "Web Filter" },
    ],
  },
  {
    label: "Identity & Access",
    items: [
      { href: "/identity/users", label: "Users & Groups" },
      { href: "/identity/devices", label: "Devices" },
      { href: "/identity/providers", label: "Identity Providers" },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { href: "/gateways", label: "Gateway Nodes" },
      { href: "/certificates", label: "CA Certificates" },
      { href: "/settings", label: "Settings" },
    ],
  },
];

describe("Navigation Structure", () => {
  it("has 5 nav groups", () => {
    expect(navGroups).toHaveLength(5);
  });

  it("has unique hrefs across all items", () => {
    const hrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it("all hrefs start with /", () => {
    const hrefs = navGroups.flatMap((g) => g.items.map((i) => i.href));
    for (const href of hrefs) {
      expect(href).toMatch(/^\//);
    }
  });

  it("contains required security sections", () => {
    const labels = navGroups.map((g) => g.label);
    expect(labels).toContain("Policy & Objects");
    expect(labels).toContain("Security Profiles");
    expect(labels).toContain("Identity & Access");
    expect(labels).toContain("Infrastructure");
  });

  it("Policy & Objects includes Security Policies", () => {
    const policyGroup = navGroups.find((g) => g.label === "Policy & Objects");
    const itemLabels = policyGroup!.items.map((i) => i.label);
    expect(itemLabels).toContain("Security Policies");
    expect(itemLabels).toContain("Addresses");
    expect(itemLabels).toContain("URL Categories");
  });

  it("Security Profiles includes all profile types", () => {
    const profileGroup = navGroups.find(
      (g) => g.label === "Security Profiles"
    );
    const itemLabels = profileGroup!.items.map((i) => i.label);
    expect(itemLabels).toContain("ATP Profiles");
    expect(itemLabels).toContain("SSL Inspection");
    expect(itemLabels).toContain("DNS Filter");
    expect(itemLabels).toContain("Web Filter");
  });
});

// ── Policy data model tests ────────────────────────────────────────

interface SecurityPolicy {
  id: string;
  name: string;
  sequence: number;
  enabled: boolean;
  action: "allow" | "deny" | "monitor";
  sourceUsers: string[];
  sourceDeviceGroups: string[];
  destURLCategories: string[];
  destCloudApps: string[];
  securityProfiles: {
    atp?: string;
    ssl?: string;
    dns?: string;
  };
}

function sortPoliciesBySequence(policies: SecurityPolicy[]): SecurityPolicy[] {
  return [...policies].sort((a, b) => a.sequence - b.sequence);
}

function evaluateFirstMatch(
  policies: SecurityPolicy[],
  context: { userId: string; deviceGroup: string; destCategory: string }
): SecurityPolicy | null {
  const sorted = sortPoliciesBySequence(policies);
  for (const p of sorted) {
    if (!p.enabled) continue;

    if (p.sourceUsers.length > 0 && !p.sourceUsers.includes(context.userId))
      continue;
    if (
      p.sourceDeviceGroups.length > 0 &&
      !p.sourceDeviceGroups.includes(context.deviceGroup)
    )
      continue;
    if (
      p.destURLCategories.length > 0 &&
      !p.destURLCategories.includes(context.destCategory)
    )
      continue;

    return p;
  }
  return null;
}

describe("Policy Evaluation (first-match-wins)", () => {
  const policies: SecurityPolicy[] = [
    {
      id: "1",
      name: "Block Malware",
      sequence: 1,
      enabled: true,
      action: "deny",
      sourceUsers: [],
      sourceDeviceGroups: [],
      destURLCategories: ["malware", "phishing"],
      destCloudApps: [],
      securityProfiles: { atp: "strict" },
    },
    {
      id: "2",
      name: "Allow SaaS",
      sequence: 2,
      enabled: true,
      action: "allow",
      sourceUsers: [],
      sourceDeviceGroups: ["corporate-managed"],
      destURLCategories: [],
      destCloudApps: ["slack", "office365"],
      securityProfiles: { ssl: "inspect" },
    },
    {
      id: "3",
      name: "Default Allow",
      sequence: 100,
      enabled: true,
      action: "allow",
      sourceUsers: [],
      sourceDeviceGroups: [],
      destURLCategories: [],
      destCloudApps: [],
      securityProfiles: {},
    },
  ];

  it("blocks malware category", () => {
    const result = evaluateFirstMatch(policies, {
      userId: "user-1",
      deviceGroup: "corporate-managed",
      destCategory: "malware",
    });
    expect(result?.action).toBe("deny");
    expect(result?.name).toBe("Block Malware");
  });

  it("falls through to default allow for uncategorized on unmanaged device", () => {
    const result = evaluateFirstMatch(policies, {
      userId: "user-1",
      deviceGroup: "byod",
      destCategory: "news",
    });
    expect(result?.action).toBe("allow");
    expect(result?.name).toBe("Default Allow");
  });

  it("returns null (implicit deny) when no policy matches", () => {
    const restrictive: SecurityPolicy[] = [
      {
        id: "1",
        name: "Only VPN users",
        sequence: 1,
        enabled: true,
        action: "allow",
        sourceUsers: ["vpn-user"],
        sourceDeviceGroups: [],
        destURLCategories: [],
        destCloudApps: [],
        securityProfiles: {},
      },
    ];
    const result = evaluateFirstMatch(restrictive, {
      userId: "random-user",
      deviceGroup: "byod",
      destCategory: "social",
    });
    expect(result).toBeNull();
  });

  it("skips disabled policies", () => {
    const withDisabled: SecurityPolicy[] = [
      { ...policies[0], enabled: false },
      policies[2],
    ];
    const result = evaluateFirstMatch(withDisabled, {
      userId: "user-1",
      deviceGroup: "any",
      destCategory: "malware",
    });
    expect(result?.name).toBe("Default Allow");
  });

  it("respects sequence order regardless of array order", () => {
    const shuffled = [policies[2], policies[0], policies[1]];
    const result = evaluateFirstMatch(shuffled, {
      userId: "user-1",
      deviceGroup: "corporate-managed",
      destCategory: "malware",
    });
    expect(result?.name).toBe("Block Malware");
  });
});

// ── Utility: format bytes ──────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

describe("Formatting Utilities", () => {
  it("formats bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(1073741824)).toBe("1 GB");
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats uptime correctly", () => {
    expect(formatUptime(45)).toBe("45s");
    expect(formatUptime(90)).toBe("1m 30s");
    expect(formatUptime(3661)).toBe("1h 1m");
  });
});
