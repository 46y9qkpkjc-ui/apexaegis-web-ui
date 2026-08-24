'use client';

import { useState, useEffect } from 'react';

interface EphemeralOverride {
  id: string;
  host: string;
  userId: string;
  admin: string;
  justification: string;
  createdAt: string;
  expiresAt: string;
  remainingMinutes: number;
  status: 'active' | 'expired' | 'revoked';
}

interface CISOReview {
  id: string;
  requestType: string;
  requestedBy: string;
  host: string;
  riskScore: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'denied';
  evidence: string;
}

interface AuditLogEntry {
  id: string;
  overrideId: string;
  host: string;
  admin: string;
  action: string;
  timestamp: string;
  hieroTxHash: string;
  compliance: string[];
}

const MOCK_OVERRIDES: EphemeralOverride[] = [
  {
    id: 'OVR-001',
    host: '10.0.4.12',
    userId: 'john.doe@corp.com',
    admin: 'admin@corp.com',
    justification: 'Emergency production debugging for critical P1 incident',
    createdAt: '2024-01-15T14:20:00Z',
    expiresAt: '2024-01-15T15:20:00Z',
    remainingMinutes: 48,
    status: 'active',
  },
  {
    id: 'OVR-002',
    host: '10.0.2.8',
    userId: 'sarah.smith@corp.com',
    admin: 'security@corp.com',
    justification: 'Compliance audit evidence collection',
    createdAt: '2024-01-15T13:00:00Z',
    expiresAt: '2024-01-15T17:00:00Z',
    remainingMinutes: 168,
    status: 'active',
  },
];

const MOCK_REVIEWS: CISOReview[] = [
  {
    id: 'REV-001',
    requestType: 'Break-Glass Access',
    requestedBy: 'incident-response@corp.com',
    host: '10.0.4.12',
    riskScore: 85,
    createdAt: '2024-01-15T14:25:00Z',
    status: 'pending',
    evidence: 'P1 incident #8472 - Production database unreachable. CATE score dropped to 42 due to suspicious outbound connection from backend server.',
  },
  {
    id: 'REV-002',
    requestType: 'Emergency Override',
    requestedBy: 'devops@corp.com',
    host: '10.0.3.15',
    riskScore: 72,
    createdAt: '2024-01-15T14:15:00Z',
    status: 'pending',
    evidence: 'Deployment pipeline blocked. CI/CD agent flagged by CATE as anomalous AI activity. Requires 1-hour override for deployment window.',
  },
];

const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'LOG-001',
    overrideId: 'OVR-001',
    host: '10.0.4.12',
    admin: 'admin@corp.com',
    action: 'Created 1-hour ephemeral override',
    timestamp: '2024-01-15T14:20:00Z',
    hieroTxHash: '0x8f2a...3c1d',
    compliance: ['SOC 2', 'NIST'],
  },
  {
    id: 'LOG-002',
    overrideId: 'OVR-002',
    host: '10.0.2.8',
    admin: 'security@corp.com',
    action: 'Created 4-hour ephemeral override',
    timestamp: '2024-01-15T13:00:00Z',
    hieroTxHash: '0x4b7e...9f2a',
    compliance: ['SOC 2', 'ISO 27001'],
  },
  {
    id: 'LOG-003',
    overrideId: 'OVR-003',
    host: '10.0.1.5',
    admin: 'ciso@corp.com',
    action: 'Approved break-glass request',
    timestamp: '2024-01-15T12:30:00Z',
    hieroTxHash: '0x1c3d...5e8b',
    compliance: ['NIST', 'ISO 27001'],
  },
];

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setRemaining('Expired');
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return <span className="font-mono">{remaining}</span>;
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'overrides' | 'queue' | 'audit'>('overrides');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Break-Glass & Approvals</h1>
        <p className="text-sm text-gray-400 mt-1">
          Emergency deterministic bypasses, CISO signature workflows, and ITSM lifecycle tracking.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-800/60 pb-2">
        {[
          { id: 'overrides' as const, label: 'Active Ephemeral Overrides', icon: '⏱️' },
          { id: 'queue' as const, label: 'CISO Review Queue', icon: '📨' },
          { id: 'audit' as const, label: 'Immutable Override Audit Log', icon: '📋' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Ephemeral Overrides */}
      {activeTab === 'overrides' && (
        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Active Bypass Rules</h2>
            <p className="text-sm text-gray-400 mb-4">
              Live table of active bypass rules with real-time expiration timers.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Override ID</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Host</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">User</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Admin</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Justification</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Expires In</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_OVERRIDES.filter(o => o.status === 'active').map((override) => (
                    <tr key={override.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-mono text-cyan-400">{override.id}</td>
                      <td className="py-3 px-4 text-gray-300">{override.host}</td>
                      <td className="py-3 px-4 text-gray-300">{override.userId}</td>
                      <td className="py-3 px-4 text-gray-300">{override.admin}</td>
                      <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{override.justification}</td>
                      <td className="py-3 px-4">
                        <CountdownTimer expiresAt={override.expiresAt} />
                      </td>
                      <td className="py-3 px-4">
                        <button className="px-3 py-1 rounded bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30">
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CISO Review Queue */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Pending Reviews</h2>
            <p className="text-sm text-gray-400 mb-4">
              Review queue for high-risk access requests and AI-flagged operational blocks.
            </p>
            <div className="space-y-4">
              {MOCK_REVIEWS.filter(r => r.status === 'pending').map((review) => (
                <div key={review.id} className="p-4 rounded-lg border border-gray-700/50 bg-gray-800/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs text-gray-500">{review.id}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">
                          {review.requestType}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          review.riskScore >= 80 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          Risk: {review.riskScore}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mb-2">
                        <span className="text-gray-500">Requested by:</span> {review.requestedBy}
                      </div>
                      <div className="text-sm text-gray-300 mb-2">
                        <span className="text-gray-500">Host:</span> {review.host}
                      </div>
                      <div className="text-sm text-gray-400 p-3 rounded bg-gray-900/50">
                        <span className="text-gray-500 text-xs">Evidence:</span>
                        <p className="mt-1">{review.evidence}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">
                        ✓ Approve
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-sm font-medium hover:bg-red-600/30">
                        ✗ Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Immutable Override Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-100 mb-4">Complete Override History</h2>
            <p className="text-sm text-gray-400 mb-4">
              Complete historical ledger of every bypass event, permanently stamped with its in-country Hiero transaction hash for compliance audits (SOC 2, NIST, ISO 27001).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Log ID</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Override ID</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Host</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Admin</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Action</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Timestamp</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Hiero TX Hash</th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_AUDIT_LOG.map((entry) => (
                    <tr key={entry.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-mono text-gray-400">{entry.id}</td>
                      <td className="py-3 px-4 font-mono text-cyan-400">{entry.overrideId}</td>
                      <td className="py-3 px-4 text-gray-300">{entry.host}</td>
                      <td className="py-3 px-4 text-gray-300">{entry.admin}</td>
                      <td className="py-3 px-4 text-gray-400">{entry.action}</td>
                      <td className="py-3 px-4 text-gray-400">{new Date(entry.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4 font-mono text-green-400">{entry.hieroTxHash}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          {entry.compliance.map((comp) => (
                            <span key={comp} className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                              {comp}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
