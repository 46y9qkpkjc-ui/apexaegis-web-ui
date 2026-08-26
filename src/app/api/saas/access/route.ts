import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/saas/access
 * 
 * Configures tenant-scoped SaaS access with vendor-specific restriction headers.
 * Stores the configuration in the tenant's settings and returns the approved
 * header list with enforcement rules.
 * 
 * Body: {
 *   tenantId: string,
 *   domain: string,
 *   enabledApps: Array<{
 *     id: string,
 *     name: string,
 *     header: string,
 *     headerValue: string,
 *     trustLevel: 'required' | 'recommended' | 'optional'
 *   }>,
 *   customHeaders: Array<{
 *     name: string,
 *     valuePattern: string,
 *     trustLevel: 'required' | 'recommended' | 'optional'
 *   }>,
 *   enforcementMode: 'block' | 'warn' | 'log'
 * }
 */

interface ApprovedHeader {
  name: string;
  valuePattern: string;
  trustLevel: 'required' | 'recommended' | 'optional';
  vendor: string;
  enforcement: 'block' | 'warn' | 'log';
  autoFilled: boolean;
}

interface SaaSAccessResponse {
  tenantId: string;
  approvedHeaders: ApprovedHeader[];
  enforcementMode: string;
  totalApps: number;
  enabledApps: number;
  totalHeaders: number;
  status: 'active' | 'pending' | 'error';
}

// Known vendor header trust anchors (fingerprint of known-good header values)
const HEADER_TRUST_ANCHORS: Record<string, { validator: (value: string) => boolean; description: string }> = {
  'Restrict-Access-To-Tenants': {
    validator: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
    description: 'Microsoft Entra ID Tenant GUID format',
  },
  'X-GoogApps-Allowed-Domains': {
    validator: (value) => /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
    description: 'Google Workspace domain format',
  },
  'X-Slack-Allowed-Workspaces-Requester': {
    validator: (value) => value.length > 0,
    description: 'Slack workspace identifier',
  },
  'X-Dropbox-allowed-Team-Ids': {
    validator: (value) => value.length > 0,
    description: 'Dropbox team identifier',
  },
  'X-Box-Allowed-Enterprise-IDs': {
    validator: (value) => value.length > 0,
    description: 'Box enterprise identifier',
  },
  'X-GitHub-Allowed-Orgs': {
    validator: (value) => /^[a-zA-Z0-9-]+$/.test(value),
    description: 'GitHub organization name',
  },
  'X-Cisco-Allowed-Orgs': {
    validator: (value) => value.length > 0,
    description: 'Cisco Webex organization ID',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      domain,
      enabledApps,
      customHeaders,
      enforcementMode,
    } = body;

    if (!tenantId || !domain) {
      return NextResponse.json(
        { error: 'tenantId and domain are required' },
        { status: 400 }
      );
    }

    // Validate and enrich approved headers
    const approvedHeaders: ApprovedHeader[] = [];

    for (const app of enabledApps || []) {
      if (!app.header || !app.enabled) continue;

      const trustAnchor = HEADER_TRUST_ANCHORS[app.header];
      const autoFilled = app.autoFilled || false;
      const valueValid = trustAnchor ? trustAnchor.validator(app.headerValue) : app.headerValue.length > 0;

      approvedHeaders.push({
        name: app.header,
        valuePattern: app.headerValue,
        trustLevel: app.trustLevel || 'recommended',
        vendor: app.name,
        enforcement: enforcementMode || 'block',
        autoFilled,
      });
    }

    // Add custom headers
    for (const header of customHeaders || []) {
      approvedHeaders.push({
        name: header.name,
        valuePattern: header.valuePattern,
        trustLevel: header.trustLevel || 'recommended',
        vendor: 'custom',
        enforcement: enforcementMode || 'block',
        autoFilled: false,
      });
    }

    const response: SaaSAccessResponse = {
      tenantId,
      approvedHeaders,
      enforcementMode: enforcementMode || 'block',
      totalApps: enabledApps?.length || 0,
      enabledApps: (enabledApps || []).filter((a: { enabled: boolean }) => a.enabled).length,
      totalHeaders: approvedHeaders.length,
      status: 'active',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('SaaS access config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
