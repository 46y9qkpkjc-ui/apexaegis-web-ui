'use client';
import React, { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Smartphone, ToggleLeft, ToggleRight, ShieldCheck, HardDrive, RefreshCw, BadgeCheck, Save } from 'lucide-react';

interface PostureChecks {
  device_cert: boolean;
  av_status: boolean;
  disk_encryption: boolean;
  os_latest_patch: boolean;
}

const CHECKS: { key: keyof PostureChecks; label: string; desc: string; icon: typeof ShieldCheck }[] = [
  { key: 'device_cert', label: 'Check device certificate', desc: 'Require a valid device certificate issued by the org CA.', icon: BadgeCheck },
  { key: 'av_status', label: 'Check AV status', desc: 'Require an active, up-to-date anti-virus / EDR agent.', icon: ShieldCheck },
  { key: 'disk_encryption', label: 'Check disk encryption', desc: 'Require full-disk encryption (BitLocker / FileVault / LUKS).', icon: HardDrive },
  { key: 'os_latest_patch', label: 'Check OS latest patch', desc: 'Require the OS to be on the latest security patch level.', icon: RefreshCw },
];

const KEY = 'apexaegis_posture_profile_default';
const DEFAULTS: PostureChecks = { device_cert: true, av_status: true, disk_encryption: true, os_latest_patch: false };

export default function DevicePostureProfilePage() {
  const [checks, setChecks] = useState<PostureChecks>(DEFAULTS);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setChecks({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const toggle = (k: keyof PostureChecks) => { setChecks(c => ({ ...c, [k]: !c[k] })); setDirty(true); setSaved(false); };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(checks)); } catch { /* ignore */ } setDirty(false); setSaved(true); };

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
        {saved && <span className="text-xs text-green-400">Saved</span>}
        {dirty && <span className="text-xs text-amber-400">Unsaved changes</span>}
        <button onClick={save} disabled={!dirty}
          className={clsx('flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg',
            dirty ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-gray-800 text-gray-500 cursor-not-allowed')}>
          <Save size={15} /> Save Profile
        </button>
      </div>
    </div>
  );
}
