'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import {
  Lock, ShieldAlert, ShieldCheck, AlertTriangle, Ban,
  Clock, Fingerprint, Server, Link2, FileWarning,
  ChevronDown, ChevronRight, Info,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
export type CertAction = 'block' | 'allow-warn' | 'allow' | 'log-only';

export interface CertVerificationConfig {
  expiredCert: CertAction;
  wrongHostSni: CertAction;
  selfSigned: CertAction;
  untrustedRoot: CertAction;
  revokedCert: CertAction;
  pinningTest: boolean;
  pinningAction: CertAction;
  checkOcsp: boolean;
  checkCrl: boolean;
  ocspStapling: boolean;
  ocspFailOpen: boolean;
  maxChainDepth: number;
  allowSha1: boolean;
  minKeySize: number;
  tlsMinVersion: '1.0' | '1.1' | '1.2' | '1.3';
  tlsMaxVersion: '1.2' | '1.3';
  allowedCipherSuites: string[];
  cnWildcardMatch: boolean;
  sanValidation: boolean;
  ctLogVerification: boolean;
}

export const DEFAULT_CERT_VERIFICATION: CertVerificationConfig = {
  expiredCert: 'block',
  wrongHostSni: 'block',
  selfSigned: 'block',
  untrustedRoot: 'block',
  revokedCert: 'block',
  pinningTest: true,
  pinningAction: 'allow-warn',
  checkOcsp: true,
  checkCrl: true,
  ocspStapling: true,
  ocspFailOpen: false,
  maxChainDepth: 10,
  allowSha1: false,
  minKeySize: 2048,
  tlsMinVersion: '1.2',
  tlsMaxVersion: '1.3',
  allowedCipherSuites: [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
  ],
  cnWildcardMatch: true,
  sanValidation: true,
  ctLogVerification: false,
};

const ALL_CIPHER_SUITES = [
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-CHACHA20-POLY1305',
  'DHE-RSA-AES128-GCM-SHA256',
  'DHE-RSA-AES256-GCM-SHA384',
];

const actionBadge: Record<CertAction, { label: string; color: string; icon: React.ElementType }> = {
  block: { label: 'Block', color: 'bg-red-900/40 text-red-400 border-red-800', icon: Ban },
  'allow-warn': { label: 'Allow + Warn', color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800', icon: AlertTriangle },
  allow: { label: 'Allow', color: 'bg-green-900/40 text-green-400 border-green-800', icon: ShieldCheck },
  'log-only': { label: 'Log Only', color: 'bg-blue-900/40 text-blue-400 border-blue-800', icon: Info },
};

/* ─── Action Selector ───────────────────────────────────────── */
function ActionSelector({ value, onChange, compact }: {
  value: CertAction;
  onChange: (v: CertAction) => void;
  compact?: boolean;
}) {
  const actions: CertAction[] = ['block', 'allow-warn', 'allow', 'log-only'];
  return (
    <div className="flex gap-1">
      {actions.map(a => {
        const badge = actionBadge[a];
        const Icon = badge.icon;
        return (
          <button
            key={a}
            onClick={() => onChange(a)}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-all',
              value === a
                ? badge.color + ' ring-1 ring-current/20'
                : 'border-gray-700 bg-gray-800/50 text-gray-500 hover:text-gray-300 hover:bg-gray-800',
            )}
          >
            <Icon size={10} />
            {!compact && badge.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Certificate Verification Editor ───────────────────────── */
interface CertVerificationEditorProps {
  config: CertVerificationConfig;
  onChange: (config: CertVerificationConfig) => void;
}

export function CertVerificationEditor({ config, onChange }: CertVerificationEditorProps) {
  const [expandRevocation, setExpandRevocation] = useState(false);
  const [expandCiphers, setExpandCiphers] = useState(false);
  const [expandAdvanced, setExpandAdvanced] = useState(false);

  const update = <K extends keyof CertVerificationConfig>(key: K, value: CertVerificationConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const verificationChecks: { key: keyof CertVerificationConfig; label: string; description: string; icon: React.ElementType; iconColor: string }[] = [
    {
      key: 'expiredCert',
      label: 'Expired Certificate',
      description: 'Certificate has passed its notAfter date',
      icon: Clock,
      iconColor: 'text-red-400',
    },
    {
      key: 'wrongHostSni',
      label: 'Wrong Host / SNI Mismatch',
      description: 'Certificate CN/SAN does not match the requested hostname or SNI',
      icon: Server,
      iconColor: 'text-orange-400',
    },
    {
      key: 'selfSigned',
      label: 'Self-Signed Certificate',
      description: 'Certificate is self-signed and not in the trusted CA store',
      icon: FileWarning,
      iconColor: 'text-yellow-400',
    },
    {
      key: 'untrustedRoot',
      label: 'Untrusted Root CA',
      description: 'Root CA is not in the system or organization trust store',
      icon: ShieldAlert,
      iconColor: 'text-red-400',
    },
    {
      key: 'revokedCert',
      label: 'Revoked Certificate',
      description: 'Certificate has been revoked via CRL or OCSP',
      icon: Ban,
      iconColor: 'text-red-500',
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Certificate Verification Actions ──────────────── */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Lock size={12} className="text-yellow-400" />
          Certificate Verification Actions
        </h4>
        <div className="space-y-3">
          {verificationChecks.map(check => {
            const Icon = check.icon;
            return (
              <div key={check.key} className="bg-gray-800/30 rounded-lg p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <Icon size={16} className={clsx(check.iconColor, 'mt-0.5 flex-shrink-0')} />
                    <div>
                      <div className="text-sm font-medium">{check.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{check.description}</div>
                    </div>
                  </div>
                  <ActionSelector
                    value={config[check.key] as CertAction}
                    onChange={v => update(check.key, v)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Certificate Pinning ───────────────────────────── */}
      <div className="bg-gray-800/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Fingerprint size={16} className="text-teal-400" />
            <div>
              <div className="text-sm font-medium">Certificate Pinning Test</div>
              <div className="text-xs text-gray-500">
                Validate pinned certificates (HPKP/custom pins) against known fingerprints
              </div>
            </div>
          </div>
          <button
            onClick={() => update('pinningTest', !config.pinningTest)}
            className={clsx(
              'w-10 h-5 rounded-full transition-colors relative',
              config.pinningTest ? 'bg-teal-600' : 'bg-gray-700',
            )}
          >
            <span className={clsx(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
              config.pinningTest ? 'left-5' : 'left-0.5',
            )} />
          </button>
        </div>
        {config.pinningTest && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
            <span className="text-xs text-gray-400">Action when pin validation fails</span>
            <ActionSelector value={config.pinningAction} onChange={v => update('pinningAction', v)} compact />
          </div>
        )}
      </div>

      {/* ── TLS Version ───────────────────────────────────── */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Lock size={12} className="text-blue-400" />
          TLS Version Control
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Minimum TLS Version</label>
            <div className="flex gap-1">
              {(['1.0', '1.1', '1.2', '1.3'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => update('tlsMinVersion', v)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-xs font-mono font-medium border transition-all',
                    config.tlsMinVersion === v
                      ? v === '1.0' || v === '1.1'
                        ? 'bg-red-900/30 border-red-800 text-red-400 ring-1 ring-red-500/30'
                        : 'bg-blue-900/30 border-blue-800 text-blue-400 ring-1 ring-blue-500/30'
                      : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300',
                  )}
                >
                  TLS {v}
                  {(v === '1.0' || v === '1.1') && config.tlsMinVersion === v && (
                    <div className="text-[9px] text-red-400 mt-0.5">Deprecated</div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Maximum TLS Version</label>
            <div className="flex gap-1">
              {(['1.2', '1.3'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => update('tlsMaxVersion', v)}
                  className={clsx(
                    'flex-1 py-2 rounded-lg text-xs font-mono font-medium border transition-all',
                    config.tlsMaxVersion === v
                      ? 'bg-green-900/30 border-green-800 text-green-400 ring-1 ring-green-500/30'
                      : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:text-gray-300',
                  )}
                >
                  TLS {v}
                </button>
              ))}
            </div>
          </div>
        </div>
        {(config.tlsMinVersion === '1.0' || config.tlsMinVersion === '1.1') && (
          <div className="mt-2 flex items-start gap-2 p-2 bg-red-900/10 border border-red-800/30 rounded-lg">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-red-400/80">
              TLS {config.tlsMinVersion} is deprecated and vulnerable to known attacks (POODLE, BEAST).
              Recommended minimum is TLS 1.2.
            </span>
          </div>
        )}
      </div>

      {/* ── Revocation Checking ───────────────────────────── */}
      <div>
        <button
          onClick={() => setExpandRevocation(!expandRevocation)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors w-full"
        >
          {expandRevocation ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Ban size={12} className="text-red-400" />
          Revocation Checking
        </button>
        {expandRevocation && (
          <div className="mt-3 space-y-3">
            {([
              { key: 'checkOcsp' as const, label: 'OCSP Check', desc: 'Query Online Certificate Status Protocol responders' },
              { key: 'checkCrl' as const, label: 'CRL Check', desc: 'Download and check Certificate Revocation Lists' },
              { key: 'ocspStapling' as const, label: 'OCSP Stapling', desc: 'Prefer stapled OCSP responses from the server' },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div>
                  <div className="text-sm">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
                <button
                  onClick={() => update(item.key, !config[item.key])}
                  className={clsx(
                    'w-10 h-5 rounded-full transition-colors relative',
                    config[item.key] ? 'bg-green-600' : 'bg-gray-700',
                  )}
                >
                  <span className={clsx(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                    config[item.key] ? 'left-5' : 'left-0.5',
                  )} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-sm">OCSP Fail-Open</div>
                <div className="text-xs text-gray-500">Allow connection if OCSP responder is unreachable</div>
              </div>
              <button
                onClick={() => update('ocspFailOpen', !config.ocspFailOpen)}
                className={clsx(
                  'w-10 h-5 rounded-full transition-colors relative',
                  config.ocspFailOpen ? 'bg-yellow-600' : 'bg-gray-700',
                )}
              >
                <span className={clsx(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                  config.ocspFailOpen ? 'left-5' : 'left-0.5',
                )} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Cipher Suites ─────────────────────────────────── */}
      <div>
        <button
          onClick={() => setExpandCiphers(!expandCiphers)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors w-full"
        >
          {expandCiphers ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Link2 size={12} className="text-purple-400" />
          Cipher Suites ({config.allowedCipherSuites.length}/{ALL_CIPHER_SUITES.length})
        </button>
        {expandCiphers && (
          <div className="mt-3 space-y-1.5">
            {ALL_CIPHER_SUITES.map(suite => {
              const enabled = config.allowedCipherSuites.includes(suite);
              const isTls13 = suite.startsWith('TLS_');
              return (
                <button
                  key={suite}
                  onClick={() => {
                    const updated = enabled
                      ? config.allowedCipherSuites.filter(s => s !== suite)
                      : [...config.allowedCipherSuites, suite];
                    update('allowedCipherSuites', updated);
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all text-left',
                    enabled
                      ? 'bg-green-900/15 border-green-800/40 text-green-300'
                      : 'bg-gray-800/30 border-gray-700/50 text-gray-500 hover:text-gray-300',
                  )}
                >
                  <span>{suite}</span>
                  <div className="flex items-center gap-2">
                    {isTls13 && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400 text-[9px] font-sans font-medium">
                        TLS 1.3
                      </span>
                    )}
                    <div className={clsx(
                      'w-4 h-4 rounded border-2 flex items-center justify-center',
                      enabled ? 'bg-green-600 border-green-600' : 'border-gray-600',
                    )}>
                      {enabled && <span className="text-white text-[10px]">✓</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Advanced Options ──────────────────────────────── */}
      <div>
        <button
          onClick={() => setExpandAdvanced(!expandAdvanced)}
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors w-full"
        >
          {expandAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <ShieldCheck size={12} className="text-emerald-400" />
          Advanced Validation
        </button>
        {expandAdvanced && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Certificate Chain Depth</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={config.maxChainDepth}
                  onChange={e => update('maxChainDepth', parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minimum Key Size (bits)</label>
                <select
                  value={config.minKeySize}
                  onChange={e => update('minKeySize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50"
                >
                  <option value={1024}>1024 (weak)</option>
                  <option value={2048}>2048 (recommended)</option>
                  <option value={4096}>4096 (strong)</option>
                </select>
              </div>
            </div>
            {([
              { key: 'allowSha1' as const, label: 'Allow SHA-1 Certificates', desc: 'SHA-1 is deprecated and collision-prone', warn: true },
              { key: 'cnWildcardMatch' as const, label: 'CN Wildcard Matching', desc: 'Allow wildcard certificates (*.example.com)' },
              { key: 'sanValidation' as const, label: 'SAN Validation', desc: 'Validate Subject Alternative Name extensions' },
              { key: 'ctLogVerification' as const, label: 'Certificate Transparency', desc: 'Verify certificate is logged in CT logs (RFC 6962)' },
            ]).map(item => (
              <div key={item.key} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div>
                  <div className="text-sm flex items-center gap-2">
                    {item.label}
                    {'warn' in item && item.warn && config[item.key] && (
                      <AlertTriangle size={12} className="text-yellow-400" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
                <button
                  onClick={() => update(item.key, !config[item.key])}
                  className={clsx(
                    'w-10 h-5 rounded-full transition-colors relative',
                    config[item.key] ? (('warn' in item && item.warn) ? 'bg-yellow-600' : 'bg-green-600') : 'bg-gray-700',
                  )}
                >
                  <span className={clsx(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                    config[item.key] ? 'left-5' : 'left-0.5',
                  )} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
