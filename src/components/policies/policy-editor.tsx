'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, ChevronDown, Lock, ShieldCheck, ShieldAlert, AlertTriangle, Globe, Server, Network } from 'lucide-react';
import { InlineObjectCreator } from './inline-object-creator';
import { detectDuplicates, DuplicatePolicyAlert, type PolicyFingerprint } from './duplicate-detector';
import { ContentInspectionEditor, DEFAULT_CONTENT_INSPECTION, type ContentInspectionConfig } from './content-inspection';
import { ActivityControlEditor, DEFAULT_ACTIVITY_CONTROLS, type ActivityControlConfig } from './activity-controls';
import { WafEditor, DEFAULT_WAF_CONFIG, type WafConfig } from './waf-editor';
import { useFeatures } from '@/hooks/use-features';
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

interface PolicyEditorProps {
  policy: any | null;
  onClose: () => void;
  onSave: (policy: any) => void;
  existingPolicies?: PolicyFingerprint[];
}

// Object lists. URL categories load live from the API (see effect below); the rest
// are seeded here until wired to their own object endpoints.
const availableUserGroups = ['All Users', 'Engineering', 'Product', 'Sales', 'HR', 'Finance Users', 'IT Admins', 'Domain Users'];
const availableUsers = ['mark.anderson', 'sarah.lee', 'john.tan', 'priya.n', 'admin'];
const availableDeviceGroups = ['All Devices', 'Managed Devices', 'BYOD', 'Mobile', 'Kiosk'];
const availableCloudApps = ['Microsoft 365', 'Google Workspace', 'Slack', 'GitHub', 'Jira', 'Salesforce', 'Dropbox', 'Box', 'Zoom', 'AWS Console'];
const FALLBACK_URL_CATEGORIES = ['Financial Services', 'Social Media', 'Streaming Media', 'Shopping', 'News', 'Gambling', 'Malware', 'Phishing'];
// Services never include "any" — a policy must name the protocols it governs.
const availableServices = ['HTTPS', 'HTTP', 'SSH', 'RDP', 'DNS', 'FTP', 'SMTP'];
const browserOptions = ['Chrome', 'Edge', 'Firefox', 'Safari'];
const availableAtpProfiles = ['None', 'Default-ATP', 'Strict-ATP', 'Monitor-Only'];
const availableSslProfiles = ['None', 'Certificate Inspection', 'Full Inspection', 'No Inspection'];
const availableDnsLists = ['None', 'Block-Malicious', 'Block-NRD-NOD', 'Custom-Blocklist'];

type CreatingType = 'service' | 'user-group' | 'device-group' | 'url-category' | 'cloud-app' | null;

const STEERING = [
  { value: 'internet', label: 'Internet', icon: Globe, hint: 'Outbound web / SaaS access' },
  { value: 'private_access', label: 'Private Access', icon: Server, hint: 'Internal apps (ZTNA)' },
  { value: 'dns', label: 'DNS', icon: Network, hint: 'Resolver-level filtering' },
];

export function PolicyEditor({ policy, onClose, onSave, existingPolicies = [] }: PolicyEditorProps) {
  const isNew = !policy;
  const { isEnabled } = useFeatures();

  const [name, setName] = useState(policy?.name || '');
  const [enabled, setEnabled] = useState(policy?.enabled ?? true);
  const [trafficSteering, setTrafficSteering] = useState(policy?.trafficSteering || 'internet');
  const [accessMethods, setAccessMethods] = useState<string[]>(policy?.accessMethod || ['browser']);
  const [browsers, setBrowsers] = useState<string[]>(policy?.browsers || ['Chrome', 'Edge', 'Firefox', 'Safari']);

  // Source
  const [sourceUserGroups, setSourceUserGroups] = useState<string[]>(policy?.sourceUserGroups || []);
  const [specifyUsers, setSpecifyUsers] = useState<boolean>((policy?.sourceUsers?.length ?? 0) > 0);
  const [sourceUsers, setSourceUsers] = useState<string[]>(policy?.sourceUsers || []);
  const [devicePosture, setDevicePosture] = useState<string>(policy?.devicePosture || 'compliant');
  const [sourceDeviceGroups, setSourceDeviceGroups] = useState<string[]>(policy?.sourceDeviceGroups || []);

  // Destination
  const [destUrl, setDestUrl] = useState<string>(policy?.destUrl || (Array.isArray(policy?.destAddresses) ? policy.destAddresses.filter((a: string) => a !== 'any').join(', ') : ''));
  const [matchUrlCategory, setMatchUrlCategory] = useState<boolean>((policy?.destUrlCategories?.length ?? 0) > 0);
  const [destUrlCategories, setDestUrlCategories] = useState<string[]>(policy?.destUrlCategories || []);
  const [matchCloudApp, setMatchCloudApp] = useState<boolean>((policy?.destCloudApps?.length ?? 0) > 0);
  const [destCloudApps, setDestCloudApps] = useState<string[]>(policy?.destCloudApps || []);

  const [services, setServices] = useState<string[]>(policy?.services?.filter((s: string) => s !== 'any') || ['HTTPS']);

  // Protection
  const [atpProfile, setAtpProfile] = useState(policy?.atpProfile || 'None');
  const [sslProfile, setSslProfile] = useState(policy?.sslProfile || 'None');
  const [dnsFilterList, setDnsFilterList] = useState(policy?.dnsFilterList || 'None');
  const [aimlAnomaly, setAimlAnomaly] = useState<boolean>(policy?.aimlAnomaly ?? false);
  const [uebaEnabled, setUebaEnabled] = useState<boolean>(policy?.uebaEnabled ?? false);
  const [riskThreshold, setRiskThreshold] = useState<string>(policy?.riskThreshold || 'high');

  const [contentInspection, setContentInspection] = useState<ContentInspectionConfig>(policy?.contentInspection || DEFAULT_CONTENT_INSPECTION);
  const [activityControls, setActivityControls] = useState<ActivityControlConfig>(policy?.activityControls || DEFAULT_ACTIVITY_CONTROLS);
  const [wafConfig, setWafConfig] = useState<WafConfig>(policy?.wafConfig || DEFAULT_WAF_CONFIG);

  const [action, setAction] = useState<string>(policy?.action || 'allow');
  const [logTraffic, setLogTraffic] = useState(policy?.logTraffic ?? true);
  const [ackNonCompliant, setAckNonCompliant] = useState<boolean>(false);

  const [urlCategoryOptions, setUrlCategoryOptions] = useState<string[]>(FALLBACK_URL_CATEGORIES);
  const [creatingType, setCreatingType] = useState<CreatingType>(null);

  const isInternet = trafficSteering === 'internet';
  const isPrivate = trafficSteering === 'private_access';
  const isDns = trafficSteering === 'dns';

  // Load real URL categories (from the objects API built in Bucket 3).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = useAuthStore.getState().accessToken;
        const res = await fetch(apiUrl('/api/v1/objects/url-categories'), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) return;
        const data = await res.json();
        const names = (data.categories ?? []).map((c: any) => c.name).filter(Boolean);
        if (!cancelled && names.length) setUrlCategoryOptions(names);
      } catch { /* keep fallback list */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Compliance gate: an allow policy must not admit non-compliant devices unless
  // posture requires compliance — or the admin explicitly acknowledges the risk.
  const gateBlocked = action === 'allow' && devicePosture !== 'compliant' && !ackNonCompliant;

  const duplicateMatches = useMemo(() => {
    const draft: PolicyFingerprint = {
      name, action,
      sourceUsers: [...sourceUserGroups, ...sourceUsers],
      sourceAddresses: [],
      destUrlCategories,
      destCloudApps,
      destAddresses: destUrl ? [destUrl] : [],
      services,
      dnsFilterList: dnsFilterList === 'None' ? null : dnsFilterList,
    };
    return detectDuplicates(draft, existingPolicies, isNew ? undefined : policy?.name);
  }, [name, action, sourceUserGroups, sourceUsers, destUrlCategories, destCloudApps, destUrl, services, dnsFilterList, existingPolicies, isNew, policy?.name]);

  const handleSave = () => {
    if (gateBlocked) return;
    onSave({
      ...policy,
      name, enabled, trafficSteering,
      accessMethod: isDns ? [] : accessMethods,
      browsers: !isDns && accessMethods.includes('browser') ? browsers : [],
      sourceUserGroups,
      sourceUsers: specifyUsers ? sourceUsers : [],
      devicePosture,
      sourceDeviceGroups,
      destUrl,
      destAddresses: destUrl ? destUrl.split(',').map(s => s.trim()).filter(Boolean) : [],
      destUrlCategories: (isInternet || isDns) && matchUrlCategory ? destUrlCategories : [],
      destCloudApps: isInternet && matchCloudApp ? destCloudApps : [],
      services: isDns ? [] : services,
      atpProfile: isInternet && atpProfile !== 'None' ? atpProfile : null,
      sslProfile: isInternet && sslProfile !== 'None' ? sslProfile : null,
      dnsFilterList: isDns && dnsFilterList !== 'None' ? dnsFilterList : null,
      aimlAnomaly: isPrivate ? aimlAnomaly : false,
      uebaEnabled: !isDns ? uebaEnabled : false,
      riskThreshold: !isDns && uebaEnabled ? riskThreshold : null,
      action, logTraffic,
      contentInspection: isInternet && contentInspection.enabled ? contentInspection : null,
      activityControls: isInternet && activityControls.enabled ? activityControls : null,
      wafConfig: isPrivate && wafConfig.enabled ? wafConfig : null,
      iapConfig: null,
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[640px] bg-gray-900 border-l border-gray-800 z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">{isNew ? 'Create Security Policy' : `Edit: ${policy.name}`}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* General */}
          <Section title="General">
            <Field label="Policy Name">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Allow Finance to DBS" className="input-field" />
            </Field>
            <Field label="Traffic Steering">
              <div className="grid grid-cols-3 gap-2">
                {STEERING.map(s => {
                  const Icon = s.icon;
                  const active = trafficSteering === s.value;
                  return (
                    <button key={s.value} onClick={() => setTrafficSteering(s.value)}
                      className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs transition-colors ${active ? 'bg-blue-900/40 border-blue-600 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                      <Icon size={16} />
                      <span className="font-medium">{s.label}</span>
                      <span className="text-[10px] text-gray-500 text-center leading-tight px-1">{s.hint}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
            {!isDns && (
              <Field label="Access Method">
                <MultiToggle
                  options={['browser', 'agent', 'api']}
                  selected={accessMethods}
                  onToggle={(m) => setAccessMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])}
                />
                {accessMethods.includes('browser') && (
                  <div className="mt-2 pl-1">
                    <span className="text-[11px] text-gray-500 mr-2">Browsers:</span>
                    <MultiToggle options={browserOptions} selected={browsers}
                      onToggle={(b) => setBrowsers(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])} />
                  </div>
                )}
              </Field>
            )}
          </Section>

          {/* Source */}
          <Section title="Source">
            <Field label="Groups">
              <MultiSelect selected={sourceUserGroups} options={availableUserGroups} onChange={setSourceUserGroups} onCreateNew={() => setCreatingType('user-group')} />
            </Field>
            <div className="flex items-center gap-2">
              <Toggle checked={specifyUsers} onChange={setSpecifyUsers} />
              <span className="text-sm text-gray-400">Apply to specific users instead of whole groups</span>
            </div>
            {specifyUsers && (
              <Field label="Users">
                <MultiSelect selected={sourceUsers} options={availableUsers} onChange={setSourceUsers} onCreateNew={() => setCreatingType('user-group')} />
              </Field>
            )}
            <Field label="Device Posture">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDevicePosture('compliant')}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg border text-sm transition-colors ${devicePosture === 'compliant' ? 'bg-green-900/30 border-green-600 text-green-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                  <ShieldCheck size={15} /> Compliant only
                </button>
                <button onClick={() => setDevicePosture('any')}
                  className={`flex items-center gap-2 py-2 px-3 rounded-lg border text-sm transition-colors ${devicePosture === 'any' ? 'bg-yellow-900/30 border-yellow-600 text-yellow-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                  <ShieldAlert size={15} /> Any device
                </button>
              </div>
            </Field>
            <Field label="Device Groups (optional)">
              <MultiSelect selected={sourceDeviceGroups} options={availableDeviceGroups} onChange={setSourceDeviceGroups} onCreateNew={() => setCreatingType('device-group')} />
            </Field>
          </Section>

          {/* Destination */}
          <Section title="Destination">
            <Field label={isPrivate ? 'Internal application URL / host' : isDns ? 'Domain' : 'Destination URL'}>
              <input value={destUrl} onChange={e => setDestUrl(e.target.value)}
                placeholder={isPrivate ? 'e.g., wiki.corp.internal' : isDns ? 'e.g., *.dbs.com.sg' : 'e.g., www.dbs.com.sg'}
                className="input-field" />
            </Field>
            {(isInternet || isDns) && (
              <>
                <div className="flex items-center gap-2">
                  <Toggle checked={matchUrlCategory} onChange={setMatchUrlCategory} />
                  <span className="text-sm text-gray-400">Match by URL category</span>
                </div>
                {matchUrlCategory && (
                  <MultiSelect selected={destUrlCategories} options={urlCategoryOptions} onChange={setDestUrlCategories} onCreateNew={() => setCreatingType('url-category')} />
                )}
              </>
            )}
            {isInternet && (
              <>
                <div className="flex items-center gap-2">
                  <Toggle checked={matchCloudApp} onChange={setMatchCloudApp} />
                  <span className="text-sm text-gray-400">Match by cloud application</span>
                </div>
                {matchCloudApp && (
                  <MultiSelect selected={destCloudApps} options={availableCloudApps} onChange={setDestCloudApps} onCreateNew={() => setCreatingType('cloud-app')} />
                )}
              </>
            )}
          </Section>

          {/* Service — DNS is resolver-level, so no port/service selection */}
          {!isDns && (
            <Section title="Service">
              <Field label="Services">
                <MultiSelect selected={services} options={availableServices} onChange={setServices} onCreateNew={() => setCreatingType('service')} />
              </Field>
            </Section>
          )}

          {/* Protection — steering-specific */}
          {isInternet && (
            <Section title="Web Protection">
              {isEnabled('ssl-inspect')
                ? <Field label="SSL Inspection"><select value={sslProfile} onChange={e => setSslProfile(e.target.value)} className="input-field">{availableSslProfiles.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
                : <LockedField label="SSL Inspection" feature="SSL Inspection" />}
              {isEnabled('atp')
                ? <Field label="ATP Profile"><select value={atpProfile} onChange={e => setAtpProfile(e.target.value)} className="input-field">{availableAtpProfiles.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
                : <LockedField label="ATP Profile" feature="Advanced Threat Protection" />}
              {isEnabled('dlp')
                ? <ContentInspectionEditor config={contentInspection} onChange={setContentInspection} />
                : <LockedField label="Content Inspection (DLP)" feature="Data Loss Prevention" />}
              {isEnabled('casb')
                ? <ActivityControlEditor config={activityControls} onChange={setActivityControls} policyAction={action} />
                : <LockedField label="Activity Controls (CASB)" feature="Cloud Access Security Broker" />}
            </Section>
          )}

          {isPrivate && (
            <Section title="Private-Access Protection">
              {isEnabled('fwaas')
                ? <WafEditor config={wafConfig} onChange={setWafConfig} />
                : <LockedField label="WAF" feature="Firewall as a Service" />}
              <div className="flex items-center gap-2">
                <Toggle checked={aimlAnomaly} onChange={setAimlAnomaly} />
                <span className="text-sm text-gray-400">AI/ML anomaly detection</span>
              </div>
            </Section>
          )}

          {isDns && (
            <Section title="DNS Filtering">
              {isEnabled('dns-filter')
                ? <Field label="DNS Filter List"><select value={dnsFilterList} onChange={e => setDnsFilterList(e.target.value)} className="input-field">{availableDnsLists.map(p => <option key={p} value={p}>{p}</option>)}</select></Field>
                : <LockedField label="DNS Filter" feature="DNS Filter" />}
            </Section>
          )}

          {/* Risk & behavior (UEBA) */}
          {!isDns && (
            <Section title="Risk & Behavior">
              <div className="flex items-center gap-2">
                <Toggle checked={uebaEnabled} onChange={setUebaEnabled} />
                <span className="text-sm text-gray-400">Risk-based access (UEBA)</span>
              </div>
              {uebaEnabled && (
                <Field label="Block when user/entity risk is at or above">
                  <select value={riskThreshold} onChange={e => setRiskThreshold(e.target.value)} className="input-field">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </Field>
              )}
            </Section>
          )}

          {/* Duplicate detection */}
          <Section title="Duplicate Check">
            <DuplicatePolicyAlert matches={duplicateMatches} />
          </Section>

          {/* Action + compliance gate */}
          <Section title="Action">
            <div className="flex gap-2">
              {['allow', 'deny', 'monitor'].map(a => (
                <button key={a} onClick={() => setAction(a)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    action === a
                      ? a === 'allow' ? 'bg-green-900/40 border-green-600 text-green-400'
                        : a === 'deny' ? 'bg-red-900/40 border-red-600 text-red-400'
                        : 'bg-yellow-900/40 border-yellow-600 text-yellow-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                  {a.toUpperCase()}
                </button>
              ))}
            </div>
            {action === 'allow' && devicePosture !== 'compliant' && (
              <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/60">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-300">
                    This policy allows access from <span className="font-semibold">non-compliant devices</span>. Set Device Posture to “Compliant only”, or acknowledge the risk to proceed.
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-2 pl-6 text-xs text-red-300 cursor-pointer">
                  <input type="checkbox" checked={ackNonCompliant} onChange={e => setAckNonCompliant(e.target.checked)} className="rounded border-red-700" />
                  I understand and want to allow non-compliant devices
                </label>
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <input type="checkbox" id="logTraffic" checked={logTraffic} onChange={e => setLogTraffic(e.target.checked)} className="rounded border-gray-600" />
              <label htmlFor="logTraffic" className="text-sm text-gray-400">Log matching traffic</label>
            </div>
          </Section>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={gateBlocked}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">
            {gateBlocked ? 'Resolve compliance gate' : isNew ? 'Create Policy' : 'Save Changes'}
          </button>
        </div>
      </div>

      {creatingType && (
        <InlineObjectCreator
          type={creatingType}
          onClose={() => setCreatingType(null)}
          onCreated={(newObj) => {
            switch (creatingType) {
              case 'service': setServices(prev => [...prev, newObj.name]); break;
              case 'user-group': setSourceUserGroups(prev => [...prev, newObj.name]); break;
              case 'device-group': setSourceDeviceGroups(prev => [...prev, newObj.name]); break;
              case 'url-category': setDestUrlCategories(prev => [...prev, newObj.name]); break;
              case 'cloud-app': setDestCloudApps(prev => [...prev, newObj.name]); break;
            }
            setCreatingType(null);
          }}
        />
      )}
    </>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} type="button"
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-blue-600' : 'bg-gray-700'}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  );
}

function LockedField({ label, feature }: { label: string; feature: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700/40 rounded-lg">
      <Lock size={14} className="text-gray-600 flex-shrink-0" />
      <div className="flex-1">
        <span className="text-sm text-gray-500">{label}</span>
        <p className="text-[10px] text-gray-600">{feature} is not licensed. Enable it in Feature Licensing.</p>
      </div>
    </div>
  );
}

function MultiToggle({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (val: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button key={opt} onClick={() => onToggle(opt)}
          className={`px-3 py-1 rounded-lg text-xs transition-colors border capitalize ${selected.includes(opt) ? 'bg-blue-900/40 border-blue-600 text-blue-300' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function MultiSelect({ selected, options, onChange, onCreateNew }: {
  selected: string[];
  options: string[];
  onChange: (val: string[]) => void;
  onCreateNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o));

  return (
    <div className="relative" ref={containerRef}>
      <div className="min-h-[38px] flex flex-wrap gap-1 p-1.5 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer" onClick={() => setOpen(!open)}>
        {selected.map(s => (
          <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-xs">
            {s}
            <button onClick={e => { e.stopPropagation(); onChange(selected.filter(x => x !== s)); }} className="text-gray-400 hover:text-white">×</button>
          </span>
        ))}
        {selected.length === 0 && <span className="text-gray-500 text-sm px-1 py-0.5">Select...</span>}
        <ChevronDown size={14} className="ml-auto self-center text-gray-500" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col">
          <div className="p-2 border-b border-gray-700">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." autoFocus
              className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm placeholder:text-gray-500 focus:outline-none" />
          </div>
          <div className="overflow-y-auto max-h-32">
            {filtered.map(opt => (
              <button key={opt} onClick={() => { onChange([...selected, opt]); setSearch(''); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-700/50 transition-colors">
                {opt}
              </button>
            ))}
          </div>
          <button onClick={() => { setOpen(false); onCreateNew(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-blue-900/20 border-t border-gray-700 transition-colors flex-shrink-0">
            <Plus size={14} /> Create New...
          </button>
        </div>
      )}
    </div>
  );
}
