import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/cate/assess
 * 
 * Dynamic CATE (Continuous Adaptive Trust Evaluation) assessment.
 * Takes tenant data, discovered services, and existing policies to generate
 * a comprehensive trust score and enforcement recommendations.
 * 
 * Body: {
 *   tenantId: string,
 *   domain: string,
 *   provider: string,
 *   discoveredServices: string[],
 *   selectedFrameworks: string[],
 *   sanctionedApps: string[],
 *   riskSensitivity: 'strict' | 'balanced' | 'adaptive'
 * }
 */

interface CATERecommendation {
  category: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: number; // score impact if implemented
}

interface CATEResult {
  score: {
    overall: number;
    identity: number;
    applications: number;
    dataProtection: number;
    networkSecurity: number;
    devicePosture: number;
    compliance: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: CATERecommendation[];
  enforcementActions: string[];
  saasRestrictions: {
    appId: string;
    header: string;
    headerValue: string;
    trustLevel: string;
  }[];
}

function calculateComplianceScore(
  frameworks: string[],
  provider: string,
  services: string[]
): number {
  let score = 30; // baseline

  // Framework coverage bonus
  const frameworkBonuses: Record<string, number> = {
    'nist-800-53': 12,
    'iso-27001': 10,
    'soc2': 10,
    'pci-dss': 8,
    'gdpr': 8,
    'fedramp': 12,
    'cis': 6,
    'hipaa': 8,
  };

  for (const fw of frameworks) {
    score += frameworkBonuses[fw] || 0;
  }

  // Provider maturity bonus
  const providerBonuses: Record<string, number> = {
    entra: 10,
    google: 8,
    okta: 9,
    onelogin: 7,
  };
  score += providerBonuses[provider] || 0;

  // Service coverage bonus
  score += Math.min(20, services.length * 3);

  return Math.min(100, score);
}

function generateRecommendations(
  score: CATEResult['score'],
  frameworks: string[],
  provider: string
): CATERecommendation[] {
  const recs: CATERecommendation[] = [];

  if (score.identity < 70) {
    recs.push({
      category: 'identity',
      title: 'Enable Multi-Factor Authentication',
      description: `Configure MFA in ${provider === 'entra' ? 'Microsoft Entra ID' : provider} for all users with risk-based step-up authentication.`,
      priority: 'critical',
      impact: 15,
    });
  }

  if (score.applications < 60) {
    recs.push({
      category: 'applications',
      title: 'Configure SSO for SaaS Applications',
      description: 'Integrate discovered SaaS apps with your identity provider for centralized access control.',
      priority: 'high',
      impact: 12,
    });
  }

  if (score.dataProtection < 60) {
    recs.push({
      category: 'dataProtection',
      title: 'Enable DLP Policies',
      description: 'Deploy data loss prevention policies to protect sensitive information across SaaS applications.',
      priority: 'high',
      impact: 10,
    });
  }

  if (score.networkSecurity < 60) {
    recs.push({
      category: 'networkSecurity',
      title: 'Deploy Secure Web Gateway',
      description: 'Enable SSL inspection and URL filtering to protect against web-based threats.',
      priority: 'high',
      impact: 10,
    });
  }

  if (score.devicePosture < 60) {
    recs.push({
      category: 'devicePosture',
      title: 'Enable Device Posture Checks',
      description: 'Configure device compliance checks before granting access to corporate resources.',
      priority: 'medium',
      impact: 8,
    });
  }

  if (frameworks.includes('pci-dss') && score.dataProtection < 80) {
    recs.push({
      category: 'dataProtection',
      title: 'PCI-DSS Cardholder Data Protection',
      description: 'Implement additional DLP controls for CDE (Cardholder Data Environment) compliance.',
      priority: 'critical',
      impact: 5,
    });
  }

  if (frameworks.includes('hipaa') && score.dataProtection < 80) {
    recs.push({
      category: 'dataProtection',
      title: 'HIPAA ePHI Protection',
      description: 'Enable encryption and access controls for electronic Protected Health Information.',
      priority: 'critical',
      impact: 5,
    });
  }

  return recs;
}

const VENDOR_HEADERS: Record<string, string> = {
  'Microsoft 365': 'Restrict-Access-To-Tenants',
  'Google Workspace': 'X-GoogApps-Allowed-Domains',
  'Slack Enterprise': 'X-Slack-Allowed-Workspaces-Requester',
  'Dropbox Business': 'X-Dropbox-allowed-Team-Ids',
  'Box Enterprise': 'X-Box-Allowed-Enterprise-IDs',
  'GitHub Enterprise': 'X-GitHub-Allowed-Orgs',
  'Cisco Webex': 'X-Cisco-Allowed-Orgs',
  'Salesforce': 'X-Salesforce-Allowed-Org-Ids',
  'Zoom Meetings': 'X-Zoom-Allowed-Accounts',
  'ChatGPT Enterprise': 'X-OpenAI-Allowed-Orgs',
  'Workday': 'X-Workday-Allowed-Tenants',
  'AWS Console': 'aws:PrincipalOrgID',
};

function generateSaaSRestrictions(
  tenantId: string,
  domain: string,
  sanctionedApps: string[]
): CATEResult['saasRestrictions'] {
  return sanctionedApps
    .filter(app => VENDOR_HEADERS[app])
    .map(app => ({
      appId: app.toLowerCase().replace(/\s+/g, '-'),
      header: VENDOR_HEADERS[app],
      headerValue: app === 'Microsoft 365' ? tenantId :
                   app === 'Google Workspace' ? domain : '',
      trustLevel: ['Microsoft 365', 'Google Workspace'].includes(app) ? 'required' : 'recommended',
    }));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      domain,
      provider,
      discoveredServices,
      selectedFrameworks,
      sanctionedApps,
      riskSensitivity,
    } = body;

    if (!tenantId || !domain || !provider) {
      return NextResponse.json(
        { error: 'tenantId, domain, and provider are required' },
        { status: 400 }
      );
    }

    // Calculate individual scores
    const identityScore = Math.min(100, 50 + (
      provider === 'entra' ? 25 : provider === 'okta' ? 22 : provider === 'google' ? 20 : 15
    ) + (discoveredServices?.length || 0) * 2);

    const applicationsScore = Math.min(100, 40 + (
      sanctionedApps?.length || 0
    ) * 5 + (discoveredServices?.length || 0) * 3);

    const dataProtectionScore = Math.min(100, 45 + (
      selectedFrameworks?.includes('pci-dss') ? 15 : 0
    ) + (selectedFrameworks?.includes('hipaa') ? 12 : 0) + (
      selectedFrameworks?.includes('soc2') ? 10 : 0
    ));

    const networkScore = Math.min(100, 50 + (
      riskSensitivity === 'strict' ? 20 : riskSensitivity === 'adaptive' ? 15 : 5
    ));

    const deviceScore = Math.min(100, 40 + (
      provider === 'entra' ? 15 : provider === 'okta' ? 12 : 8
    ));

    const complianceScore = calculateComplianceScore(
      selectedFrameworks || [],
      provider,
      discoveredServices || []
    );

    const overall = Math.round(
      identityScore * 0.25 +
      applicationsScore * 0.2 +
      dataProtectionScore * 0.2 +
      networkScore * 0.15 +
      deviceScore * 0.1 +
      complianceScore * 0.1
    );

    const grade = overall >= 90 ? 'A' : overall >= 80 ? 'B' : overall >= 70 ? 'C' : overall >= 60 ? 'D' : 'F';
    const riskLevel = overall >= 80 ? 'low' : overall >= 65 ? 'medium' : overall >= 50 ? 'high' : 'critical';

    const recommendations = generateRecommendations(
      { overall, identity: identityScore, applications: applicationsScore, dataProtection: dataProtectionScore, networkSecurity: networkScore, devicePosture: deviceScore, compliance: complianceScore },
      selectedFrameworks || [],
      provider
    );

    const enforcementActions: string[] = [];
    if (riskSensitivity === 'strict') {
      enforcementActions.push('Immediate step-up on any risk signal');
      enforcementActions.push('Block unmanaged devices');
      enforcementActions.push('Enforce MFA for all access');
    } else if (riskSensitivity === 'adaptive') {
      enforcementActions.push('Tiered response by risk score');
      enforcementActions.push('Step-up for scores 60-79');
      enforcementActions.push('Isolate for scores 80-100');
    } else {
      enforcementActions.push('Audit mode — log without enforcement');
    }

    const saasRestrictions = generateSaaSRestrictions(
      tenantId,
      domain,
      sanctionedApps || []
    );

    const result: CATEResult = {
      score: {
        overall,
        identity: identityScore,
        applications: applicationsScore,
        dataProtection: dataProtectionScore,
        networkSecurity: networkScore,
        devicePosture: deviceScore,
        compliance: complianceScore,
      },
      grade,
      riskLevel,
      recommendations,
      enforcementActions,
      saasRestrictions,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('CATE assessment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
