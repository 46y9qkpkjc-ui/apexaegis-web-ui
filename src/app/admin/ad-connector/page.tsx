'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Server, Save, Users, Network, Clock, CheckCircle, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import {
  getConnectorConfig,
  saveConnectorConfig,
  AD_CONNECTOR_ID,
  type AdConnectorConfig,
  type AdConnectorConfigInput,
} from '@/lib/ad-connector-api';

const EMPTY: AdConnectorConfigInput = {
  domain: '',
  dc_addr: '',
  base_dn: '',
  bind_dn: '',
  user_filter: '',
  group_filter: '',
  sync_interval: '15m',
  tls_insecure: false,
};

const inputClass =
  'w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono focus:outline-none focus:border-blue-500/50';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

export default function AdConnectorPage() {
  const [form, setForm] = useState<AdConnectorConfigInput>(EMPTY);
  const [status, setStatus] = useState<AdConnectorConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cfg = await getConnectorConfig();
      setStatus(cfg);
      setForm({
        domain: cfg.domain,
        dc_addr: cfg.dc_addr,
        base_dn: cfg.base_dn,
        bind_dn: cfg.bind_dn,
        user_filter: cfg.user_filter,
        group_filter: cfg.group_filter,
        sync_interval: cfg.sync_interval || '15m',
        tls_insecure: cfg.tls_insecure,
      });
      setMessage(null);
    } catch (err) {
      // 404 (unconfigured) is expected on first run — show it as info, keep the empty form.
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = <K extends keyof AdConnectorConfigInput>(k: K, v: AdConnectorConfigInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveConnectorConfig(form);
      setStatus(saved);
      setMessage({ type: 'success', text: 'Configuration saved. The connector picks it up on its next sync cycle.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Server size={22} className="text-blue-400" /> AD Connector
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            LDAP directory-sync configuration for <span className="font-mono text-gray-400">{AD_CONNECTOR_ID}</span>.
            The connector pulls this config and pushes users &amp; groups to the management plane.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Sync status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/ad-connector/users"
          className="group bg-gray-900 border border-gray-800 hover:border-blue-700 rounded-xl p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2"><Users size={16} /> Users</span>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-400" />
          </div>
          <div className="text-3xl font-semibold mt-2">{status?.user_count ?? '—'}</div>
        </Link>
        <Link
          href="/admin/ad-connector/groups"
          className="group bg-gray-900 border border-gray-800 hover:border-blue-700 rounded-xl p-5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2"><Network size={16} /> Groups</span>
            <ChevronRight size={16} className="text-gray-600 group-hover:text-blue-400" />
          </div>
          <div className="text-3xl font-semibold mt-2">{status?.group_count ?? '—'}</div>
        </Link>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <span className="text-sm text-gray-400 flex items-center gap-2"><Clock size={16} /> Last sync</span>
          <div className="text-sm mt-3 text-gray-300">
            {status?.last_synced_at ? new Date(status.last_synced_at).toLocaleString() : 'never'}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-900/30 border border-green-800 text-green-300'
              : 'bg-red-900/30 border border-red-800 text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Config form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">LDAP Configuration</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="AD domain" hint="e.g. ad.example.com">
                <input className={inputClass} value={form.domain} onChange={(e) => set('domain', e.target.value)} placeholder="ad.example.com" />
              </Field>
              <Field label="Domain controller (host:port)" hint="Must be the DC FQDN, never an IP — Kerberos SPN/KDC/TLS name derive from it. LDAPS is 636.">
                <input className={inputClass} value={form.dc_addr} onChange={(e) => set('dc_addr', e.target.value)} placeholder="DC01.ad.example.com:636" />
              </Field>
              <Field label="Base DN" hint="Search base. Leave blank to derive from the domain.">
                <input className={inputClass} value={form.base_dn} onChange={(e) => set('base_dn', e.target.value)} placeholder="DC=ad,DC=example,DC=com" />
              </Field>
              <Field label="Bind account (sAMAccountName)" hint="Keytab bind — this is the service account principal (no password stored here).">
                <input className={inputClass} value={form.bind_dn} onChange={(e) => set('bind_dn', e.target.value)} placeholder="svc-apex-connector" />
              </Field>
              <Field label="User filter" hint="Leave blank for the default (all person users).">
                <input className={inputClass} value={form.user_filter} onChange={(e) => set('user_filter', e.target.value)} placeholder="(&(objectClass=user)(objectCategory=person))" />
              </Field>
              <Field label="Group filter" hint="Leave blank for the default (all groups).">
                <input className={inputClass} value={form.group_filter} onChange={(e) => set('group_filter', e.target.value)} placeholder="(objectClass=group)" />
              </Field>
              <Field label="Sync interval" hint="Go duration, e.g. 15m, 1h.">
                <input className={inputClass} value={form.sync_interval} onChange={(e) => set('sync_interval', e.target.value)} placeholder="15m" />
              </Field>
            </div>

            <label className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                checked={form.tls_insecure}
                onChange={(e) => set('tls_insecure', e.target.checked)}
                className="h-4 w-4 rounded border-gray-600 bg-gray-800"
              />
              <span className="text-sm text-gray-300">
                Skip DC LDAPS certificate verification
                <span className="text-gray-600"> — lab only; enable when the DC cert isn&apos;t in a trusted chain.</span>
              </span>
            </label>

            <div className="flex justify-end pt-2 border-t border-gray-800">
              <button
                onClick={() => void onSave()}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Save size={16} /> {saving ? 'Saving...' : 'Save configuration'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
