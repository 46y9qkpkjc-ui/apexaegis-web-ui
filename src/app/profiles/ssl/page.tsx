'use client';
import { useState, useEffect, useCallback } from 'react';
import { Lock, Plus, Pencil, Trash2, Shield, AlertTriangle, Eye, Settings, X, Bug, Globe as GlobeIcon } from 'lucide-react';
import { CertVerificationEditor, DEFAULT_CERT_VERIFICATION, type CertVerificationConfig } from '@/components/ssl/cert-verification-editor';
import { fetchProfiles, createProfile, updateProfile, deleteProfile, toggleProfile, type ApiProfile } from '@/lib/profile-api';

interface SslProfile {
  id: string;
  name: string;
  enabled: boolean;
  mode: 'full-inspection' | 'certificate-inspection' | 'no-inspection';
  exemptCategories: string[];
  exemptDomains: string[];
  caBundle: string;
  logDecryptedTraffic: boolean;
  untrustedCertAction: 'block' | 'allow-warn' | 'allow';
  expiredCertAction: 'block' | 'allow-warn' | 'allow';
  certVerification: CertVerificationConfig;
  usedInPolicies: number;
  builtin: boolean;
}

function fromApi(p: ApiProfile): SslProfile {
  const c = p.config as Record<string, unknown>;
  return {
    id: p.id, name: p.name, enabled: p.enabled, builtin: p.builtin,
    mode: (c.mode as SslProfile['mode']) ?? 'certificate-inspection',
    exemptCategories: (c.exemptCategories as string[]) ?? [],
    exemptDomains: (c.exemptDomains as string[]) ?? [],
    caBundle: (c.caBundle as string) ?? '',
    logDecryptedTraffic: (c.logDecryptedTraffic as boolean) ?? false,
    untrustedCertAction: (c.untrustedCertAction as SslProfile['untrustedCertAction']) ?? 'block',
    expiredCertAction: (c.expiredCertAction as SslProfile['expiredCertAction']) ?? 'block',
    certVerification: (c.certVerification as CertVerificationConfig) ?? { ...DEFAULT_CERT_VERIFICATION },
    usedInPolicies: 0,
  };
}

function toConfig(p: SslProfile): Record<string, unknown> {
  return {
    mode: p.mode, exemptCategories: p.exemptCategories, exemptDomains: p.exemptDomains,
    caBundle: p.caBundle, logDecryptedTraffic: p.logDecryptedTraffic,
    untrustedCertAction: p.untrustedCertAction, expiredCertAction: p.expiredCertAction,
    certVerification: p.certVerification,
  };
}

const modeBadge: Record<string, { label: string; color: string }> = {
  'full-inspection':        { label: 'Full Inspection',        color: 'bg-blue-900/20 border-blue-700/40 text-blue-400' },
  'certificate-inspection': { label: 'Certificate Inspection', color: 'bg-yellow-900/20 border-yellow-700/40 text-yellow-400' },
  'no-inspection':          { label: 'No Inspection',          color: 'bg-gray-800 border-gray-600 text-gray-400' },
};

const certActionBadge: Record<string, { label: string; color: string }> = {
  'block':      { label: 'Block',      color: 'bg-red-900/20 border-red-700/40 text-red-400' },
  'allow-warn': { label: 'Allow+Warn', color: 'bg-yellow-900/20 border-yellow-700/40 text-yellow-400' },
  'allow':      { label: 'Allow',      color: 'bg-green-900/20 border-green-700/40 text-green-400' },
};

export default function SslInspectionPage() {
  const [profiles, setProfiles] = useState<SslProfile[]>([]);
  const [viewProfile, setViewProfile] = useState<SslProfile | null>(null);
  const [configureProfile, setConfigureProfile] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProfile, setNewProfile] = useState<SslProfile>({
    id: '', name: '', enabled: true, mode: 'certificate-inspection',
    exemptCategories: [], exemptDomains: [], caBundle: '',
    logDecryptedTraffic: false, untrustedCertAction: 'block', expiredCertAction: 'block',
    certVerification: { ...DEFAULT_CERT_VERIFICATION }, usedInPolicies: 0, builtin: false,
  });

  const load = useCallback(async () => {
    try {
      const data = await fetchProfiles('ssl');
      setProfiles(data.map(fromApi));
    } catch { /* backend unavailable */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    try {
      await toggleProfile('ssl', id, !p.enabled);
      setProfiles(prev => prev.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
    } catch { /* ignore */ }
  };

  const handleCertConfigChange = async (id: string, config: CertVerificationConfig) => {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    const updated = { ...p, certVerification: config };
    try {
      await updateProfile('ssl', id, { name: updated.name, enabled: updated.enabled, config: toConfig(updated) });
      setProfiles(prev => prev.map(x => x.id === id ? updated : x));
    } catch { /* ignore */ }
  };

  const handleCreate = async () => {
    if (!newProfile.name.trim()) return;
    try {
      const created = await createProfile('ssl', {
        name: newProfile.name, enabled: newProfile.enabled,
        config: toConfig(newProfile),
      });
      setProfiles(prev => [...prev, fromApi(created)]);
      setNewProfile({
        id: '', name: '', enabled: true, mode: 'certificate-inspection',
        exemptCategories: [], exemptDomains: [], caBundle: '',
        logDecryptedTraffic: false, untrustedCertAction: 'block', expiredCertAction: 'block',
        certVerification: { ...DEFAULT_CERT_VERIFICATION }, usedInPolicies: 0, builtin: false,
      });
      setShowCreate(false);
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProfile('ssl', id);
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock size={24} className="text-yellow-400" />
          <div>
            <h1 className="text-xl font-semibold">SSL Inspection</h1>
            <p className="text-sm text-gray-500">TLS/SSL decryption profiles for deep packet inspection</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          New Profile
        </button>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-yellow-900/15 border border-yellow-800/30 rounded-xl">
        <AlertTriangle size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-yellow-300 font-medium">Full SSL Inspection requires a CA certificate</p>
          <p className="text-yellow-500/80 mt-1">
            Full Inspection (Inline Proxy) mode decrypts TLS traffic using your organization&apos;s CA certificate.
            Ensure your CA bundle is uploaded under CA Certificates and distributed to all managed endpoints.
            Financial and healthcare categories are exempt by default for compliance.
          </p>
        </div>
      </div>

      {/* Mitigation & Exception Impact */}
      {(() => {
        const allExemptDomains = profiles.filter(p => p.enabled && (p.mode === 'no-inspection' || p.exemptDomains.length > 0 || p.exemptCategories.length > 0));
        const noInspectionProfiles = profiles.filter(p => p.enabled && p.mode === 'no-inspection');
        const profilesWithExemptions = profiles.filter(p => p.enabled && p.mode !== 'no-inspection' && (p.exemptDomains.length > 0 || p.exemptCategories.length > 0));
        if (allExemptDomains.length === 0) return null;
        return (
          <div className="bg-red-950/20 border border-red-800/30 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Bug size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-300">SSL Exemption Security Impact — ATP & Malware Scanning Gaps</h3>
                <p className="text-xs text-red-400/70 mt-1">
                  URLs, domains, and categories excluded from SSL inspection <span className="text-red-300 font-medium">cannot be scanned for malware, ATP threats, or data loss</span>.
                  Encrypted traffic that is not decrypted bypasses all inline threat detection engines. These are considered <span className="text-red-300 font-medium">exceptions from ATP and Malware analysis</span>.
                </p>
              </div>
            </div>

            {noInspectionProfiles.length > 0 && (
              <div className="ml-7">
                <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                  <Shield size={12} className="text-red-400" /> No-Inspection Profiles (Full Bypass)
                </div>
                <div className="space-y-1.5">
                  {noInspectionProfiles.map(p => (
                    <div key={p.id} className="flex items-center gap-2 p-2 bg-red-950/30 border border-red-900/30 rounded-lg text-xs">
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 font-medium">{p.name}</span>
                      <span className="text-red-400">→ All traffic bypasses ATP, Malware, DLP, and URL filtering</span>
                      <span className="ml-auto text-gray-600">Used in {p.usedInPolicies} {p.usedInPolicies === 1 ? 'policy' : 'policies'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profilesWithExemptions.length > 0 && (
              <div className="ml-7">
                <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                  <GlobeIcon size={12} className="text-amber-400" /> Exempt Domains & Categories (Partial Bypass)
                </div>
                <div className="space-y-2">
                  {profilesWithExemptions.map(p => (
                    <div key={p.id} className="p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700 font-medium">{p.name}</span>
                        <span className="text-amber-400/80">({modeBadge[p.mode].label})</span>
                      </div>
                      {p.exemptDomains.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-gray-500">Exempt domains:</span>
                          {p.exemptDomains.map(d => (
                            <span key={d} className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 text-[10px] font-mono border border-red-800/50">{d}</span>
                          ))}
                          <span className="text-red-400 text-[10px]">← No ATP/Malware scan</span>
                        </div>
                      )}
                      {p.exemptCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-gray-500">Exempt categories:</span>
                          {p.exemptCategories.map(c => (
                            <span key={c} className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 text-[10px] border border-red-800/50">{c}</span>
                          ))}
                          <span className="text-red-400 text-[10px]">← No ATP/Malware scan</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="ml-7 p-3 bg-gray-900/60 border border-gray-800 rounded-lg text-xs space-y-1.5">
              <div className="text-gray-300 font-medium">Recommended Mitigations for Exempted Traffic:</div>
              <ul className="list-disc list-inside text-gray-400 space-y-0.5">
                <li>Enable <span className="text-blue-400">DNS Security</span> filtering — blocks known malicious domains even without decryption</li>
                <li>Apply <span className="text-blue-400">URL Category filtering</span> — restrict exempt domains to approved categories only</li>
                <li>Configure <span className="text-blue-400">Certificate Inspection</span> mode instead of No Inspection where possible — validates cert chain without full inline proxy</li>
                <li>Deploy <span className="text-blue-400">Endpoint Detection & Response (EDR)</span> agents on all devices accessing exempt URLs</li>
                <li>Enable <span className="text-blue-400">JA3/JA3S TLS fingerprinting</span> — detect malicious TLS signatures without decryption</li>
                <li>Schedule periodic <span className="text-blue-400">exemption reviews</span> — audit which domains still require bypass quarterly</li>
                <li>Monitor exempt traffic via <span className="text-blue-400">AI/ML UEBA</span> — behavioral anomaly detection on metadata (SNI, cert hashes, volume)</li>
              </ul>
            </div>
          </div>
        );
      })()}

      {/* ─── JA3 / JA3S TLS Fingerprinting ─── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/30 rounded-lg"><Shield size={18} className="text-purple-400" /></div>
            <div>
              <h3 className="text-sm font-semibold">JA3 / JA3S TLS Fingerprinting</h3>
              <p className="text-[11px] text-gray-500">Detect malicious TLS clients &amp; servers by their handshake fingerprint — no decryption required</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-[10px] bg-green-900/30 text-green-400 border border-green-800/40">ENABLED</span>
            <button className="text-xs text-gray-400 hover:text-gray-200 transition-colors">Configure →</button>
          </div>
        </div>

        {/* JA3 Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Unique JA3 Hashes Seen', value: '1,247', sub: 'Last 24h', color: 'text-purple-400' },
            { label: 'Known-Bad Matches', value: '14', sub: 'Auto-blocked', color: 'text-red-400' },
            { label: 'JA3S Server Hashes', value: '892', sub: 'Catalogued', color: 'text-blue-400' },
            { label: 'TLS Anomalies Flagged', value: '7', sub: 'Unusual cipher suites', color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-3">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-gray-500">{s.label}</div>
              <div className="text-[9px] text-gray-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Known-Bad JA3 Database */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">Known-Bad JA3 Hash Database</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left px-3 py-1.5 font-medium">JA3 Hash</th>
                  <th className="text-left px-3 py-1.5 font-medium">Threat</th>
                  <th className="text-left px-3 py-1.5 font-medium">Category</th>
                  <th className="text-center px-3 py-1.5 font-medium">Action</th>
                  <th className="text-right px-3 py-1.5 font-medium">Hits (24h)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {[
                  { hash: 'e7d705a3286e19ea42f587b344ee6865', threat: 'Cobalt Strike Beacon', cat: 'C2 Framework', action: 'Block', hits: 3 },
                  { hash: '72a589da586844d7f0818ce684948eea', threat: 'Emotet Loader', cat: 'Malware Dropper', action: 'Block', hits: 7 },
                  { hash: 'a0e9f5d64349fb13191bc781f81f42e1', threat: 'Metasploit Meterpreter', cat: 'Exploitation Tool', action: 'Block', hits: 1 },
                  { hash: '51c64c77e60f3980eea90869b68c58a8', threat: 'TrickBot Banking Trojan', cat: 'Banking Malware', action: 'Block', hits: 0 },
                  { hash: 'd44c5d7b9a370d845c5a168d2f90a4f2', threat: 'AsyncRAT', cat: 'RAT', action: 'Block', hits: 2 },
                  { hash: '6734f37431670b3ab4292b8f60f29984', threat: 'Sliver C2 (Go)', cat: 'C2 Framework', action: 'Block + Alert', hits: 1 },
                ].map(r => (
                  <tr key={r.hash} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-3 py-1.5 font-mono text-purple-300">{r.hash.slice(0, 16)}…</td>
                    <td className="px-3 py-1.5 text-gray-300">{r.threat}</td>
                    <td className="px-3 py-1.5"><span className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 text-[9px] border border-red-800/40">{r.cat}</span></td>
                    <td className="px-3 py-1.5 text-center"><span className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 text-[9px]">{r.action}</span></td>
                    <td className="px-3 py-1.5 text-right text-gray-400">{r.hits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* JA3S Anomaly Detection */}
        <div>
          <h4 className="text-xs font-medium text-gray-400 mb-2">JA3S Server-Side Anomalies</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { server: '185.220.101.34:443', ja3s: '15af977ce25de1c2bg78df89c8c', anomaly: 'Non-standard cipher negotiation (TLS_NULL_WITH_NULL_NULL offered)', severity: 'critical' },
              { server: '91.234.99.100:8443', ja3s: 'f4e9cb89b95aebf3cd1e22f7a42', anomaly: 'JA3S matches known Cobalt Strike TeamServer response', severity: 'critical' },
              { server: '203.0.113.55:443', ja3s: 'a732f3204e5b6f3b412cb2e0e7d', anomaly: 'TLS 1.0 only — deprecated protocol, possible downgrade attack', severity: 'warning' },
            ].map(a => (
              <div key={a.server} className={`p-3 rounded-lg border ${a.severity === 'critical' ? 'bg-red-950/20 border-red-800/30' : 'bg-amber-950/20 border-amber-800/30'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-gray-300">{a.server}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${a.severity === 'critical' ? 'bg-red-900/30 text-red-400' : 'bg-amber-900/30 text-amber-400'}`}>{a.severity}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono mb-1">JA3S: {a.ja3s.slice(0, 20)}…</div>
                <p className="text-[10px] text-gray-400">{a.anomaly}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-2 border-t border-gray-800/60">
          <div className="flex justify-between"><span className="text-gray-500">Auto-block known-bad JA3</span><span className="text-green-400">Enabled</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Feed update frequency</span><span className="text-gray-300">Every 15 min</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Log all JA3 hashes</span><span className="text-green-400">Enabled</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Alert on unknown JA3S</span><span className="text-amber-400">Warning only</span></div>
          <div className="flex justify-between"><span className="text-gray-500">TI feed sources</span><span className="text-gray-300">abuse.ch, JA3er.com, internal</span></div>
          <div className="flex justify-between"><span className="text-gray-500">SIEM forwarding</span><span className="text-green-400">CEF to Splunk</span></div>
        </div>
      </div>

      {/* Profile cards */}
      <div className="grid grid-cols-1 gap-4">
        {profiles.map(profile => (
          <div key={profile.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!profile.enabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-yellow-400" />
                <div>
                  <h3 className="font-semibold">{profile.name}</h3>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-medium border ${modeBadge[profile.mode].color}`}>
                    {modeBadge[profile.mode].label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">
                  {profile.usedInPolicies} policies
                </span>
                <button
                  onClick={() => handleToggle(profile.id)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${profile.enabled ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${profile.enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
                <button onClick={() => setViewProfile(profile)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Eye size={14} /></button>
                {!profile.builtin && (
                  <>
                    <button onClick={() => setViewProfile(profile)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(profile.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Untrusted Certs</div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${certActionBadge[profile.untrustedCertAction]}`}>
                  {profile.untrustedCertAction.toUpperCase()}
                </span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Expired Certs</div>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${certActionBadge[profile.expiredCertAction]}`}>
                  {profile.expiredCertAction.toUpperCase()}
                </span>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">CA Bundle</div>
                <span className="text-xs text-gray-300">{profile.caBundle || 'N/A'}</span>
              </div>
            </div>

            {profile.exemptDomains.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 mr-1">Exempt domains:</span>
                {profile.exemptDomains.map(d => (
                  <span key={d} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs font-mono">{d}</span>
                ))}
              </div>
            )}

            {/* TLS/Cert quick summary */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900/20 text-blue-400 border border-blue-800/30">
                TLS {profile.certVerification.tlsMinVersion}+
              </span>
              {profile.certVerification.pinningTest && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-900/20 text-teal-400 border border-teal-800/30">
                  Pinning
                </span>
              )}
              {profile.certVerification.checkOcsp && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/20 text-green-400 border border-green-800/30">
                  OCSP
                </span>
              )}
              {profile.certVerification.ctLogVerification && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/20 text-purple-400 border border-purple-800/30">
                  CT Logs
                </span>
              )}
              <button
                onClick={() => setConfigureProfile(configureProfile === profile.id ? null : profile.id)}
                className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition-colors"
              >
                <Settings size={12} />
                {configureProfile === profile.id ? 'Close' : 'Configure Verification'}
              </button>
            </div>

            {/* Cert Verification Editor (expanded) */}
            {configureProfile === profile.id && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <CertVerificationEditor
                  config={profile.certVerification}
                  onChange={(config) => handleCertConfigChange(profile.id, config)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {viewProfile && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewProfile(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock size={18} className="text-yellow-400" />
              {viewProfile.name}
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Inspection Mode</h4>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium border ${modeBadge[viewProfile.mode].color}`}>
                  {modeBadge[viewProfile.mode].label}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Exempt Categories</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.exemptCategories.length > 0
                    ? viewProfile.exemptCategories.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded bg-orange-900/30 text-orange-300 text-xs">{c}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Exempt Domains</h4>
                <div className="flex flex-wrap gap-1">
                  {viewProfile.exemptDomains.length > 0
                    ? viewProfile.exemptDomains.map(d => (
                        <span key={d} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-xs font-mono">{d}</span>
                      ))
                    : <span className="text-gray-600">None</span>
                  }
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Log decrypted traffic:</span>
                <span className={viewProfile.logDecryptedTraffic ? 'text-green-400' : 'text-gray-600'}>
                  {viewProfile.logDecryptedTraffic ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setViewProfile(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Close</button>
            </div>
          </div>
        </>
      )}
      {/* Create modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create SSL Profile</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Profile Name</label>
                <input value={newProfile.name} onChange={e => setNewProfile({ ...newProfile, name: e.target.value })} placeholder="e.g. Custom-SSL" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Inspection Mode</label>
                <select value={newProfile.mode} onChange={e => setNewProfile({ ...newProfile, mode: e.target.value as SslProfile['mode'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="full-inspection">Full Inspection (Inline Proxy)</option>
                  <option value="certificate-inspection">Certificate Only</option>
                  <option value="no-inspection">No Inspection</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Untrusted Cert Action</label>
                  <select value={newProfile.untrustedCertAction} onChange={e => setNewProfile({ ...newProfile, untrustedCertAction: e.target.value as SslProfile['untrustedCertAction'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="block">Block</option>
                    <option value="allow-warn">Allow + Warn</option>
                    <option value="allow">Allow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Expired Cert Action</label>
                  <select value={newProfile.expiredCertAction} onChange={e => setNewProfile({ ...newProfile, expiredCertAction: e.target.value as SslProfile['expiredCertAction'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="block">Block</option>
                    <option value="allow-warn">Allow + Warn</option>
                    <option value="allow">Allow</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">CA Bundle</label>
                <input value={newProfile.caBundle} onChange={e => setNewProfile({ ...newProfile, caBundle: e.target.value })} placeholder="e.g. Acme Corp Root CA" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Exempt Domains (comma-separated)</label>
                <input value={newProfile.exemptDomains.join(', ')} onChange={e => setNewProfile({ ...newProfile, exemptDomains: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="*.bank.com, *.healthcare.gov" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Log Decrypted Traffic</span>
                <button onClick={() => setNewProfile({ ...newProfile, logDecryptedTraffic: !newProfile.logDecryptedTraffic })} className={`w-8 h-4 rounded-full transition-colors relative ${newProfile.logDecryptedTraffic ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${newProfile.logDecryptedTraffic ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} disabled={!newProfile.name.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">Create Profile</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
