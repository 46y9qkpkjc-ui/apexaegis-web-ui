// Configured identity stores + their groups. Used by the Identity Store page and
// the RBAC role creation (group mapping). Representative for now; wire to the
// connector / identity_providers + groups APIs later.
export interface IdentityStore {
  id: string;
  name: string;
  type: string;   // Active Directory | OIDC | SAML | LDAP | Local
  status: string; // connected | disconnected
  users: number;
  groups: string[];
}

export const IDENTITY_STORES: IdentityStore[] = [
  { id: 'ad-corp', name: 'Corporate Active Directory', type: 'Active Directory', status: 'connected', users: 12840,
    groups: ['Domain Users', 'Finance', 'Engineering', 'Sales', 'IT Admins', 'Contractors', 'Treasury'] },
  { id: 'okta', name: 'Okta', type: 'OIDC', status: 'connected', users: 9310,
    groups: ['Everyone', 'Security Team', 'SOC Analysts', 'Auditors', 'Executives'] },
  { id: 'entra', name: 'Microsoft Entra ID', type: 'SAML', status: 'connected', users: 15220,
    groups: ['All Users', 'Global Admins', 'Helpdesk', 'Compliance'] },
  { id: 'local', name: 'Local Directory', type: 'Local', status: 'connected', users: 42,
    groups: ['Administrators', 'Read-only Auditors'] },
];
