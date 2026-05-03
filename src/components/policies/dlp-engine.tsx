'use client';
import { useState } from 'react';
import {
  Shield, FileWarning, Eye, ToggleLeft, ToggleRight,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  FileText, CreditCard, Mail, Database, Key, Fingerprint,
} from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */
export type DlpAction = 'block' | 'alert' | 'encrypt' | 'redact' | 'log-only';

export interface DlpPattern {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof PATTERN_ICONS;
  regex: string;
  category: 'pii' | 'financial' | 'credentials' | 'health' | 'intellectual_property' | 'custom';
  enabled: boolean;
  action: DlpAction;
  severity: 'critical' | 'high' | 'medium' | 'low';
  matchCount?: number;
}

export interface DlpEngineConfig {
  enabled: boolean;
  inspectClipboard: boolean;
  inspectFileUploads: boolean;
  inspectFileDownloads: boolean;
  inspectPrintJobs: boolean;
  inspectScreenCapture: boolean;
  inspectEmailAttachments: boolean;
  inspectUsbTransfers: boolean;
  inspectBrowserPaste: boolean;
  maxFileSizeMb: number;
  patterns: DlpPattern[];
}

const PATTERN_ICONS = {
  creditCard: CreditCard,
  email: Mail,
  file: FileText,
  database: Database,
  key: Key,
  fingerprint: Fingerprint,
  shield: Shield,
  alert: AlertTriangle,
};

const ACTION_STYLES: Record<DlpAction, { bg: string; text: string; label: string }> = {
  block: { bg: 'bg-red-900/40 border-red-700', text: 'text-red-400', label: 'Block' },
  alert: { bg: 'bg-yellow-900/40 border-yellow-700', text: 'text-yellow-400', label: 'Alert' },
  encrypt: { bg: 'bg-blue-900/40 border-blue-700', text: 'text-blue-400', label: 'Encrypt' },
  redact: { bg: 'bg-purple-900/40 border-purple-700', text: 'text-purple-400', label: 'Redact' },
  'log-only': { bg: 'bg-gray-800 border-gray-700', text: 'text-gray-400', label: 'Log Only' },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

const CATEGORY_LABELS: Record<string, string> = {
  pii: 'PII',
  financial: 'Financial',
  credentials: 'Credentials',
  health: 'Health (HIPAA)',
  intellectual_property: 'IP / Trade Secrets',
  custom: 'Custom',
};

/* ─── Default Patterns ──────────────────────────────────────── */
const DEFAULT_PATTERNS: DlpPattern[] = [
  { id: 'ssn', name: 'Social Security Number', description: 'US SSN format (XXX-XX-XXXX)', icon: 'fingerprint', regex: '\\b\\d{3}-\\d{2}-\\d{4}\\b', category: 'pii', enabled: true, action: 'block', severity: 'critical', matchCount: 3 },
  { id: 'cc', name: 'Credit Card Number', description: 'Visa, MasterCard, Amex, Discover formats', icon: 'creditCard', regex: '\\b(?:4\\d{15}|5[1-5]\\d{14}|3[47]\\d{13}|6(?:011|5\\d{2})\\d{12})\\b', category: 'financial', enabled: true, action: 'block', severity: 'critical', matchCount: 7 },
  { id: 'iban', name: 'IBAN Number', description: 'International Bank Account Number', icon: 'creditCard', regex: '\\b[A-Z]{2}\\d{2}[A-Z0-9]{4,30}\\b', category: 'financial', enabled: true, action: 'alert', severity: 'high', matchCount: 1 },
  { id: 'api-key', name: 'API Key / Secret', description: 'Common API key patterns (AWS, GCP, GitHub)', icon: 'key', regex: '(?:AKIA|sk-|ghp_|gho_|AIza)[A-Za-z0-9/+=]{20,}', category: 'credentials', enabled: true, action: 'block', severity: 'critical', matchCount: 12 },
  { id: 'jwt', name: 'JSON Web Token', description: 'JWT tokens (eyJ...)', icon: 'key', regex: 'eyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}', category: 'credentials', enabled: true, action: 'alert', severity: 'high', matchCount: 5 },
  { id: 'private-key', name: 'Private Key Block', description: 'RSA/EC/DSA private key PEM blocks', icon: 'key', regex: '-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----', category: 'credentials', enabled: true, action: 'block', severity: 'critical', matchCount: 0 },
  { id: 'email-addr', name: 'Email Address (bulk)', description: 'Detects bulk email address exfiltration (>10 in clipboard/file)', icon: 'email', regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', category: 'pii', enabled: true, action: 'alert', severity: 'medium', matchCount: 24 },
  { id: 'phi', name: 'Protected Health Info', description: 'Medical record numbers, diagnosis codes (ICD-10)', icon: 'fingerprint', regex: '(?:MRN|mrn)[:\\s]*\\d{6,}|[A-TV-Z]\\d{2}\\.\\d{1,}', category: 'health', enabled: true, action: 'block', severity: 'critical', matchCount: 0 },
  { id: 'passport', name: 'Passport Number', description: 'US passport number format', icon: 'fingerprint', regex: '\\b[A-Z]\\d{8}\\b', category: 'pii', enabled: false, action: 'alert', severity: 'high', matchCount: 0 },
  { id: 'source-code', name: 'Source Code Block', description: 'Detects code snippets (function definitions, imports)', icon: 'file', regex: '(?:function |class |import |from |def |const |let |var )\\w+', category: 'intellectual_property', enabled: true, action: 'redact', severity: 'medium', matchCount: 45 },
  { id: 'db-conn', name: 'Database Connection String', description: 'PostgreSQL, MySQL, MongoDB connection URIs', icon: 'database', regex: '(?:postgres|mysql|mongodb)(?:ql)?://[^\\s]+', category: 'credentials', enabled: true, action: 'block', severity: 'critical', matchCount: 2 },
  { id: 'custom-keyword', name: 'Confidential Markers', description: 'Documents marked CONFIDENTIAL, SECRET, INTERNAL ONLY', icon: 'shield', regex: '\\b(?:CONFIDENTIAL|SECRET|INTERNAL ONLY|DO NOT DISTRIBUTE)\\b', category: 'intellectual_property', enabled: true, action: 'alert', severity: 'high', matchCount: 8 },
];

export const DEFAULT_DLP_CONFIG: DlpEngineConfig = {
  enabled: true,
  inspectClipboard: true,
  inspectFileUploads: true,
  inspectFileDownloads: true,
  inspectPrintJobs: true,
  inspectScreenCapture: false,
  inspectEmailAttachments: true,
  inspectUsbTransfers: true,
  inspectBrowserPaste: true,
  maxFileSizeMb: 50,
  patterns: DEFAULT_PATTERNS,
};

/* ─── Component ─────────────────────────────────────────────── */
interface DlpEngineEditorProps {
  config: DlpEngineConfig;
  onChange: (config: DlpEngineConfig) => void;
}

export function DlpEngineEditor({ config, onChange }: DlpEngineEditorProps) {
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [showChannels, setShowChannels] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredPatterns = config.patterns.filter(p =>
    categoryFilter === 'all' || p.category === categoryFilter
  );

  const totalMatches = config.patterns.reduce((s, p) => s + (p.matchCount ?? 0), 0);
  const criticalPatterns = config.patterns.filter(p => p.severity === 'critical' && p.enabled).length;

  function updatePattern(id: string, updates: Partial<DlpPattern>) {
    onChange({
      ...config,
      patterns: config.patterns.map(p => p.id === id ? { ...p, ...updates } : p),
    });
  }

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileWarning size={16} className="text-orange-400" />
          <span className="text-sm font-medium">Endpoint DLP Engine</span>
        </div>
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={clsx('transition-colors', config.enabled ? 'text-green-400' : 'text-gray-600')}
        >
          {config.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
        </button>
      </div>

      {!config.enabled && (
        <p className="text-xs text-gray-500">DLP engine is disabled. Enable to configure data loss prevention patterns and inspection channels.</p>
      )}

      {config.enabled && (
        <>
          {/* Stats bar */}
          <div className="flex gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-gray-800 text-xs">
              <span className="text-gray-500">Patterns:</span>{' '}
              <span className="text-gray-300 font-medium">{config.patterns.filter(p => p.enabled).length}/{config.patterns.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-red-900/20 text-xs">
              <span className="text-gray-500">Critical:</span>{' '}
              <span className="text-red-400 font-medium">{criticalPatterns}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-orange-900/20 text-xs">
              <span className="text-gray-500">Matches (24h):</span>{' '}
              <span className="text-orange-400 font-medium">{totalMatches}</span>
            </div>
          </div>

          {/* Inspection channels */}
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowChannels(c => !c)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-400">Inspection Channels</span>
              {showChannels ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
            </button>
            {showChannels && (
              <div className="p-3 space-y-2 border-t border-gray-800">
                {([
                  { key: 'inspectClipboard', label: 'Clipboard / Copy-Paste' },
                  { key: 'inspectFileUploads', label: 'File Uploads' },
                  { key: 'inspectFileDownloads', label: 'File Downloads' },
                  { key: 'inspectPrintJobs', label: 'Print Jobs' },
                  { key: 'inspectScreenCapture', label: 'Screen Capture' },
                  { key: 'inspectEmailAttachments', label: 'Email Attachments' },
                  { key: 'inspectUsbTransfers', label: 'USB / Removable Media' },
                  { key: 'inspectBrowserPaste', label: 'Browser Paste Detection' },
                ] as const).map(ch => (
                  <label key={ch.key} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs text-gray-400 group-hover:text-gray-300">{ch.label}</span>
                    <button
                      onClick={() => onChange({ ...config, [ch.key]: !config[ch.key] })}
                      className={clsx('transition-colors', config[ch.key] ? 'text-green-400' : 'text-gray-600')}
                    >
                      {config[ch.key] ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </label>
                ))}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                  <span className="text-xs text-gray-500">Max file scan size:</span>
                  <input
                    type="number"
                    value={config.maxFileSizeMb}
                    onChange={e => onChange({ ...config, maxFileSizeMb: parseInt(e.target.value) || 50 })}
                    className="w-16 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-center focus:outline-none"
                    min={1}
                    max={500}
                  />
                  <span className="text-xs text-gray-500">MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Filter:</span>
            {['all', 'pii', 'financial', 'credentials', 'health', 'intellectual_property'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={clsx(
                  'px-2 py-0.5 rounded text-[10px] font-medium transition-colors border',
                  categoryFilter === cat
                    ? 'bg-blue-900/40 border-blue-700 text-blue-300'
                    : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                )}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Patterns list */}
          <div className="space-y-1.5">
            {filteredPatterns.map(pattern => {
              const Icon = PATTERN_ICONS[pattern.icon];
              const expanded = expandedPattern === pattern.id;
              const actionStyle = ACTION_STYLES[pattern.action];

              return (
                <div
                  key={pattern.id}
                  className={clsx(
                    'border rounded-lg transition-colors',
                    pattern.enabled ? 'border-gray-800' : 'border-gray-800/50 opacity-50',
                    expanded && 'border-gray-700 bg-gray-800/20'
                  )}
                >
                  {/* Pattern row */}
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      onClick={() => updatePattern(pattern.id, { enabled: !pattern.enabled })}
                      className={clsx('shrink-0 transition-colors', pattern.enabled ? 'text-green-400' : 'text-gray-600')}
                    >
                      {pattern.enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_STYLES[pattern.severity]}`} />
                    <Icon size={14} className="text-gray-400 shrink-0" />
                    <span className="text-xs font-medium text-gray-300 truncate flex-1">{pattern.name}</span>
                    {(pattern.matchCount ?? 0) > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-900/30 text-orange-400 text-[10px] font-mono shrink-0">
                        {pattern.matchCount}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${actionStyle.bg} ${actionStyle.text}`}>
                      {actionStyle.label}
                    </span>
                    <button
                      onClick={() => setExpandedPattern(expanded ? null : pattern.id)}
                      className="p-0.5 hover:bg-gray-700 rounded text-gray-500"
                    >
                      {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {expanded && (
                    <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-800">
                      <p className="text-xs text-gray-500">{pattern.description}</p>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Regex Pattern</span>
                        <code className="block mt-1 px-2 py-1 bg-gray-800 rounded text-[11px] text-green-300 font-mono break-all">
                          {pattern.regex}
                        </code>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Action on Match</span>
                        <div className="flex gap-1">
                          {(['block', 'alert', 'encrypt', 'redact', 'log-only'] as DlpAction[]).map(a => {
                            const s = ACTION_STYLES[a];
                            return (
                              <button
                                key={a}
                                onClick={() => updatePattern(pattern.id, { action: a })}
                                className={clsx(
                                  'px-2 py-1 rounded text-[10px] font-medium border transition-colors',
                                  pattern.action === a ? `${s.bg} ${s.text}` : 'bg-gray-800 border-gray-700 text-gray-500'
                                )}
                              >
                                {s.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">Severity</span>
                        <div className="flex gap-1">
                          {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
                            <button
                              key={sev}
                              onClick={() => updatePattern(pattern.id, { severity: sev })}
                              className={clsx(
                                'px-2 py-1 rounded text-[10px] font-medium border transition-colors',
                                pattern.severity === sev
                                  ? 'bg-gray-700 border-gray-600 text-white'
                                  : 'bg-gray-800 border-gray-700 text-gray-500'
                              )}
                            >
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${SEVERITY_STYLES[sev]}`} />
                              {sev.charAt(0).toUpperCase() + sev.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
