'use client';
import { useState } from 'react';
import { Settings, Save, Globe, Shield, Bell, Users, Server, Key, Clock, Copy, RefreshCw, Package, Plus, X } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const [general, setGeneral] = useState({
    orgName: 'Acme Corporation',
    orgDomain: 'acme.com',
    timezone: 'America/New_York',
    sessionTimeout: '30',
    mfaRequired: true,
  });

  const [network, setNetwork] = useState({
    dnsProvider: 'cloudflare',
    fallbackDns: '1.1.1.1',
    quicEnabled: true,
    masqueEnabled: true,
    maxBandwidthMbps: '1000',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    slackWebhook: '',
    criticalOnly: false,
    digestFrequency: 'daily',
  });

  const [logging, setLogging] = useState({
    retentionDays: '90',
    logAllTraffic: true,
    logDnsQueries: true,
    exportToSiem: false,
    siemEndpoint: '',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const [deployment, setDeployment] = useState({
    orgId: '550e8400-e29b-41d4-a716-446655440000',
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    userLicenses: 150,
    usedLicenses: 89,
  });

  const [tokens, setTokens] = useState([
    { id: 'token_1', name: 'Desktop-Client #1 (Finance Dept)', token: 'apex_abc123xyz789_2024', created: '2026-02-15', lastUsed: '2 hours ago', expiresIn: '89 days' },
    { id: 'token_2', name: 'Desktop-Client #2 (Engineering)', token: 'apex_def456uvw123_2024', created: '2026-01-20', lastUsed: '1 day ago', expiresIn: '65 days' },
    { id: 'token_3', name: 'Desktop-Client #3 (HR)', token: 'apex_ghi789rst456_2024', created: '2025-12-10', lastUsed: '5 days ago', expiresIn: '25 days' },
  ]);

  const [showGenerateToken, setShowGenerateToken] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'deployment', label: 'Deployment', icon: Package },
    { id: 'network', label: 'Network', icon: Server },
    { id: 'auth', label: 'Authentication', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'logging', label: 'Logging', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={24} className="text-gray-400" />
          <div>
            <h1 className="text-xl font-semibold">Settings</h1>
            <p className="text-sm text-gray-500">Global configuration for your ApexAegis deployment</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          <Save size={16} />
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-800 pb-px overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {activeTab === 'general' && (
          <div className="space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Organization Settings</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Organization Name</label>
              <input value={general.orgName} onChange={e => setGeneral({ ...general, orgName: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Primary Domain</label>
              <input value={general.orgDomain} onChange={e => setGeneral({ ...general, orgDomain: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Timezone</label>
              <select value={general.timezone} onChange={e => setGeneral({ ...general, timezone: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">London (GMT/BST)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Session Timeout (minutes)</label>
              <input type="number" value={general.sessionTimeout} onChange={e => setGeneral({ ...general, sessionTimeout: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">Require MFA for all admins</div>
                <div className="text-xs text-gray-500">Enforce multi-factor authentication for management console access</div>
              </div>
              <button
                onClick={() => setGeneral({ ...general, mfaRequired: !general.mfaRequired })}
                className={`w-10 h-5 rounded-full transition-colors relative ${general.mfaRequired ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${general.mfaRequired ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Network Configuration</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">DNS Provider</label>
              <select value={network.dnsProvider} onChange={e => setNetwork({ ...network, dnsProvider: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                <option value="cloudflare">Cloudflare (1.1.1.1)</option>
                <option value="google">Google (8.8.8.8)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fallback DNS Server</label>
              <input value={network.fallbackDns} onChange={e => setNetwork({ ...network, fallbackDns: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Bandwidth per User (Mbps)</label>
              <input type="number" value={network.maxBandwidthMbps} onChange={e => setNetwork({ ...network, maxBandwidthMbps: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">QUIC Protocol</div>
                <div className="text-xs text-gray-500">Enable QUIC transport for client connections (UDP 443)</div>
              </div>
              <button
                onClick={() => setNetwork({ ...network, quicEnabled: !network.quicEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${network.quicEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${network.quicEnabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">MASQUE CONNECT-IP</div>
                <div className="text-xs text-gray-500">Enable MASQUE tunneling for full IP-layer traffic</div>
              </div>
              <button
                onClick={() => setNetwork({ ...network, masqueEnabled: !network.masqueEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${network.masqueEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${network.masqueEnabled ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Authentication & Identity</h3>
            <div className="p-4 bg-gray-800/30 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-blue-400" />
                <div>
                  <div className="text-sm font-medium">Okta SSO</div>
                  <div className="text-xs text-green-400">Connected</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Tenant URL:</span>
                  <div className="text-gray-300 font-mono mt-0.5">acme.okta.com</div>
                </div>
                <div>
                  <span className="text-gray-500">Last Sync:</span>
                  <div className="text-gray-300 mt-0.5">2 hours ago</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-800/30 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <Key size={18} className="text-yellow-400" />
                <div>
                  <div className="text-sm font-medium">Kerberos Delegation</div>
                  <div className="text-xs text-green-400">Active</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Realm:</span>
                  <div className="text-gray-300 font-mono mt-0.5">ACME.COM</div>
                </div>
                <div>
                  <span className="text-gray-500">KDC:</span>
                  <div className="text-gray-300 font-mono mt-0.5">dc1.acme.com</div>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
              <Users size={16} />
              Configure Identity Provider
            </button>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Alert Notifications</h3>
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">Email Alerts</div>
                <div className="text-xs text-gray-500">Send alerts to admin email addresses</div>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifications.emailAlerts ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${notifications.emailAlerts ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Slack Webhook URL</label>
              <input value={notifications.slackWebhook} onChange={e => setNotifications({ ...notifications, slackWebhook: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" placeholder="https://hooks.slack.com/services/..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Digest Frequency</label>
              <select value={notifications.digestFrequency} onChange={e => setNotifications({ ...notifications, digestFrequency: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                <option value="realtime">Real-time</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">Critical Alerts Only</div>
                <div className="text-xs text-gray-500">Only send notifications for critical severity events</div>
              </div>
              <button
                onClick={() => setNotifications({ ...notifications, criticalOnly: !notifications.criticalOnly })}
                className={`w-10 h-5 rounded-full transition-colors relative ${notifications.criticalOnly ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${notifications.criticalOnly ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          <div className="space-y-6 max-w-4xl">
            <h3 className="text-sm font-semibold text-gray-300 mb-6">Deployment Configuration</h3>

            {/* Organization Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-400">Organization ID</label>
                  <button
                    onClick={() => copyToClipboard(deployment.orgId, 'orgId')}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                      copied === 'orgId'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <Copy size={14} />
                    {copied === 'orgId' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-sm text-blue-400 break-all">{deployment.orgId}</div>
              </div>

              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm text-gray-400">ApexAegis Tenant ID</label>
                  <button
                    onClick={() => copyToClipboard(deployment.tenantId, 'tenantId')}
                    className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                      copied === 'tenantId'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <Copy size={14} />
                    {copied === 'tenantId' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-sm text-blue-400 break-all">{deployment.tenantId}</div>
              </div>
            </div>

            {/* License Usage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <label className="block text-sm text-gray-400 mb-2">Total User Licenses</label>
                <div className="text-3xl font-bold text-blue-400">{deployment.userLicenses}</div>
                <div className="text-xs text-gray-500 mt-1">Subscribed licenses</div>
              </div>
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <label className="block text-sm text-gray-400 mb-2">Available Licenses</label>
                <div className="text-3xl font-bold text-green-400">{deployment.userLicenses - deployment.usedLicenses}</div>
                <div className="text-xs text-gray-500 mt-1">{deployment.usedLicenses} in use by active tokens</div>
              </div>
            </div>

            {/* Client Registration Tokens */}
            <div className="border-t border-gray-800 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-300">Desktop-Client Registration Tokens</h4>
                <button
                  onClick={() => setShowGenerateToken(true)}
                  disabled={deployment.userLicenses - deployment.usedLicenses <= 0}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus size={14} />
                  Generate New Token
                </button>
              </div>

              {tokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No registration tokens generated yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tokens.map(token => (
                    <div key={token.id} className="p-4 bg-gray-800/20 rounded-lg border border-gray-700/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="text-sm font-medium text-gray-200">{token.name}</h5>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <div>Created: <span className="text-gray-300">{token.created}</span></div>
                            <div>Last used: <span className="text-gray-300">{token.lastUsed}</span></div>
                            <div>Expires: <span className="text-yellow-400">{token.expiresIn}</span></div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTokens(tokens.filter(t => t.id !== token.id));
                            setDeployment(prev => ({ ...prev, usedLicenses: prev.usedLicenses - 1 }));
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded text-xs transition-colors"
                        >
                          <X size={12} />
                          Revoke
                        </button>
                      </div>
                      <div className="p-2 bg-gray-900 rounded font-mono text-xs text-gray-400 break-all">
                        {token.token}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                <div className="text-xs text-amber-200">
                  <strong>⚠️ License Consumption:</strong>
                  <div className="mt-1 space-y-1">
                    <div>• Each token generated consumes 1 user license</div>
                    <div>• Revoking a token releases the license for reuse</div>
                    <div>• Tokens expire after 1 year of inactivity</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logging' && (
          <div className="space-y-5 max-w-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Log & Audit Configuration</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Log Retention (days)</label>
              <input type="number" value={logging.retentionDays} onChange={e => setLogging({ ...logging, retentionDays: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">Log All Traffic</div>
                <div className="text-xs text-gray-500">Log all allowed and denied traffic (increases storage)</div>
              </div>
              <button
                onClick={() => setLogging({ ...logging, logAllTraffic: !logging.logAllTraffic })}
                className={`w-10 h-5 rounded-full transition-colors relative ${logging.logAllTraffic ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${logging.logAllTraffic ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">Log DNS Queries</div>
                <div className="text-xs text-gray-500">Record all DNS resolution queries and responses</div>
              </div>
              <button
                onClick={() => setLogging({ ...logging, logDnsQueries: !logging.logDnsQueries })}
                className={`w-10 h-5 rounded-full transition-colors relative ${logging.logDnsQueries ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${logging.logDnsQueries ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">Export to SIEM</div>
                <div className="text-xs text-gray-500">Forward logs to external SIEM via syslog/CEF</div>
              </div>
              <button
                onClick={() => setLogging({ ...logging, exportToSiem: !logging.exportToSiem })}
                className={`w-10 h-5 rounded-full transition-colors relative ${logging.exportToSiem ? 'bg-green-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${logging.exportToSiem ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            {logging.exportToSiem && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">SIEM Endpoint</label>
                <input value={logging.siemEndpoint} onChange={e => setLogging({ ...logging, siemEndpoint: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50" placeholder="syslog://siem.acme.com:514" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate Token Modal */}
      {showGenerateToken && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowGenerateToken(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Generate New Registration Token</h3>
              <button onClick={() => setShowGenerateToken(false)} className="text-gray-500 hover:text-gray-300">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Desktop-Client Name</label>
                <input
                  type="text"
                  placeholder="e.g., Desktop-Client #4 (Marketing Dept)"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                <div className="text-xs text-blue-200">
                  <strong>License Impact:</strong> Generating a token will consume 1 of your {deployment.userLicenses - deployment.usedLicenses} remaining licenses.
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGenerateToken(false)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const newToken = {
                      id: `token_${tokens.length + 1}`,
                      name: 'New Desktop-Client',
                      token: `apex_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}_2024`,
                      created: new Date().toISOString().split('T')[0],
                      lastUsed: 'Never',
                      expiresIn: '365 days',
                    };
                    setTokens([...tokens, newToken]);
                    setDeployment(prev => ({ ...prev, usedLicenses: prev.usedLicenses + 1 }));
                    setShowGenerateToken(false);
                  }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Generate Token
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
