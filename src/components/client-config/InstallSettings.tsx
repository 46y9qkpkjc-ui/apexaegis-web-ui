'use client';
import React from 'react';
import { Download, ShieldAlert, Code, KeyRound } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface InstallSettings {
  verify_app_domains: boolean;
  app_integrity_verification: boolean;
  auto_update: { enabled: boolean; auto_update_channel: 'stable' | 'beta' };
  config_sync_interval_mins: number;
  revoke_on_token_deletion: boolean;
  debug_options: { enabled: boolean; log_level: string };
  otp_enforcement: { enabled: boolean };
}

interface Props {
  settings: InstallSettings;
  onChange: (settings: InstallSettings) => void;
}

export function InstallSettingsComponent({ settings, onChange }: Props) {
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
      {/* App Verification */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Download size={14} className="text-blue-400" />
          Client App Verification
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Verify App Domains</div>
              <div className="text-[10px] text-gray-500">Validate app download domains vs. authority server</div>
            </div>
            <button onClick={() => updateField('verify_app_domains', !settings.verify_app_domains)}>
              {settings.verify_app_domains ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">App Integrity Verification</div>
              <div className="text-[10px] text-gray-500">Verify digital signature and signing authority</div>
            </div>
            <button onClick={() => updateField('app_integrity_verification', !settings.app_integrity_verification)}>
              {settings.app_integrity_verification ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Auto Update */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <ShieldAlert size={14} className="text-yellow-400" />
          Auto Update Settings
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">Enable Auto Update</span>
            <button onClick={() => updateField('auto_update.enabled', !settings.auto_update.enabled)}>
              {settings.auto_update.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          {settings.auto_update.enabled && (
            <div>
              <label className="text-xs text-gray-500 block mb-2">Update Channel</label>
              <div className="flex gap-2">
                {(['stable', 'beta'] as const).map((channel) => (
                  <button
                    key={channel}
                    onClick={() => updateField('auto_update.auto_update_channel', channel)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      settings.auto_update.auto_update_channel === channel
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                        : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}
                  >
                    {channel === 'stable' ? '✓ Stable' : '🔬 Beta'}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-gray-600 mt-1">
                {settings.auto_update.auto_update_channel === 'stable'
                  ? 'Tested, production-ready releases'
                  : 'Experimental features, updated frequently'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Download size={14} className="text-cyan-400" />
          Delivery & Sync
        </h3>
        <div className="space-y-3">
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 text-xs text-gray-400">
            Desktop installers are exposed through the authenticated user portal after sign-in. Anonymous download is not part of the client delivery path.
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Cloud sync interval (minutes)</label>
            <input
              type="number"
              min="5"
              max="15"
              value={settings.config_sync_interval_mins}
              onChange={(e) => updateField('config_sync_interval_mins', Math.min(15, Math.max(5, parseInt(e.target.value, 10) || 15)))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
            />
            <p className="text-[9px] text-gray-600 mt-1">The desktop pulls fresh client and routing policy from the cloud on this cadence after authentication.</p>
          </div>
        </div>
      </div>

      {/* Security & Revocation */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <KeyRound size={14} className="text-red-400" />
          Security & Revocation
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Revoke on Token Deletion</div>
              <div className="text-[10px] text-gray-500">Disable client if user/token is revoked</div>
            </div>
            <button onClick={() => updateField('revoke_on_token_deletion', !settings.revoke_on_token_deletion)}>
              {settings.revoke_on_token_deletion ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Debug Options */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Code size={14} className="text-purple-400" />
          Debug Options
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">Enable Debug Logging</span>
            <button onClick={() => updateField('debug_options.enabled', !settings.debug_options.enabled)}>
              {settings.debug_options.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          {settings.debug_options.enabled && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Log Level</label>
              <select
                value={settings.debug_options.log_level}
                onChange={(e) => updateField('debug_options.log_level', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              >
                <option value="off">Off</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
                <option value="trace">Trace (Verbose)</option>
              </select>
              <p className="text-[9px] text-gray-600 mt-1">Higher verbosity helps troubleshooting but impacts performance</p>
            </div>
          )}
        </div>
      </div>

      {/* OTP Enforcement */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <KeyRound size={14} className="text-green-400" />
          OTP Enforcement
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Require OTP</div>
              <div className="text-[10px] text-gray-500">OTP required for client config & encryption</div>
            </div>
            <button onClick={() => updateField('otp_enforcement.enabled', !settings.otp_enforcement.enabled)}>
              {settings.otp_enforcement.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          {settings.otp_enforcement.enabled && (
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                🔐 OTP protects configuration from MITM attacks by encrypting sensitive settings with time-based codes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
