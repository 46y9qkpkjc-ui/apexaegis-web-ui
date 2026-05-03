'use client';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────── */
export interface ActivityRule {
  id: string;
  activity: string;
  label: string;
  description: string;
  permission: 'allow' | 'block' | 'alert' | 'read-only';
  icon: string;
  category: 'data-transfer' | 'content' | 'collaboration' | 'admin' | 'access';
}

export interface ActivityControlConfig {
  enabled: boolean;
  activities: ActivityRule[];
  dlpEnabled: boolean;
  watermarkEnabled: boolean;
  clipboardIsolation: boolean;
  screenshotBlock: boolean;
}

/* ─── Default Activities ───────────────────────────────────── */
const DEFAULT_ACTIVITIES: ActivityRule[] = [
  // Data Transfer
  { id: 'upload', activity: 'upload', label: 'Upload Files', description: 'Upload files to cloud apps or websites', permission: 'allow', icon: '↑', category: 'data-transfer' },
  { id: 'download', activity: 'download', label: 'Download Files', description: 'Download files from cloud apps or websites', permission: 'allow', icon: '↓', category: 'data-transfer' },
  { id: 'print', activity: 'print', label: 'Print', description: 'Print documents or web pages', permission: 'allow', icon: '🖨', category: 'data-transfer' },
  { id: 'clipboard-copy', activity: 'clipboard-copy', label: 'Copy to Clipboard', description: 'Copy content from app to clipboard', permission: 'allow', icon: '📋', category: 'data-transfer' },
  { id: 'clipboard-paste', activity: 'clipboard-paste', label: 'Paste from Clipboard', description: 'Paste content from clipboard into app', permission: 'allow', icon: '📎', category: 'data-transfer' },

  // Content
  { id: 'edit', activity: 'edit', label: 'Edit Content', description: 'Modify files or documents within the app', permission: 'allow', icon: '✏️', category: 'content' },
  { id: 'delete-content', activity: 'delete-content', label: 'Delete Content', description: 'Delete files, messages, or data within the app', permission: 'allow', icon: '🗑', category: 'content' },
  { id: 'create-content', activity: 'create-content', label: 'Create Content', description: 'Create new files, documents, or entries', permission: 'allow', icon: '➕', category: 'content' },

  // Collaboration
  { id: 'share', activity: 'share', label: 'Share / External Share', description: 'Share files or links with external users', permission: 'alert', icon: '🔗', category: 'collaboration' },
  { id: 'post', activity: 'post', label: 'Post / Comment', description: 'Post messages, comments, or status updates', permission: 'allow', icon: '💬', category: 'collaboration' },
  { id: 'invite', activity: 'invite', label: 'Invite Users', description: 'Invite external users or guests to the app', permission: 'alert', icon: '👤', category: 'collaboration' },
  { id: 'email-forward', activity: 'email-forward', label: 'Email Forward', description: 'Forward emails to external addresses', permission: 'alert', icon: '📧', category: 'collaboration' },

  // Admin
  { id: 'admin-settings', activity: 'admin-settings', label: 'Change Settings', description: 'Modify application or account settings', permission: 'block', icon: '⚙️', category: 'admin' },
  { id: 'create-account', activity: 'create-account', label: 'Create Accounts', description: 'Create new user accounts within the app', permission: 'block', icon: '🆕', category: 'admin' },
  { id: 'api-access', activity: 'api-access', label: 'API Access', description: 'Interact with app via API calls', permission: 'alert', icon: '🔌', category: 'admin' },

  // Access
  { id: 'login', activity: 'login', label: 'Login', description: 'Log in to the application', permission: 'allow', icon: '🔐', category: 'access' },
  { id: 'sso-bypass', activity: 'sso-bypass', label: 'SSO Bypass Login', description: 'Login using non-SSO authentication (local credentials)', permission: 'block', icon: '🚫', category: 'access' },
  { id: 'mfa-enroll', activity: 'mfa-enroll', label: 'MFA Enrollment', description: 'Enroll or modify MFA settings', permission: 'alert', icon: '🔑', category: 'access' },
];

export const DEFAULT_ACTIVITY_CONTROLS: ActivityControlConfig = {
  enabled: false,
  activities: DEFAULT_ACTIVITIES,
  dlpEnabled: false,
  watermarkEnabled: false,
  clipboardIsolation: false,
  screenshotBlock: false,
};

/* ─── Category labels ──────────────────────────────────────── */
const CATEGORY_META: Record<string, { label: string; color: string }> = {
  'data-transfer': { label: 'Data Transfer', color: 'text-cyan-400' },
  content: { label: 'Content Management', color: 'text-green-400' },
  collaboration: { label: 'Collaboration', color: 'text-blue-400' },
  admin: { label: 'Administration', color: 'text-orange-400' },
  access: { label: 'Access & Authentication', color: 'text-purple-400' },
};

/* ─── Component ────────────────────────────────────────────── */
export function ActivityControlEditor({
  config,
  onChange,
  policyAction,
}: {
  config: ActivityControlConfig;
  onChange: (c: ActivityControlConfig) => void;
  policyAction: string;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'data-transfer': true,
    content: false,
    collaboration: false,
    admin: false,
    access: false,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const updatePermission = (id: string, permission: ActivityRule['permission']) => {
    onChange({
      ...config,
      activities: config.activities.map(a =>
        a.id === id ? { ...a, permission } : a
      ),
    });
  };

  const setBulkPermission = (category: string, permission: ActivityRule['permission']) => {
    onChange({
      ...config,
      activities: config.activities.map(a =>
        a.category === category ? { ...a, permission } : a
      ),
    });
  };

  const permissionColor: Record<string, string> = {
    allow: 'bg-green-600 text-white',
    block: 'bg-red-600 text-white',
    alert: 'bg-yellow-600 text-white',
    'read-only': 'bg-blue-600 text-white',
  };

  // Group activities by category
  const grouped = config.activities.reduce<Record<string, ActivityRule[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  const isDisabled = policyAction === 'deny';
  const blockedCount = config.activities.filter(a => a.permission === 'block').length;
  const alertCount = config.activities.filter(a => a.permission === 'alert').length;

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-amber-400" />
          <span className="text-sm font-medium">Activity Controls</span>
          {config.enabled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-300">
              {blockedCount} blocked · {alertCount} alerting
            </span>
          )}
        </div>
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`w-9 h-5 rounded-full transition-colors relative ${config.enabled ? 'bg-amber-600' : 'bg-gray-700'}`}
          disabled={isDisabled}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.enabled ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>

      {isDisabled && (
        <p className="text-[10px] text-gray-500 italic">Activity controls are only applicable when action is Allow or Monitor.</p>
      )}

      {config.enabled && !isDisabled && (
        <div className="space-y-3 pl-1">
          {/* Activity categories */}
          {Object.entries(grouped).map(([category, activities]) => {
            const meta = CATEGORY_META[category];
            const expanded = expandedCategories[category];
            return (
              <div key={category}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300"
                  >
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className={meta.color}>{meta.label}</span>
                  </button>
                  {/* Bulk actions */}
                  <div className="flex gap-0.5 ml-auto">
                    {(['allow', 'alert', 'block'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setBulkPermission(category, p)}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                        title={`Set all to ${p}`}
                      >
                        ALL {p.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-1.5 space-y-1">
                    {activities.map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-2 p-2 bg-gray-800/50 border border-gray-700 rounded-lg overflow-x-auto"
                      >
                        <span className="text-sm flex-shrink-0 w-6 text-center">{activity.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-200">{activity.label}</div>
                          <div className="text-[10px] text-gray-500 truncate">{activity.description}</div>
                        </div>
                        <div className="flex gap-0.5 flex-shrink-0">
                          {(['allow', 'read-only', 'alert', 'block'] as const).map(p => (
                            <button
                              key={p}
                              onClick={() => updatePermission(activity.id, p)}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                activity.permission === p
                                  ? permissionColor[p]
                                  : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              {p === 'read-only' ? 'R/O' : p.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* DLP & Advanced */}
          <div className="space-y-2 pt-3 border-t border-gray-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Data Protection
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-300">DLP Scanning</span>
                <p className="text-[10px] text-gray-500">Scan uploads/downloads for sensitive data (SSN, credit cards, PII)</p>
              </div>
              <button
                onClick={() => onChange({ ...config, dlpEnabled: !config.dlpEnabled })}
                className={`w-8 h-4 rounded-full transition-colors relative ${config.dlpEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${config.dlpEnabled ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-300">Document Watermark</span>
                <p className="text-[10px] text-gray-500">Apply visible watermark to viewed/downloaded documents</p>
              </div>
              <button
                onClick={() => onChange({ ...config, watermarkEnabled: !config.watermarkEnabled })}
                className={`w-8 h-4 rounded-full transition-colors relative ${config.watermarkEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${config.watermarkEnabled ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-300">Clipboard Isolation</span>
                <p className="text-[10px] text-gray-500">Prevent copy/paste between managed apps and local OS</p>
              </div>
              <button
                onClick={() => onChange({ ...config, clipboardIsolation: !config.clipboardIsolation })}
                className={`w-8 h-4 rounded-full transition-colors relative ${config.clipboardIsolation ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${config.clipboardIsolation ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-300">Screenshot Prevention</span>
                <p className="text-[10px] text-gray-500">Block screenshots and screen recording within managed sessions</p>
              </div>
              <button
                onClick={() => onChange({ ...config, screenshotBlock: !config.screenshotBlock })}
                className={`w-8 h-4 rounded-full transition-colors relative ${config.screenshotBlock ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${config.screenshotBlock ? 'left-4' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
