/**
 * Token Management API Client
 * Handles API calls for desktop-client registration tokens and license management
 */

export interface GeneratedToken {
  token: string;
  id: string;
  expires_at: string;
}

export interface Token {
  id: string;
  name: string;
  token_prefix: string;
  created_at: string;
  last_used_at?: string;
  expires_at: string;
  status: string;
}

export interface DeploymentInfo {
  org_id: string;
  tenant_id: string;
  subscription_licenses: number;
  licenses_consumed: number;
  licenses_available: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Generate a new registration token
 * Consumes one license from the organization's subscription
 */
export async function generateToken(name: string): Promise<GeneratedToken> {
  const response = await fetch(`${API_BASE}/v1/admin/tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 402) {
      throw new Error('No available licenses');
    }
    throw new Error(error.error || 'Failed to generate token');
  }

  return response.json();
}

/**
 * List all registration tokens for the organization
 */
export async function listTokens(): Promise<Token[]> {
  const response = await fetch(`${API_BASE}/v1/admin/tokens`, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to list tokens');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Revoke a registration token
 * Releases the consumed license back to the organization
 */
export async function revokeToken(tokenId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/v1/admin/tokens/${tokenId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to revoke token');
  }
}

/**
 * Get organization deployment information
 * Includes org_id, tenant_id, and license usage statistics
 */
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
