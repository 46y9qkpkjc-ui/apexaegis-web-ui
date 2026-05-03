'use client';
import React, { useState, useMemo } from 'react';
import { X, Plus, ChevronDown, Lock } from 'lucide-react';
import { InlineObjectCreator } from './inline-object-creator';
import { detectDuplicates, DuplicatePolicyAlert, type PolicyFingerprint } from './duplicate-detector';
import { ContentInspectionEditor, DEFAULT_CONTENT_INSPECTION, type ContentInspectionConfig } from './content-inspection';
import { ActivityControlEditor, DEFAULT_ACTIVITY_CONTROLS, type ActivityControlConfig } from './activity-controls';
import { WafEditor, DEFAULT_WAF_CONFIG, type WafConfig } from './waf-editor';
import { IapEditor, DEFAULT_IAP_CONFIG, type IapConfig } from './reverse-proxy-editor';
import { useFeatures } from '@/hooks/use-features';

interface PolicyEditorProps {
  policy: any | null;
  onClose: () => void;
  onSave: (policy: any) => void;
  existingPolicies?: PolicyFingerprint[];
}

// Simulated object lists (from API)
const availableUsers = ['All Users', 'Engineering', 'Product', 'Sales', 'HR', 'Finance', 'IT Admins'];
const availableDeviceGroups = ['All Devices', 'Managed Devices', 'BYOD', 'Mobile', 'Kiosk'];
const availableAddresses = ['any', 'Internal Subnets', 'VPN Pool', 'Guest Network', 'Server Farm'];
const availableUrlCategories = [
  'Malware', 'Phishing', 'Spyware', 'Cryptomining', 'Fraud',
  'Newly Registered Domains', 'Newly Observed Domains', 'Adult Content',
  'Gambling', 'Social Media', 'Streaming Media', 'Gaming',
  'Hacking', 'Proxy Avoidance', 'Parked Domains',
];
const availableCloudApps = [
  'Microsoft 365', 'Google Workspace', 'Slack', 'GitHub', 'Jira',
  'Salesforce', 'Dropbox', 'Box', 'Zoom', 'AWS Console',
];
const availableServices = ['any', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'RDP', 'FTP', 'SMTP'];
const availableAtpProfiles = ['None', 'Default-ATP', 'Strict-ATP', 'Monitor-Only'];
const availableSslProfiles = ['None', 'Certificate Inspection', 'Full Inspection', 'No Inspection'];
const availableDnsLists = ['None', 'Block-Malicious', 'Block-NRD-NOD', 'Custom-Blocklist'];

type CreatingType = 'address' | 'service' | 'user-group' | 'device-group' | 'url-category' | 'cloud-app' | 'atp-profile' | 'ssl-profile' | 'dns-list' | null;

export function PolicyEditor({ policy, onClose, onSave, existingPolicies = [] }: PolicyEditorProps) {
  const isNew = !policy;
  const { isEnabled } = useFeatures();

  const [name, setName] = useState(policy?.name || '');
  const [enabled, setEnabled] = useState(policy?.enabled ?? true);
  const [trafficSteering, setTrafficSteering] = useState(policy?.trafficSteering || 'internet');
  const [accessMethods, setAccessMethods] = useState<string[]>(policy?.accessMethod || ['browser', 'api']);
  const [sourceUsers, setSourceUsers] = useState<string[]>(policy?.sourceUsers || []);
  const [sourceDeviceGroups, setSourceDeviceGroups] = useState<string[]>(policy?.sourceDeviceGroups || []);
  const [sourceAddresses, setSourceAddresses] = useState<string[]>(policy?.sourceAddresses || ['any']);
  const [destAddresses, setDestAddresses] = useState<string[]>(policy?.destAddresses || ['any']);
  const [destUrlCategories, setDestUrlCategories] = useState<string[]>(policy?.destUrlCategories || []);
  const [destCloudApps, setDestCloudApps] = useState<string[]>(policy?.destCloudApps || []);
  const [services, setServices] = useState<string[]>(policy?.services || ['HTTPS']);
  const [atpProfile, setAtpProfile] = useState(policy?.atpProfile || 'None');
  const [sslProfile, setSslProfile] = useState(policy?.sslProfile || 'None');
  const [dnsFilterList, setDnsFilterList] = useState(policy?.dnsFilterList || 'None');
  const [action, setAction] = useState<string>(policy?.action || 'allow');
  const [logTraffic, setLogTraffic] = useState(policy?.logTraffic ?? true);

  // Content inspection & activity controls
  const [contentInspection, setContentInspection] = useState<ContentInspectionConfig>(
    policy?.contentInspection || DEFAULT_CONTENT_INSPECTION
  );
  const [activityControls, setActivityControls] = useState<ActivityControlConfig>(
    policy?.activityControls || DEFAULT_ACTIVITY_CONTROLS
  );
  const [wafConfig, setWafConfig] = useState<WafConfig>(
    policy?.wafConfig || DEFAULT_WAF_CONFIG
  );
  const [iapConfig, setIapConfig] = useState<IapConfig>(
    policy?.iapConfig || DEFAULT_IAP_CONFIG
  );

  // Inline object creation state
  const [creatingType, setCreatingType] = useState<CreatingType>(null);

  // Duplicate detection
  const duplicateMatches = useMemo(() => {
    const draft: PolicyFingerprint = {
      name,
      action,
      sourceUsers,
      sourceAddresses,
      destUrlCategories,
      destCloudApps,
      destAddresses,
      services,
      dnsFilterList: dnsFilterList === 'None' ? null : dnsFilterList,
    };
    return detectDuplicates(draft, existingPolicies, isNew ? undefined : policy?.name);
  }, [name, action, sourceUsers, sourceAddresses, destUrlCategories, destCloudApps, destAddresses, services, dnsFilterList, existingPolicies, isNew, policy?.name]);

  const handleSave = () => {
    onSave({
      ...policy,
      name, enabled, trafficSteering, accessMethod: accessMethods,
      sourceUsers, sourceDeviceGroups, sourceAddresses,
      destAddresses, destUrlCategories, destCloudApps,
      services, atpProfile: atpProfile === 'None' ? null : atpProfile,
      sslProfile: sslProfile === 'None' ? null : sslProfile,
      dnsFilterList: dnsFilterList === 'None' ? null : dnsFilterList,
      action, logTraffic,
      contentInspection: contentInspection.enabled ? contentInspection : null,
      activityControls: activityControls.enabled ? activityControls : null,
      wafConfig: wafConfig.enabled ? wafConfig : null,
      iapConfig: iapConfig.enabled ? iapConfig : null,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[640px] bg-gray-900 border-l border-gray-800 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">
            {isNew ? 'Create Security Policy' : `Edit: ${policy.name}`}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Basic */}
          <Section title="General">
            <Field label="Policy Name">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Block Malware Sites"
                className="input-field"
              />
            </Field>
            <Field label="Traffic Steering">
              <select value={trafficSteering} onChange={e => setTrafficSteering(e.target.value)} className="input-field">
                <option value="internet">Internet</option>
                <option value="private_access">Private Access</option>
                <option value="saas">SaaS</option>
              </select>
            </Field>
            <Field label="Access Method">
              <MultiToggle
                options={['browser', 'api', 'agent', 'remote_access']}
                selected={accessMethods}
                onToggle={(m) => setAccessMethods(prev =>
                  prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
                )}
              />
            </Field>
          </Section>

          {/* Source */}
          <Section title="Source">
            <Field label="Users / Groups">
              <MultiSelect
                selected={sourceUsers}
                options={availableUsers}
                onChange={setSourceUsers}
                onCreateNew={() => setCreatingType('user-group')}
              />
            </Field>
            <Field label="Device Groups">
              <MultiSelect
                selected={sourceDeviceGroups}
                options={availableDeviceGroups}
                onChange={setSourceDeviceGroups}
                onCreateNew={() => setCreatingType('device-group')}
              />
            </Field>
            <Field label="Source Addresses">
              <MultiSelect
                selected={sourceAddresses}
                options={availableAddresses}
                onChange={setSourceAddresses}
                onCreateNew={() => setCreatingType('address')}
              />
            </Field>
          </Section>

          {/* Destination */}
          <Section title="Destination">
            <Field label="URL Categories">
              <MultiSelect
                selected={destUrlCategories}
                options={availableUrlCategories}
                onChange={setDestUrlCategories}
                onCreateNew={() => setCreatingType('url-category')}
              />
            </Field>
            <Field label="Cloud Applications">
              <MultiSelect
                selected={destCloudApps}
                options={availableCloudApps}
                onChange={setDestCloudApps}
                onCreateNew={() => setCreatingType('cloud-app')}
              />
            </Field>
            <Field label="Destination Addresses">
              <MultiSelect
                selected={destAddresses}
                options={availableAddresses}
                onChange={setDestAddresses}
                onCreateNew={() => setCreatingType('address')}
              />
            </Field>
          </Section>

          {/* Service */}
          <Section title="Service">
            <Field label="Services">
              <MultiSelect
                selected={services}
                options={availableServices}
                onChange={setServices}
                onCreateNew={() => setCreatingType('service')}
              />
            </Field>
          </Section>

          {/* Security Profiles */}
          <Section title="Security Profiles">
            {isEnabled('atp') ? (
              <Field label="ATP Profile">
                <select value={atpProfile} onChange={e => setAtpProfile(e.target.value)} className="input-field">
                  {availableAtpProfiles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            ) : (
              <LockedField label="ATP Profile" feature="Advanced Threat Protection" />
            )}
            {isEnabled('ssl-inspect') ? (
              <Field label="SSL Inspection">
                <select value={sslProfile} onChange={e => setSslProfile(e.target.value)} className="input-field">
                  {availableSslProfiles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            ) : (
              <LockedField label="SSL Inspection" feature="SSL Inspection" />
            )}
            {isEnabled('dns-filter') ? (
              <Field label="DNS Filter">
                <select value={dnsFilterList} onChange={e => setDnsFilterList(e.target.value)} className="input-field">
                  {availableDnsLists.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            ) : (
              <LockedField label="DNS Filter" feature="DNS Filter" />
            )}
          </Section>
          {/* Content & Header Inspection */}
          {isEnabled('dlp') ? (
            <Section title="Advanced Inspection">
              <ContentInspectionEditor
                config={contentInspection}
                onChange={setContentInspection}
              />
            </Section>
          ) : (
            <Section title="Advanced Inspection">
              <LockedField label="Content Inspection (DLP)" feature="Data Loss Prevention" />
            </Section>
          )}

          {/* Activity Controls */}
          {isEnabled('casb') ? (
            <Section title="Activity Controls">
              <ActivityControlEditor
                config={activityControls}
                onChange={setActivityControls}
                policyAction={action}
              />
            </Section>
          ) : (
            <Section title="Activity Controls">
              <LockedField label="Activity Controls (CASB)" feature="Cloud Access Security Broker" />
            </Section>
          )}

          {/* WAF */}
          {isEnabled('fwaas') ? (
            <Section title="Web Application Firewall">
              <WafEditor config={wafConfig} onChange={setWafConfig} />
            </Section>
          ) : (
            <Section title="Web Application Firewall">
              <LockedField label="WAF" feature="Firewall as a Service" />
            </Section>
          )}

          {/* Identity-Aware Proxy */}
          <Section title="Identity-Aware Proxy">
            <IapEditor config={iapConfig} onChange={setIapConfig} />
          </Section>
          {/* Duplicate Detection */}
          <Section title="Duplicate Check">
            <DuplicatePolicyAlert matches={duplicateMatches} />
          </Section>

          {/* Action */}
          <Section title="Action">
            <div className="flex gap-2">
              {['allow', 'deny', 'monitor'].map(a => (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    action === a
                      ? a === 'allow' ? 'bg-green-900/40 border-green-600 text-green-400'
                        : a === 'deny' ? 'bg-red-900/40 border-red-600 text-red-400'
                        : 'bg-yellow-900/40 border-yellow-600 text-yellow-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  {a.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                id="logTraffic"
                checked={logTraffic}
                onChange={e => setLogTraffic(e.target.checked)}
                className="rounded border-gray-600"
              />
              <label htmlFor="logTraffic" className="text-sm text-gray-400">Log matching traffic</label>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
            {isNew ? 'Create Policy' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Inline Object Creator Modal */}
      {creatingType && (
        <InlineObjectCreator
          type={creatingType}
          onClose={() => setCreatingType(null)}
          onCreated={(newObj) => {
            // Add the newly created object to the appropriate field
            switch (creatingType) {
              case 'address':
                setSourceAddresses(prev => [...prev, newObj.name]);
                break;
              case 'service':
                setServices(prev => [...prev, newObj.name]);
                break;
              case 'user-group':
                setSourceUsers(prev => [...prev, newObj.name]);
                break;
              case 'device-group':
                setSourceDeviceGroups(prev => [...prev, newObj.name]);
                break;
              case 'url-category':
                setDestUrlCategories(prev => [...prev, newObj.name]);
                break;
              case 'cloud-app':
                setDestCloudApps(prev => [...prev, newObj.name]);
                break;
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

function MultiToggle({ options, selected, onToggle }: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onToggle(opt)}
          className={`px-3 py-1 rounded-lg text-xs transition-colors border ${
            selected.includes(opt)
              ? 'bg-blue-900/40 border-blue-600 text-blue-300'
              : 'bg-gray-800 border-gray-700 text-gray-400'
          }`}
        >
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

  // Close dropdown when clicking outside
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

  const filtered = options.filter(o =>
    o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o)
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected tags */}
      <div
        className="min-h-[38px] flex flex-wrap gap-1 p-1.5 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selected.map(s => (
          <span
            key={s}
            className="flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-xs"
          >
            {s}
            <button
              onClick={e => { e.stopPropagation(); onChange(selected.filter(x => x !== s)); }}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-gray-500 text-sm px-1 py-0.5">Select...</span>
        )}
        <ChevronDown size={14} className="ml-auto self-center text-gray-500" />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col">
          <div className="p-2 border-b border-gray-700">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm placeholder:text-gray-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-32">
            {filtered.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange([...selected, opt]); setSearch(''); }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-700/50 transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
          {/* Create New inline */}
          <button
            onClick={() => { setOpen(false); onCreateNew(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-blue-900/20 border-t border-gray-700 transition-colors flex-shrink-0"
          >
            <Plus size={14} />
            Create New...
          </button>
        </div>
      )}
    </div>
  );
}
