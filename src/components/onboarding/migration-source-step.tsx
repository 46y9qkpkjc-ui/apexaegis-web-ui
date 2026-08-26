'use client';

/**
 * Migration Source Step — Admin selects the vendor they're migrating from.
 * Shows API credential forms for each supported vendor.
 */

import { useState } from 'react';
import {
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Upload, FileText, Building2, Shield, Zap
} from 'lucide-react';

const ACCENT = '#FF6D4A';

interface MigrationSourceStepProps {
  onNext: (data: MigrationConfig) => void;
  onBack: () => void;
}

export interface MigrationConfig {
  source: 'sase' | 'firewall';
  vendor: string;
  credentials: Record<string, string>;
  policiesFound: number;
}

const SASE_VENDORS = [
  { id: 'zscaler', name: 'Zscaler ZIA', fields: ['Cloud Name', 'API Key', 'Admin Username', 'Password'] },
  { id: 'netskope', name: 'Netskope', fields: ['Tenant URL', 'API Token v2'] },
  { id: 'cloudflare', name: 'Cloudflare Zero Trust', fields: ['Account ID', 'API Token'] },
  { id: 'prisma', name: 'Palo Alto Prisma Access', fields: ['Tenant Service Group', 'Client ID', 'Client Secret'] },
  { id: 'fortisase', name: 'Fortinet FortiSASE', fields: ['FortiCloud Email', 'REST API Key', 'Region'] },
  { id: 'cisco', name: 'Cisco Umbrella', fields: ['Organization ID', 'Management API Key', 'API Secret'] },
];

const FIREWALL_OPTIONS = [
  { id: 'panos', name: 'Palo Alto PAN-OS', desc: 'Upload individual firewall config or connect to Panorama' },
  { id: 'fortios', name: 'Fortinet FortiOS', desc: 'Upload individual firewall config or connect to FortiManager' },
  { id: 'checkpoint', name: 'Check Point Gaia', desc: 'Upload individual firewall config or connect to SmartConsole' },
  { id: 'ciscoasa', name: 'Cisco ASA/FTD', desc: 'Upload individual firewall config or connect to FMC' },
];

export function MigrationSourceStep({ onNext, onBack }: MigrationSourceStepProps) {
  const [source, setSource] = useState<'sase' | 'firewall' | null>(null);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [policiesFound, setPoliciesFound] = useState(0);
  const [error, setError] = useState('');

  const currentVendor = SASE_VENDORS.find(v => v.id === selectedVendor);
  const currentFirewall = FIREWALL_OPTIONS.find(f => f.id === selectedVendor);

  const handleFetch = async () => {
    if (!selectedVendor) return;
    setLoading(true);
    setError('');
    try {
      // Simulate API fetch
      await new Promise(r => setTimeout(r, 2500));
      setPoliciesFound(12);
    } catch {
      setError('Failed to connect to vendor API. Check credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    onNext({
      source: source!,
      vendor: selectedVendor,
      credentials,
      policiesFound,
    });
  };

  const canFetch = source === 'sase'
    ? currentVendor && currentVendor.fields.every(f => credentials[f])
    : selectedVendor;

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Upload size={18} style={{ color: ACCENT }} /> Migration Source
        </h2>
        <p className="text-sm text-gray-400">
          Select what you're migrating from. Our AI will analyze your existing policies and map them to ApexAegis CATE rules.
        </p>
      </div>

      {/* Source Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setSource('sase'); setSelectedVendor(''); setCredentials({}); setPoliciesFound(0); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            source === 'sase'
              ? 'border-[#FF6D4A]/50 bg-[#FF6D4A]/10'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <Shield size={20} className={source === 'sase' ? 'text-[#FF6D4A]' : 'text-gray-500'} />
          <h3 className="text-white font-semibold text-sm mt-2">SASE/SSE/ZTNA</h3>
          <p className="text-gray-400 text-xs mt-1">API-based policy import from cloud SASE platforms</p>
        </button>
        <button
          onClick={() => { setSource('firewall'); setSelectedVendor(''); setCredentials({}); setPoliciesFound(0); }}
          className={`p-4 rounded-xl border text-left transition-all ${
            source === 'firewall'
              ? 'border-[#FF6D4A]/50 bg-[#FF6D4A]/10'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <FileText size={20} className={source === 'firewall' ? 'text-[#FF6D4A]' : 'text-gray-500'} />
          <h3 className="text-white font-semibold text-sm mt-2">Traditional Firewall</h3>
          <p className="text-gray-400 text-xs mt-1">Upload config files or connect to management servers</p>
        </button>
      </div>

      {/* SASE Vendor Selection */}
      {source === 'sase' && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-400">Select Platform</label>
          <div className="grid grid-cols-2 gap-2">
            {SASE_VENDORS.map(vendor => (
              <button
                key={vendor.id}
                onClick={() => { setSelectedVendor(vendor.id); setCredentials({}); setPoliciesFound(0); }}
                className={`text-left p-3 rounded-xl border transition-all ${
                  selectedVendor === vendor.id
                    ? 'border-[#FF6D4A]/50 bg-[#FF6D4A]/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                }`}
              >
                <span className={`text-sm font-medium ${selectedVendor === vendor.id ? 'text-white' : 'text-gray-300'}`}>
                  {vendor.name}
                </span>
              </button>
            ))}
          </div>

          {/* Credential Fields */}
          {currentVendor && (
            <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
              <label className="block text-xs font-medium text-gray-400 mb-1">API Credentials</label>
              {currentVendor.fields.map(field => (
                <div key={field}>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">{field}</label>
                  <input
                    type={field.toLowerCase().includes('key') || field.toLowerCase().includes('secret') || field.toLowerCase().includes('password') ? 'password' : 'text'}
                    value={credentials[field] || ''}
                    onChange={e => setCredentials(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={`Enter ${field}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-[#FF6D4A]/50"
                  />
                </div>
              ))}
              <button
                onClick={handleFetch}
                disabled={!canFetch || loading}
                className="w-full mt-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-40 inline-flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(90deg,${ACCENT},#ff8b6d)` }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {loading ? 'Connecting & Fetching Policies...' : 'Fetch Policies'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Firewall Vendor Selection */}
      {source === 'firewall' && (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-400">Select Firewall Platform</label>
          <div className="space-y-2">
            {FIREWALL_OPTIONS.map(fw => (
              <button
                key={fw.id}
                onClick={() => { setSelectedVendor(fw.id); setPoliciesFound(0); }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedVendor === fw.id
                    ? 'border-[#FF6D4A]/50 bg-[#FF6D4A]/10'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                }`}
              >
                <span className={`text-sm font-medium ${selectedVendor === fw.id ? 'text-white' : 'text-gray-300'}`}>
                  {fw.name}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">{fw.desc}</p>
              </button>
            ))}
          </div>

          {/* File Upload for Firewall */}
          {selectedVendor && (
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
              <label className="block text-xs font-medium text-gray-400">Upload Configuration</label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-[#FF6D4A]/30 transition-colors cursor-pointer">
                <Upload size={24} className="mx-auto text-gray-500 mb-2" />
                <p className="text-xs text-gray-400">Drag & drop firewall config file here</p>
                <p className="text-[10px] text-gray-600 mt-1">Supports .xml, .conf, .json, .csv</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <AlertCircle size={15} className="text-red-400 shrink-0" />
          <span className="text-red-300 text-xs">{error}</span>
        </div>
      )}

      {/* Policies Found */}
      {policiesFound > 0 && (
        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-green-300 text-sm font-medium">{policiesFound} policies discovered</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            AI has analyzed your existing policies and is ready to map them to ApexAegis CATE rules.
            Click Continue to review and optimize.
          </p>
          <button
            onClick={handleContinue}
            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(90deg,${ACCENT},#ff8b6d)` }}
          >
            Continue to Policy Review <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    </div>
  );
}
