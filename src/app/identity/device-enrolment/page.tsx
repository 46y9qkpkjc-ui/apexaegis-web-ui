'use client';
import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus, Copy, Check, Trash2, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { listEnrolSecrets, generateEnrolSecret, revokeEnrolSecret, type EnrolSecret } from '@/lib/enrol-api';
import { DeviceInventory } from '@/components/devices/device-inventory';

export default function DeviceEnrolmentPage() {
  const [secrets, setSecrets] = useState<EnrolSecret[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [fresh, setFresh] = useState<{ secret: string; ref: EnrolSecret } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSecrets(await listEnrolSecrets());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load enrolment secrets');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const created = await generateEnrolSecret('Device enrolment');
      setFresh(created);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate secret');
    } finally {
      setGenerating(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await revokeEnrolSecret(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke secret');
    }
  };

  const copy = (key: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
  };

  const orgId = fresh?.ref.org_id ?? secrets[0]?.org_id ?? '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound size={24} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold">Device Enrolment</h1>
            <p className="text-sm text-gray-500">Per-org secret that gates automatic device certificate enrolment</p>
          </div>
        </div>
        <button onClick={generate} disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Generate secret
        </button>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400">
        <div className="flex items-center gap-2 mb-2 text-gray-300"><ShieldCheck size={15} className="text-green-400" /> How enrolment works</div>
        Bake the <span className="text-gray-300">org ID + this secret</span> into your device installer (GPO/SCCM). On first boot each device
        auto-enrols — the secret is validated here, a one-time certificate token is minted, and the agent obtains its cert
        (its private key never leaves the device) and then <span className="text-gray-300">auto-renews</span> before expiry. No per-device tokens, ever.
        Revoking a secret blocks new enrolments; already-enrolled devices keep working.
      </div>

      {/* Freshly generated secret — shown once */}
      {fresh && (
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-medium mb-3">
            <AlertTriangle size={15} /> Copy this now — the secret is shown only once
          </div>
          <div className="space-y-2">
            <ConfigRow label="org_id" value={orgId} copied={copied === 'org'} onCopy={() => copy('org', orgId)} />
            <ConfigRow label="enrol_secret" value={fresh.secret} copied={copied === 'secret'} onCopy={() => copy('secret', fresh.secret)} />
          </div>
          <button onClick={() => setFresh(null)} className="mt-3 text-xs text-gray-500 hover:text-gray-300">Dismiss</button>
        </div>
      )}

      {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Secret</th>
              <th className="px-4 py-3 text-left">Label</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Last used</th>
              <th className="w-16 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500"><Loader2 size={16} className="animate-spin inline mr-2" />Loading…</td></tr>
            )}
            {!loading && secrets.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No enrolment secrets yet — generate one to enable auto-enrolment.</td></tr>
            )}
            {!loading && secrets.map((s) => (
              <tr key={s.id} className={`hover:bg-gray-800/30 transition-colors ${s.status === 'revoked' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{s.prefix}</td>
                <td className="px-4 py-3">{s.label}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs border ${s.status === 'active' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{s.last_used_at ? new Date(s.last_used_at).toLocaleString() : '—'}</td>
                <td className="px-4 py-3">
                  {s.status === 'active' && (
                    <button onClick={() => revoke(s.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Revoke"><Trash2 size={14} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enrolled devices inventory + posture view modal (posture + ghosted tabs) */}
      <DeviceInventory />
    </div>
  );
}

function ConfigRow({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2">
      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      <code className="flex-1 text-xs text-gray-200 font-mono truncate">{value || '—'}</code>
      <button onClick={onCopy} className="text-gray-500 hover:text-gray-300 shrink-0" title="Copy">
        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
}
