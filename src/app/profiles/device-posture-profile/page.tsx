'use client';
import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Smartphone, ToggleLeft, ToggleRight, ShieldCheck, HardDrive, RefreshCw, BadgeCheck, Save } from 'lucide-react';
import { fetchPostureProfile, savePostureProfile, type PostureProfile } from '@/lib/posture-api';

const CHECKS: { key: keyof PostureProfile; label: string; desc: string; icon: typeof ShieldCheck }[] = [
  { key: 'check_device_cert', label: 'Check device certificate', desc: 'Require a valid device certificate issued by the org CA.', icon: BadgeCheck },
  { key: 'check_av', label: 'Check AV status', desc: 'Require an active, up-to-date anti-virus / EDR agent.', icon: ShieldCheck },
  { key: 'check_disk_encryption', label: 'Check disk encryption', desc: 'Require full-disk encryption (BitLocker / FileVault / LUKS).', icon: HardDrive },
  { key: 'check_os_patch', label: 'Check OS latest patch', desc: 'Require the OS to be on the latest security patch level.', icon: RefreshCw },
];

const DEFAULTS: PostureProfile = { check_device_cert: true, check_av: true, check_disk_encryption: true, check_os_patch: false };

export default function DevicePostureProfilePage() {
  const [checks, setChecks] = useState<PostureProfile>(DEFAULTS);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPostureProfile().then(p => setChecks(p)).catch(() => { /* keep defaults */ });
  }, []);

  const toggle = (k: keyof PostureProfile) => { setChecks(c => ({ ...c, [k]: !c[k] })); setDirty(true); setStatus(''); };

  async function save() {
    setSaving(true); setStatus('');
    try {
      await savePostureProfile(checks);
      setDirty(false); setStatus('Saved');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="text-cyan-400" size={24} /> Device Posture Profile
        </h1>
        <p className="text-sm text-gray-400 mt-1">Define the posture checks a device must pass to be considered compliant.</p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold">Default Posture Profile</div>
        <div className="divide-y divide-gray-800/60">
          {CHECKS.map(({ key, label, desc, icon: Icon }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5">
              <Icon size={16} className="text-gray-500 shrink-0" />
              <div className="flex-1">
                <div className="text-sm text-gray-200">{label}</div>
                <div className="text-[12px] text-gray-500">{desc}</div>
              </div>
              <button onClick={() => toggle(key)} className="shrink-0" title={checks[key] ? 'Enabled' : 'Disabled'}>
                {checks[key]
                  ? <ToggleRight size={26} className="text-cyan-400" />
                  : <ToggleLeft size={26} className="text-gray-600" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {status && <span className={clsx('text-xs', status === 'Saved' ? 'text-green-400' : 'text-red-400')}>{status}</span>}
        {dirty && <span className="text-xs text-amber-400">Unsaved changes</span>}
        <button onClick={save} disabled={!dirty || saving}
          className={clsx('flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg',
            dirty && !saving ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed')}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
