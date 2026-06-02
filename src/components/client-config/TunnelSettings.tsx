'use client';
import React from 'react';
import { Wifi, Shield, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';
import { TunnelSettings } from '@/app/admin/client-config/page';

interface TunnelSettingsProps {
  settings: TunnelSettings;
  onChange: (settings: TunnelSettings) => void;
}

export function TunnelSettingsComponent({ settings, onChange }: TunnelSettingsProps) {
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
      {/* Protocol Selection */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Wifi size={14} className="text-blue-400" />
          Tunnel Protocol
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['quic', 'dtls', 'both'] as const).map((proto) => (
              <button
                key={proto}
                onClick={() => updateField('protocol', proto)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  settings.protocol === proto
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                    : 'bg-gray-800 text-gray-500 border-gray-700 hover:text-gray-300'
                }`}
              >
                {proto === 'quic' && '⚡ QUIC'}
                {proto === 'dtls' && '🔐 DTLS'}
                {proto === 'both' && '🔀 Both'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {settings.protocol === 'quic' && 'UDP-based QUIC tunnel for low-latency connections'}
            {settings.protocol === 'dtls' && 'DTLS (Datagram TLS) for secure UDP connections'}
            {settings.protocol === 'both' && 'Auto-select QUIC or DTLS based on network conditions'}
          </p>
        </div>
      </div>

      {/* Device Posture */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Shield size={14} className="text-green-400" />
          Device Posture Classification
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Periodic Posture Check</div>
              <div className="text-[10px] text-gray-500">Verify device compliance before access</div>
            </div>
            <button onClick={() => updateField('device_posture_enabled', !settings.device_posture_enabled)}>
              {settings.device_posture_enabled ? (
                <ToggleRight size={28} className="text-green-400" />
              ) : (
                <ToggleLeft size={28} className="text-gray-600" />
              )}
            </button>
          </div>

          {settings.device_posture_enabled && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Check Interval (minutes)</label>
              <input
                type="number"
                value={settings.posture_check_interval_mins}
                onChange={(e) =>
                  updateField('posture_check_interval_mins', parseInt(e.target.value) || 0)
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Gateway Selection */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Eye size={14} className="text-purple-400" />
          Gateway & SNI Settings
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Allow User Gateway Selection</div>
              <div className="text-[10px] text-gray-500">Let users choose preferred gateway/zone</div>
            </div>
            <button onClick={() => updateField('allow_user_gateway_select', !settings.allow_user_gateway_select)}>
              {settings.allow_user_gateway_select ? (
                <ToggleRight size={28} className="text-green-400" />
              ) : (
                <ToggleLeft size={28} className="text-gray-600" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Perform SNI Check</div>
              <div className="text-[10px] text-gray-500">Validate Server Name Indication in TLS</div>
            </div>
            <button onClick={() => updateField('perform_sni_check', !settings.perform_sni_check)}>
              {settings.perform_sni_check ? (
                <ToggleRight size={28} className="text-green-400" />
              ) : (
                <ToggleLeft size={28} className="text-gray-600" />
              )}
            </button>
          </div>

          {settings.perform_sni_check && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">SNI Validation Mode</label>
              <div className="flex gap-2">
                {(['strict', 'loose'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateField('sni_cert_validation', mode)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      settings.sni_cert_validation === mode
                        ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                        : 'bg-gray-800 text-gray-500 border-gray-700'
                    }`}
                  >
                    {mode === 'strict' ? '🔐 Strict' : '⚙️ Loose'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Logging */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <CheckCircle size={14} className="text-orange-400" />
          Audit Logging
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              checked={settings.audit_logs.disable_with_password}
              onChange={(e) => updateField('audit_logs.disable_with_password', e.target.checked)}
              className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"
            />
            <span className="text-sm text-gray-300">Log client disable with admin password</span>
          </label>
          <label className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              checked={settings.audit_logs.fail_close_logs}
              onChange={(e) => updateField('audit_logs.fail_close_logs', e.target.checked)}
              className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"
            />
            <span className="text-sm text-gray-300">Log fail-close events</span>
          </label>
          <label className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              checked={settings.audit_logs.fail_open_logs}
              onChange={(e) => updateField('audit_logs.fail_open_logs', e.target.checked)}
              className="w-4 h-4 bg-gray-800 border border-gray-700 rounded"
            />
            <span className="text-sm text-gray-300">Log fail-open events (if allowed)</span>
          </label>
        </div>
      </div>
    </div>
  );
}
