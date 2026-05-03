import { describe, it, expect } from 'vitest';

// ── SecurityPolicy interface matching page.tsx ─────────────────────

interface SecurityPolicy {
  id: string;
  seq: number;
  name: string;
  enabled: boolean;
  trafficSteering: string;
  accessMethod: string[];
  sourceUsers: string[];
  sourceDeviceGroups: string[];
  sourceAddresses: string[];
  destAddresses: string[];
  destCloudApps: string[];
  destUrlCategories: string[];
  services: string[];
  httpMethods: string[];
  atpProfile: string | null;
  sslProfile: string | null;
  dnsFilterList: string | null;
  contentInspection: unknown | null;
  activityControls: unknown | null;
  wafConfig: unknown | null;
  iapConfig: unknown | null;
  action: 'allow' | 'deny' | 'monitor';
  logTraffic: boolean;
}

// ── Helper functions mirroring page.tsx handlers ───────────────────

function createPolicy(
  policies: SecurityPolicy[],
  newPolicy: SecurityPolicy,
  insertPosition?: { refId: string; position: 'before' | 'after' },
): SecurityPolicy[] {
  if (insertPosition) {
    const idx = policies.findIndex(p => p.id === insertPosition.refId);
    if (idx < 0) return [...policies, newPolicy].map((p, i) => ({ ...p, seq: i + 1 }));
    const updated = [...policies];
    const insertIdx = insertPosition.position === 'before' ? idx : idx + 1;
    updated.splice(insertIdx, 0, newPolicy);
    return updated.map((p, i) => ({ ...p, seq: i + 1 }));
  }
  return [...policies, newPolicy].map((p, i) => ({ ...p, seq: i + 1 }));
}

function deletePolicy(policies: SecurityPolicy[], id: string): SecurityPolicy[] {
  return policies.filter(p => p.id !== id).map((p, i) => ({ ...p, seq: i + 1 }));
}

function togglePolicy(policies: SecurityPolicy[], id: string): SecurityPolicy[] {
  return policies.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
}

function clonePolicy(policies: SecurityPolicy[], id: string): SecurityPolicy[] {
  const source = policies.find(p => p.id === id);
  if (!source) return policies;
  const cloned: SecurityPolicy = {
    ...source,
    id: String(Date.now()),
    name: source.name + ' (Copy)',
    seq: policies.length + 1,
  };
  const idx = policies.findIndex(p => p.id === id);
  const updated = [...policies];
  updated.splice(idx + 1, 0, cloned);
  return updated.map((p, i) => ({ ...p, seq: i + 1 }));
}

function moveUp(policies: SecurityPolicy[], id: string): SecurityPolicy[] {
  const idx = policies.findIndex(p => p.id === id);
  if (idx <= 0) return policies;
  const updated = [...policies];
  [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
  return updated.map((p, i) => ({ ...p, seq: i + 1 }));
}

function moveDown(policies: SecurityPolicy[], id: string): SecurityPolicy[] {
  const idx = policies.findIndex(p => p.id === id);
  if (idx < 0 || idx >= policies.length - 1) return policies;
  const updated = [...policies];
  [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
  return updated.map((p, i) => ({ ...p, seq: i + 1 }));
}

function reorderViaDragDrop(
  policies: SecurityPolicy[],
  draggedId: string,
  targetId: string,
): SecurityPolicy[] {
  if (draggedId === targetId) return policies;
  const fromIdx = policies.findIndex(p => p.id === draggedId);
  const toIdx = policies.findIndex(p => p.id === targetId);
  if (fromIdx < 0 || toIdx < 0) return policies;
  const updated = [...policies];
  const [moved] = updated.splice(fromIdx, 1);
  updated.splice(toIdx, 0, moved);
  return updated.map((p, i) => ({ ...p, seq: i + 1 }));
}

// ── Test fixtures ──────────────────────────────────────────────────

function makePolicy(overrides: Partial<SecurityPolicy> = {}): SecurityPolicy {
  return {
    id: '1',
    seq: 1,
    name: 'Test Policy',
    enabled: true,
    trafficSteering: 'internet',
    accessMethod: ['browser'],
    sourceUsers: ['All Users'],
    sourceDeviceGroups: ['All Devices'],
    sourceAddresses: ['any'],
    destAddresses: ['any'],
    destCloudApps: [],
    destUrlCategories: [],
    services: ['HTTPS'],
    httpMethods: [],
    atpProfile: null,
    sslProfile: null,
    dnsFilterList: null,
    contentInspection: null,
    activityControls: null,
    wafConfig: null,
    iapConfig: null,
    action: 'allow',
    logTraffic: true,
    ...overrides,
  };
}

const demoPolicies: SecurityPolicy[] = [
  makePolicy({ id: '1', seq: 1, name: 'Block Malware', action: 'deny',
    destUrlCategories: ['Malware', 'Phishing'], atpProfile: 'Default-ATP' }),
  makePolicy({ id: '2', seq: 2, name: 'Allow SaaS', action: 'allow',
    destCloudApps: ['Microsoft 365', 'Slack'], sslProfile: 'Full Inspection' }),
  makePolicy({ id: '3', seq: 3, name: 'Block NRD', action: 'deny',
    destUrlCategories: ['Newly Registered Domains'] }),
  makePolicy({ id: '4', seq: 4, name: 'Default Allow', action: 'allow' }),
];

// ── CRUD Tests ─────────────────────────────────────────────────────

describe('Policy CRUD — Create', () => {
  it('appends new policy at end', () => {
    const newPolicy = makePolicy({ id: '5', name: 'New Rule' });
    const result = createPolicy(demoPolicies, newPolicy);
    expect(result).toHaveLength(5);
    expect(result[4].name).toBe('New Rule');
    expect(result[4].seq).toBe(5);
  });

  it('inserts before a specific policy', () => {
    const newPolicy = makePolicy({ id: '5', name: 'Inserted Before SaaS' });
    const result = createPolicy(demoPolicies, newPolicy, { refId: '2', position: 'before' });
    expect(result).toHaveLength(5);
    expect(result[1].name).toBe('Inserted Before SaaS');
    expect(result[1].seq).toBe(2);
    expect(result[2].name).toBe('Allow SaaS');
    expect(result[2].seq).toBe(3);
  });

  it('inserts after a specific policy', () => {
    const newPolicy = makePolicy({ id: '5', name: 'Inserted After SaaS' });
    const result = createPolicy(demoPolicies, newPolicy, { refId: '2', position: 'after' });
    expect(result).toHaveLength(5);
    expect(result[2].name).toBe('Inserted After SaaS');
    expect(result[2].seq).toBe(3);
  });

  it('appends at end if insert ref not found', () => {
    const newPolicy = makePolicy({ id: '5', name: 'Fallback Append' });
    const result = createPolicy(demoPolicies, newPolicy, { refId: 'nonexistent', position: 'before' });
    expect(result).toHaveLength(5);
    expect(result[4].name).toBe('Fallback Append');
  });

  it('sequences are renumbered after insert', () => {
    const newPolicy = makePolicy({ id: '5', name: 'Mid Insert' });
    const result = createPolicy(demoPolicies, newPolicy, { refId: '1', position: 'after' });
    for (let i = 0; i < result.length; i++) {
      expect(result[i].seq).toBe(i + 1);
    }
  });
});

describe('Policy CRUD — Delete', () => {
  it('removes policy by id', () => {
    const result = deletePolicy(demoPolicies, '2');
    expect(result).toHaveLength(3);
    expect(result.find(p => p.id === '2')).toBeUndefined();
  });

  it('renumbers sequences after delete', () => {
    const result = deletePolicy(demoPolicies, '2');
    expect(result[0].seq).toBe(1);
    expect(result[1].seq).toBe(2);
    expect(result[2].seq).toBe(3);
  });

  it('no-op for nonexistent id', () => {
    const result = deletePolicy(demoPolicies, 'nonexistent');
    expect(result).toHaveLength(4);
  });

  it('can delete all policies', () => {
    let result = demoPolicies;
    for (const p of demoPolicies) {
      result = deletePolicy(result, p.id);
    }
    expect(result).toHaveLength(0);
  });
});

describe('Policy CRUD — Toggle Enable/Disable', () => {
  it('disables an enabled policy', () => {
    const result = togglePolicy(demoPolicies, '1');
    expect(result[0].enabled).toBe(false);
  });

  it('enables a disabled policy', () => {
    const disabled = demoPolicies.map(p => p.id === '3' ? { ...p, enabled: false } : p);
    const result = togglePolicy(disabled, '3');
    expect(result[2].enabled).toBe(true);
  });

  it('only toggles the targeted policy', () => {
    const result = togglePolicy(demoPolicies, '1');
    expect(result[1].enabled).toBe(true);
    expect(result[2].enabled).toBe(true);
    expect(result[3].enabled).toBe(true);
  });
});

describe('Policy CRUD — Clone', () => {
  it('creates a copy with (Copy) suffix', () => {
    const result = clonePolicy(demoPolicies, '2');
    expect(result).toHaveLength(5);
    const cloned = result[2]; // inserted after original position
    expect(cloned.name).toBe('Allow SaaS (Copy)');
    expect(cloned.id).not.toBe('2');
  });

  it('places clone immediately after original', () => {
    const result = clonePolicy(demoPolicies, '1');
    expect(result[0].name).toBe('Block Malware');
    expect(result[1].name).toBe('Block Malware (Copy)');
    expect(result[2].name).toBe('Allow SaaS');
  });

  it('renumbers sequences after clone', () => {
    const result = clonePolicy(demoPolicies, '1');
    for (let i = 0; i < result.length; i++) {
      expect(result[i].seq).toBe(i + 1);
    }
  });

  it('clone inherits action and profiles', () => {
    const result = clonePolicy(demoPolicies, '2');
    const cloned = result[2];
    expect(cloned.action).toBe('allow');
    expect(cloned.sslProfile).toBe('Full Inspection');
    expect(cloned.destCloudApps).toEqual(['Microsoft 365', 'Slack']);
  });

  it('no-op for nonexistent id', () => {
    const result = clonePolicy(demoPolicies, 'nonexistent');
    expect(result).toHaveLength(4);
  });
});

describe('Policy CRUD — Reorder (Move Up/Down)', () => {
  it('moves policy up', () => {
    const result = moveUp(demoPolicies, '3');
    expect(result[1].name).toBe('Block NRD');
    expect(result[2].name).toBe('Allow SaaS');
    expect(result[1].seq).toBe(2);
    expect(result[2].seq).toBe(3);
  });

  it('move up first item is no-op', () => {
    const result = moveUp(demoPolicies, '1');
    expect(result[0].name).toBe('Block Malware');
  });

  it('moves policy down', () => {
    const result = moveDown(demoPolicies, '2');
    expect(result[1].name).toBe('Block NRD');
    expect(result[2].name).toBe('Allow SaaS');
  });

  it('move down last item is no-op', () => {
    const result = moveDown(demoPolicies, '4');
    expect(result[3].name).toBe('Default Allow');
  });
});

describe('Policy CRUD — Drag & Drop Reorder', () => {
  it('moves first to last position', () => {
    const result = reorderViaDragDrop(demoPolicies, '1', '4');
    expect(result[0].name).toBe('Allow SaaS');
    expect(result[3].name).toBe('Block Malware');
    expect(result[3].seq).toBe(4);
  });

  it('moves last to first position', () => {
    const result = reorderViaDragDrop(demoPolicies, '4', '1');
    expect(result[0].name).toBe('Default Allow');
    expect(result[0].seq).toBe(1);
    expect(result[1].name).toBe('Block Malware');
  });

  it('same source and target is no-op', () => {
    const result = reorderViaDragDrop(demoPolicies, '2', '2');
    expect(result).toEqual(demoPolicies);
  });

  it('invalid ids are no-op', () => {
    const result = reorderViaDragDrop(demoPolicies, 'x', '1');
    expect(result).toEqual(demoPolicies);
  });

  it('sequences renumbered after drag', () => {
    const result = reorderViaDragDrop(demoPolicies, '3', '1');
    for (let i = 0; i < result.length; i++) {
      expect(result[i].seq).toBe(i + 1);
    }
  });
});

describe('Policy Data Model Validation', () => {
  it('actions are limited to allow/deny/monitor', () => {
    const validActions = ['allow', 'deny', 'monitor'] as const;
    for (const policy of demoPolicies) {
      expect(validActions as readonly string[]).toContain(policy.action);
    }
  });

  it('sequences are sequential starting from 1', () => {
    for (let i = 0; i < demoPolicies.length; i++) {
      expect(demoPolicies[i].seq).toBe(i + 1);
    }
  });

  it('IDs are unique', () => {
    const ids = demoPolicies.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('names are non-empty strings', () => {
    for (const p of demoPolicies) {
      expect(p.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('trafficSteering is set', () => {
    for (const p of demoPolicies) {
      expect(p.trafficSteering).toBeTruthy();
    }
  });
});
