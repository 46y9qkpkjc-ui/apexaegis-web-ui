import { useAuthStore } from '@/lib/auth-store';

function authHeader() {
  const token = useAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token ?? ''}` };
}

export interface DeviceRow {
  device_id: string;
  hostname: string;
  os_type: string;
  os_version: string;
  compliance_status: string;
  managed_type: string; // corporate | byod
  last_seen: string;
  tenant_name: string;
  tenant_id: string;
}

export async function fetchDevices(tenantId?: string): Promise<DeviceRow[]> {
  const url = tenantId
    ? `/api/v1/admin/devices-inventory?tenant_id=${encodeURIComponent(tenantId)}`
    : '/api/v1/admin/devices-inventory';
  const res = await fetch(url, { headers: authHeader() });
  if (!res.ok) throw new Error(`Failed to load devices: ${res.status}`);
  return (await res.json()).devices ?? [];
}
