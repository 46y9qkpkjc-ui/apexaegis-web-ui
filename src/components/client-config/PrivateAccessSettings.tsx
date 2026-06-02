'use client';
import React from 'react';
import { Lock, Network, Building2, Clock } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface PrivateAccessSettings {
  machine_tunnel_enabled: boolean;
  mtls_enabled: boolean;
  device_certificate_required: boolean;
  vdi_support: { enabled: boolean; single_ip_multi_user: boolean };
  periodic_auth_hours: number;
  partner_tenant_access: { enabled: boolean };
}

interface Props {
  settings: PrivateAccessSettings;
  onChange: (settings: PrivateAccessSettings) => void;
}

export function PrivateAccessSettingsComponent({ settings, onChange }: Props) {
  const updateField = (path: string, value: any) => {
    const parts = path.split('.');
    const updated = JSON.parse(JSON.stringify(settings));
    let current = updated;
    for (let i = 0; i < parts.length - 1; i++) {
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Machine Tunnel & mTLS */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Lock size={14} className="text-green-400" />
          Machine Tunnel & mTLS
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Enable Machine Tunnel</div>
              <div className="text-[10px] text-gray-500">Allow machine-level tunneling for system services</div>
            </div>
            <button onClick={() => updateField('machine_tunnel_enabled', !settings.machine_tunnel_enabled)}>
              {settings.machine_tunnel_enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Enable mTLS</div>
              <div className="text-[10px] text-gray-500">Mutual TLS authentication for secure connection</div>
            </div>
            <button onClick={() => updateField('mtls_enabled', !settings.mtls_enabled)} disabled={!settings.machine_tunnel_enabled}>
              {settings.mtls_enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className={!settings.machine_tunnel_enabled ? 'text-gray-700' : 'text-gray-600'} />}
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Require Device Certificate</div>
              <div className="text-[10px] text-gray-500">Validate device certificate for mTLS</div>
            </div>
            <button onClick={() => updateField('device_certificate_required', !settings.device_certificate_required)} disabled={!settings.mtls_enabled}>
              {settings.device_certificate_required ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className={!settings.mtls_enabled ? 'text-gray-700' : 'text-gray-600'} />}
            </button>
          </div>
        </div>
      </div>

      {/* VDI Configuration */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Network size={14} className="text-purple-400" />
          VDI & Multi-User Support
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Enable VDI Support</div>
              <div className="text-[10px] text-gray-500">Support non-persistent desktop environments (Citrix, AVD)</div>
            </div>
            <button onClick={() => updateField('vdi_support.enabled', !settings.vdi_support.enabled)}>
              {settings.vdi_support.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          {settings.vdi_support.enabled && (
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-gray-300">Single IP, Multi-User Sessions</div>
                <div className="text-[10px] text-gray-500">Allow multiple users on same IP with session isolation</div>
              </div>
              <button onClick={() => updateField('vdi_support.single_ip_multi_user', !settings.vdi_support.single_ip_multi_user)}>
                {settings.vdi_support.single_ip_multi_user ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Periodic Re-authentication */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Clock size={14} className="text-orange-400" />
          Periodic Re-authentication
        </h3>
        <div className="space-y-3">
          <label className="text-xs text-gray-500 block">Auth Interval (hours)</label>
          <input
            type="number"
            min="1"
            max="720"
            value={settings.periodic_auth_hours}
            onChange={(e) => updateField('periodic_auth_hours', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-blue-600"
          />
          <p className="text-[9px] text-gray-600">Re-authenticate every N hours for private access (1-720 hours)</p>
        </div>
      </div>

      {/* Partner Tenant Access */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Building2 size={14} className="text-cyan-400" />
          Partner Tenant Access
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm text-gray-300">Enable Partner Access</div>
              <div className="text-[10px] text-gray-500">Allow partner organizations to access private resources</div>
            </div>
            <button onClick={() => updateField('partner_tenant_access.enabled', !settings.partner_tenant_access.enabled)}>
              {settings.partner_tenant_access.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>

          {settings.partner_tenant_access.enabled && (
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">Partner organizations can be added in the Partner Management section</p>
              <div className="text-xs text-gray-600">
                • Define partner access levels (read, write, admin)
                <br />• Set expiration dates for temporary access
                <br />• Monitor partner resource access
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          💡 <strong>Private Access</strong> provides secure, authenticated access to private resources outside the public internet. Machine tunnel enables system-level connectivity, while VDI support allows non-persistent environments.
        </p>
      </div>
    </div>
  );
}
