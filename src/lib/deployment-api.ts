/**
 * Deployment API Client
 * License consumption is based on active mTLS device registrations.
 */
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

export interface DeploymentInfo {
  org_id: string;
  tenant_id: string;
  subscription_licenses: number;
  licenses_consumed: number;
  licenses_available: number;
}

export async function getDeploymentInfo(): Promise<DeploymentInfo> {
  const token = useAuthStore.getState().accessToken ?? '';
  const response = await fetch(apiUrl('/api/v1/admin/organization/deployment-info'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get deployment info: HTTP ${response.status}`);
  }

  return response.json();
}
