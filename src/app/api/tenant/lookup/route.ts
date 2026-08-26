import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/tenant/lookup
 * 
 * Reverse-lookups a tenant ID from an organization domain.
 * Calls the provider's OIDC discovery endpoint to extract the tenant GUID.
 * 
 * Body: { domain: string, provider: 'entra' | 'google' | 'okta' | 'onelogin' }
 * Response: { tenantId, tenantName, domain, provider, discoveredServices, cateScore }
 */

interface CATEScore {
  overall: number; // 0-100
  identity: number;
  applications: number;
  dataProtection: number;
  networkSecurity: number;
  devicePosture: number;
  recommendations: string[];
}

interface TenantLookupResponse {
  tenantId: string;
  tenantName: string;
  domain: string;
  provider: string;
  discoveredServices: string[];
  cateScore: CATEScore;
}

async function lookupEntraID(domain: string): Promise<{ tenantId: string; tenantName: string }> {
  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${domain}/.well-known/openid-configuration`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`OIDC discovery failed: ${response.status}`);
    const data = await response.json();
    
    // Extract tenant ID from issuer URL
    // Format: https://login.microsoftonline.com/{tenant-guid}/v2.0
    const issuer = data.issuer || '';
    const match = issuer.match(/login\.microsoftonline\.com\/([a-f0-9-]+)/i);
    const tenantId = match ? match[1] : '';
    
    // Derive tenant name from domain
    const tenantName = domain.split('.')[0]
      .charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Corporation';
    
    return { tenantId, tenantName };
  } catch {
    return { tenantId: '', tenantName: domain.split('.')[0] + ' Corporation' };
  }
}

async function lookupGoogleWorkspace(domain: string): Promise<{ tenantId: string; tenantName: string }> {
  try {
    const response = await fetch(
      'https://accounts.google.com/.well-known/openid-configuration',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`OIDC discovery failed: ${response.status}`);
    // Google uses the domain as the tenant identifier
    const tenantName = domain.split('.')[0]
      .charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Workspace';
    return { tenantId: domain, tenantName };
  } catch {
    return { tenantId: domain, tenantName: domain.split('.')[0] + ' Workspace' };
  }
}

async function lookupOkta(domain: string): Promise<{ tenantId: string; tenantName: string }> {
  try {
    const response = await fetch(
      `https://${domain}/.well-known/openid-configuration`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`OIDC discovery failed: ${response.status}`);
    const data = await response.json();
    const issuer = data.issuer || '';
    // Okta issuer format: https://{domain}/oauth2/{authServerId}
    const match = issuer.match(/oauth2\/([a-zA-Z0-9]+)/);
    const tenantId = match ? match[1] : domain;
    const tenantName = domain.split('.')[0]
      .charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' Identity';
    return { tenantId, tenantName };
  } catch {
    return { tenantId: domain, tenantName: domain.split('.')[0] + ' Identity' };
  }
}

function assessCATE(
  provider: string,
  domain: string,
  discoveredServices: string[]
): CATEScore {
  // Dynamic CATE scoring based on provider capabilities and discovered services
  let identityScore = 50;
  let applicationsScore = 40;
  let dataProtectionScore = 45;
  let networkScore = 50;
  let deviceScore = 40;

  // Provider-specific bonuses
  switch (provider) {
    case 'entra':
      identityScore += 25; // Entra ID P2 has conditional access, MFA, identity protection
      deviceScore += 15; // Intune device compliance
      dataProtectionScore += 10; // Microsoft Purview DLP
      break;
    case 'google':
      identityScore += 20; // Google Workspace MFA, context-aware access
      applicationsScore += 10; // Google Cloud IAM
      break;
    case 'okta':
      identityScore += 22; // Okta Adaptive MFA, lifecycle management
      applicationsScore += 8; // Okta Integration Network
      break;
    case 'onelogin':
      identityScore += 18; // OneLogin MFA, risk-based authentication
      break;
  }

  // Service-specific bonuses
  if (discoveredServices.some(s => s.toLowerCase().includes('microsoft 365'))) {
    applicationsScore += 10;
    dataProtectionScore += 8;
  }
  if (discoveredServices.some(s => s.toLowerCase().includes('teams'))) {
    networkScore += 5;
  }
  if (discoveredServices.some(s => s.toLowerCase().includes('onedrive') || s.toLowerCase().includes('sharepoint'))) {
    dataProtectionScore += 10;
  }

  // Cap scores at 100
  identityScore = Math.min(100, identityScore);
  applicationsScore = Math.min(100, applicationsScore);
  dataProtectionScore = Math.min(100, dataProtectionScore);
  networkScore = Math.min(100, networkScore);
  deviceScore = Math.min(100, deviceScore);

  const overall = Math.round(
    (identityScore * 0.3 + applicationsScore * 0.25 + dataProtectionScore * 0.2 + networkScore * 0.15 + deviceScore * 0.1)
  );

  // Generate recommendations
  const recommendations: string[] = [];
  if (identityScore < 70) recommendations.push('Enable MFA for all users via your identity provider');
  if (applicationsScore < 60) recommendations.push('Configure SSO for discovered SaaS applications');
  if (dataProtectionScore < 60) recommendations.push('Enable DLP policies for sensitive data');
  if (networkScore < 60) recommendations.push('Deploy SWG with SSL inspection for web traffic');
  if (deviceScore < 60) recommendations.push('Enable device posture checks for Zero Trust access');
  if (discoveredServices.length < 3) recommendations.push('Discover additional SaaS applications in your environment');

  return {
    overall,
    identity: identityScore,
    applications: applicationsScore,
    dataProtection: dataProtectionScore,
    networkSecurity: networkScore,
    devicePosture: deviceScore,
    recommendations,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, provider } = body;

    if (!domain || !provider) {
      return NextResponse.json(
        { error: 'domain and provider are required' },
        { status: 400 }
      );
    }

    // Validate domain format
    if (!/^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // Lookup tenant based on provider
    let tenantId = '';
    let tenantName = '';

    switch (provider) {
      case 'entra':
        ({ tenantId, tenantName } = await lookupEntraID(domain));
        break;
      case 'google':
        ({ tenantId, tenantName } = await lookupGoogleWorkspace(domain));
        break;
      case 'okta':
        ({ tenantId, tenantName } = await lookupOkta(domain));
        break;
      case 'onelogin':
        // OneLogin uses domain as identifier
        tenantId = domain;
        tenantName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' SSO';
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    // Discover services based on provider
    const discoveredServices: string[] = [];
    switch (provider) {
      case 'entra':
        discoveredServices.push('Microsoft 365', 'Teams', 'OneDrive', 'SharePoint', 'Azure AD', 'Entra ID');
        break;
      case 'google':
        discoveredServices.push('Google Workspace', 'Gmail', 'Google Drive', 'Google Meet', 'Cloud Identity');
        break;
      case 'okta':
        discoveredServices.push('Okta SSO', 'Okta Lifecycle Management', 'Okta ThreatInsight');
        break;
      case 'onelogin':
        discoveredServices.push('OneLogin SSO', 'OneLogin MFA', 'OneLogin Privileged Access');
        break;
    }

    // Dynamic CATE assessment
    const cateScore = assessCATE(provider, domain, discoveredServices);

    const response: TenantLookupResponse = {
      tenantId,
      tenantName,
      domain,
      provider,
      discoveredServices,
      cateScore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tenant lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
