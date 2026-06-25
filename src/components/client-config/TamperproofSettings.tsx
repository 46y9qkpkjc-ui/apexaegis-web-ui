'use client';
import React from 'react';
import { Shield, Lock, AlertTriangle, Zap } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface TamperproofSettings {
  fail_close_mode: 'all_traffic' | 'internet_only' | 'private_only';
  protect_all_internet_private: { enabled: boolean; password_protected: boolean };
  protect_internet_only: { enabled: boolean; password_protected: boolean };
  protect_private_only: { enabled: boolean; password_protected: boolean };
  fail_close_exceptions: { enabled: boolean; process_names: string[]; fqdns: string[] };
  uninstall_protection: { enabled: boolean; password_required: boolean };
  cert_pinning: { enabled: boolean };
}

interface Props {
  settings: TamperproofSettings;
  onChange: (settings: TamperproofSettings) => void;
}

function parseLineEntries(value: string): string[] {
  return Array.from(new Set(value.split(/[\r\n,;]+/).map((entry) => entry.trim()).filter(Boolean)));
}

export function TamperproofSettingsComponent({ settings, onChange }: Props) {
  const [processDraft, setProcessDraft] = React.useState(
    () => settings.fail_close_exceptions.process_names.join('\n')
  );
  const [fqdnDraft, setFqdnDraft] = React.useState(
    () => settings.fail_close_exceptions.fqdns.join('\n')
  );

  const updateField = (path: string, value: any) => {
    const parts = path.split('.');
    const updated = JSON.parse(JSON.stringify(settings));
    let current: any = updated;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Fail Close Mode Selection */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <AlertTriangle size={14} className="text-red-400" />
          Fail Close Mode
        </h3>
        <div className="space-y-3">
          <p className="text-xs text-gray-500 mb-3">Select which traffic is blocked when gateway is unavailable:</p>
          {(['all_traffic', 'internet_only', 'private_only'] as const).map((mode) => (
            <label key={mode} className="flex items-center gap-3 p-3 bg-gray-800/30 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors">
              <input
                type="radio"
                name="fail_close"
                value={mode}
                checked={settings.fail_close_mode === mode}
                onChange={() => updateField('fail_close_mode', mode)}
                className="w-4 h-4 accent-blue-500"
              />
              <div>
                <div className="text-sm text-gray-300">
                  {mode === 'all_traffic' && '🚫 Block All Traffic'}
                  {mode === 'internet_only' && '🌐 Block Internet Only'}
                  {mode === 'private_only' && '🔒 Block Private Only'}
                </div>
                <div className="text-[10px] text-gray-500">
                  {mode === 'all_traffic' && 'Block both internet and private access if gateway fails'}
                  {mode === 'internet_only' && 'Block internet only; private access always available'}
                  {mode === 'private_only' && 'Block private only; internet access always available'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Protection Modes (Dynamic based on Fail Close Mode) */}
      {settings.fail_close_mode === 'all_traffic' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
            <Lock size={14} className="text-orange-400" />
            Protect All Internet & Private Access
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">Enable Protection</span>
              <button onClick={() => updateField('protect_all_internet_private.enabled', !settings.protect_all_internet_private.enabled)}>
                {settings.protect_all_internet_private.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
              </button>
            </div>
            {settings.protect_all_internet_private.enabled && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-300">Password Protected</span>
                <button onClick={() => updateField('protect_all_internet_private.password_protected', !settings.protect_all_internet_private.password_protected)}>
                  {settings.protect_all_internet_private.password_protected ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {settings.fail_close_mode === 'internet_only' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
            <Zap size={14} className="text-yellow-400" />
            Protect Internet Access Only
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">Enable Protection</span>
              <button onClick={() => updateField('protect_internet_only.enabled', !settings.protect_internet_only.enabled)}>
                {settings.protect_internet_only.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
              </button>
            </div>
            {settings.protect_internet_only.enabled && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-300">Password Protected</span>
                <button onClick={() => updateField('protect_internet_only.password_protected', !settings.protect_internet_only.password_protected)}>
                  {settings.protect_internet_only.password_protected ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {settings.fail_close_mode === 'private_only' && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
            <Shield size={14} className="text-purple-400" />
            Protect Private Access Only
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">Enable Protection</span>
              <button onClick={() => updateField('protect_private_only.enabled', !settings.protect_private_only.enabled)}>
                {settings.protect_private_only.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
              </button>
            </div>
            {settings.protect_private_only.enabled && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-300">Password Protected</span>
                <button onClick={() => updateField('protect_private_only.password_protected', !settings.protect_private_only.password_protected)}>
                  {settings.protect_private_only.password_protected ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fail Close Exceptions */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <AlertTriangle size={14} className="text-blue-400" />
          Fail Close Exceptions
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Enable Exceptions</div>
              <div className="text-[10px] text-gray-500">Allow specific resources even in fail-close mode</div>
            </div>
            <button onClick={() => updateField('fail_close_exceptions.enabled', !settings.fail_close_exceptions.enabled)}>
              {settings.fail_close_exceptions.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          {settings.fail_close_exceptions.enabled && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Process names — one per line, comma, or semicolon</label>
              <textarea
                rows={5}
                value={processDraft}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setProcessDraft(nextValue);
                  updateField('fail_close_exceptions.process_names', parseLineEntries(nextValue));
                }}
                placeholder={'msedge.exe\nTeamViewer.exe'}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">FQDNs — one per line, comma, or semicolon</label>
              <textarea
                rows={5}
                value={fqdnDraft}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setFqdnDraft(nextValue);
                  updateField('fail_close_exceptions.fqdns', parseLineEntries(nextValue));
                }}
                placeholder={'login.okta.com\ndevice-api.apexaegis.app'}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-mono"
              />
            </div>
          </div>}
        </div>
      </div>

      {/* Uninstall Protection */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Lock size={14} className="text-red-400" />
          Uninstall Protection
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">Prevent Uninstall</span>
            <button onClick={() => updateField('uninstall_protection.enabled', !settings.uninstall_protection.enabled)}>
              {settings.uninstall_protection.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          {settings.uninstall_protection.enabled && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300">Require Password</span>
              <button onClick={() => updateField('uninstall_protection.password_required', !settings.uninstall_protection.password_required)}>
                {settings.uninstall_protection.password_required ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Pinning */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Shield size={14} className="text-green-400" />
          Certificate Pinning
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Enable Cert Pinning</div>
              <div className="text-[10px] text-gray-500">Pin certificates for critical applications (prevents MITM)</div>
            </div>
            <button onClick={() => updateField('cert_pinning.enabled', !settings.cert_pinning.enabled)}>
              {settings.cert_pinning.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
        <p className="text-xs text-amber-300">
          ⚠️ <strong>Tamper-Proof Settings</strong> protect your client from unauthorized bypass attempts. Password protection requires admin verification to override fail-close rules.
        </p>
      </div>
    </div>
  );
}
