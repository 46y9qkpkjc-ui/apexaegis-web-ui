// IdP Configuration API Client

export interface IdPConfig {
  id?: string;
  name: string;
  provider_type: string; // okta, azure_ad, google, saml, ldap, ping
  enabled: boolean;
  issuer_url?: string;
  jwks_uri?: string;
  client_id?: string;
  client_secret?: string;
  saml_sso_url?: string;
  saml_metadata_url?: string;
  ldap_host?: string;
  ldap_port?: number;
  ldap_base_dn?: string;
  ldap_bind_dn?: string;
  ldap_bind_password?: string;
  [key: string]: any; // Allow additional fields
}

export interface IdPResponse {
  id: string;
  org_id: string;
  name: string;
  provider_type: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new IdP configuration
 */
export async function createIdP(config: IdPConfig): Promise<IdPResponse> {
  const response = await fetch('/api/v1/identity/providers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create IdP' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Update an existing IdP configuration
 */
export async function updateIdP(id: string, config: IdPConfig): Promise<IdPResponse> {
  const response = await fetch(`/api/v1/identity/providers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update IdP' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Get a specific IdP configuration
 */
export async function getIdP(id: string): Promise<IdPResponse> {
  const response = await fetch(`/api/v1/identity/providers/${id}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch IdP: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * List all IdP configurations for the organization
 */
export async function listIdPs(): Promise<IdPResponse[]> {
  const response = await fetch('/api/v1/identity/providers', {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch IdPs: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Delete an IdP configuration
 */
export async function deleteIdP(id: string): Promise<void> {
  const response = await fetch(`/api/v1/identity/providers/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete IdP: HTTP ${response.status}`);
  }
}
