'use client';
import React from 'react';
import { Eye, HardDrive, Globe, FileText, Lock, Code } from 'lucide-react';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface FeaturesSettings {
  dlp: { enabled: boolean; usb_drives: boolean; printers: boolean; clipboard_copy_paste: boolean; screenshot_print_screen: boolean };
  dns_filtering: { enabled: boolean; filter_mode: 'block' | 'log'; block_malware: boolean; block_adult_content: boolean };
  url_filtering: { enabled: boolean; block_categories: string[] };
  file_type_download_control: { enabled: boolean; blocked_extensions: string[] };
  sandboxing: { enabled: boolean };
  http_header_filtering: { enabled: boolean };
  web_client_filtering: { enabled: boolean; blocked_clients: string[] };
}

interface Props {
  settings: FeaturesSettings;
  onChange: (settings: FeaturesSettings) => void;
}

export function FeaturesSettingsComponent({ settings, onChange }: Props) {
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
      {/* DLP Settings */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Eye size={14} className="text-red-400" />
          Data Loss Prevention (DLP)
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">Enable DLP</span>
            <button onClick={() => updateField('dlp.enabled', !settings.dlp.enabled)}>
              {settings.dlp.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
          {settings.dlp.enabled && (
            <>
              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={settings.dlp.usb_drives} onChange={(e) => updateField('dlp.usb_drives', e.target.checked)} className="w-4 h-4 bg-gray-800 border border-gray-700 rounded" />
                <span className="text-xs text-gray-400">Block USB drives</span>
              </label>
              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={settings.dlp.printers} onChange={(e) => updateField('dlp.printers', e.target.checked)} className="w-4 h-4 bg-gray-800 border border-gray-700 rounded" />
                <span className="text-xs text-gray-400">Block printers</span>
              </label>
              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={settings.dlp.clipboard_copy_paste} onChange={(e) => updateField('dlp.clipboard_copy_paste', e.target.checked)} className="w-4 h-4 bg-gray-800 border border-gray-700 rounded" />
                <span className="text-xs text-gray-400">Block clipboard copy/paste</span>
              </label>
              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={settings.dlp.screenshot_print_screen} onChange={(e) => updateField('dlp.screenshot_print_screen', e.target.checked)} className="w-4 h-4 bg-gray-800 border border-gray-700 rounded" />
                <span className="text-xs text-gray-400">Block screenshots/print screen</span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* DNS Filtering */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Globe size={14} className="text-blue-400" />
          DNS Filtering
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">Enable DNS Filtering</span>
            <button onClick={() => updateField('dns_filtering.enabled', !settings.dns_filtering.enabled)}>
              {settings.dns_filtering.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
          {settings.dns_filtering.enabled && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Filter Mode</label>
                <div className="flex gap-2">
                  {(['block', 'log'] as const).map((mode) => (
                    <button key={mode} onClick={() => updateField('dns_filtering.filter_mode', mode)} className={`flex-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${settings.dns_filtering.filter_mode === mode ? 'bg-blue-600/20 text-blue-400 border-blue-500/40' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
                      {mode === 'block' ? '🚫 Block' : '📝 Log'}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={settings.dns_filtering.block_malware} onChange={(e) => updateField('dns_filtering.block_malware', e.target.checked)} className="w-4 h-4 bg-gray-800 border border-gray-700 rounded" />
                <span className="text-xs text-gray-400">Block malware domains</span>
              </label>
              <label className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={settings.dns_filtering.block_adult_content} onChange={(e) => updateField('dns_filtering.block_adult_content', e.target.checked)} className="w-4 h-4 bg-gray-800 border border-gray-700 rounded" />
                <span className="text-xs text-gray-400">Block adult content</span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* URL Filtering */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <FileText size={14} className="text-purple-400" />
          URL Filtering
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">Enable URL Filtering</span>
            <button onClick={() => updateField('url_filtering.enabled', !settings.url_filtering.enabled)}>
              {settings.url_filtering.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
          {settings.url_filtering.enabled && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Block Categories (comma-separated)</label>
              <input
                type="text"
                value={settings.url_filtering.block_categories.join(', ')}
                onChange={(e) => updateField('url_filtering.block_categories', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="malware, phishing, adult, gambling"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-blue-600"
              />
              <p className="text-[9px] text-gray-600 mt-1">Examples: malware, phishing, adult, gambling, social-media</p>
            </div>
          )}
        </div>
      </div>

      {/* File Type Download Control */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <HardDrive size={14} className="text-yellow-400" />
          File Type Download Control
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">Enable Download Control</span>
            <button onClick={() => updateField('file_type_download_control.enabled', !settings.file_type_download_control.enabled)}>
              {settings.file_type_download_control.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
          {settings.file_type_download_control.enabled && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Blocked Extensions (comma-separated)</label>
              <input
                type="text"
                value={settings.file_type_download_control.blocked_extensions.join(', ')}
                onChange={(e) => updateField('file_type_download_control.blocked_extensions', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder=".exe, .scr, .bat, .cmd, .com"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sandboxing */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Lock size={14} className="text-orange-400" />
          Sandboxing
        </h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm text-gray-300">Enable Sandboxing</div>
            <div className="text-[10px] text-gray-500">Isolate executables and scripts in sandbox</div>
          </div>
          <button onClick={() => updateField('sandboxing.enabled', !settings.sandboxing.enabled)}>
            {settings.sandboxing.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
          </button>
        </div>
      </div>

      {/* HTTP Header Filtering & Web Client Filtering */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-4">
          <Code size={14} className="text-cyan-400" />
          HTTP & Web Client Filtering
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">HTTP Header Filtering</span>
            <button onClick={() => updateField('http_header_filtering.enabled', !settings.http_header_filtering.enabled)}>
              {settings.http_header_filtering.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">Web Client Filtering</span>
            <button onClick={() => updateField('web_client_filtering.enabled', !settings.web_client_filtering.enabled)}>
              {settings.web_client_filtering.enabled ? <ToggleRight size={28} className="text-green-400" /> : <ToggleLeft size={28} className="text-gray-600" />}
            </button>
          </div>
          {settings.web_client_filtering.enabled && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Blocked Clients (comma-separated)</label>
              <input
                type="text"
                value={settings.web_client_filtering.blocked_clients.join(', ')}
                onChange={(e) => updateField('web_client_filtering.blocked_clients', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="curl, wget, lynx"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-200 focus:outline-none focus:border-blue-600"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
