/**
 * Deployment API Client
 * License consumption is based on active mTLS device registrations.
 */

export interface DeploymentInfo {
  org_id: string;
  tenant_id: string;
  subscription_licenses: number;
  licenses_consumed: number;
  licenses_available: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function getDeploymentInfo(): Promise<DeploymentInfo> {
  const response = await fetch(`${API_BASE}/v1/admin/organization/deployment-info`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get deployment info');
  }

  return response.json();
}
