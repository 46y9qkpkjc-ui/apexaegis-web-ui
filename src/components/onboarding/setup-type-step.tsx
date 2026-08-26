'use client';

/**
 * Setup Type Step — First decision point in the wizard.
 * Admin chooses between New Setup or Migration from existing vendor.
 */

import { useState } from 'react';
import { Rocket, ArrowRight, ArrowLeft, ArrowUpRight, Shield, Zap, Building2 } from 'lucide-react';

const ACCENT = '#6D4AFF';

interface SetupTypeStepProps {
  onSelect: (type: 'new' | 'migration') => void;
  onBack: () => void;
}

export function SetupTypeStep({ onSelect, onBack }: SetupTypeStepProps) {
  const [hovered, setHovered] = useState<'new' | 'migration' | null>(null);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Zap size={18} style={{ color: ACCENT }} /> How would you like to proceed?
        </h2>
        <p className="text-sm text-gray-400">
          Choose whether this is a fresh deployment or migrating from an existing SASE/SSE platform.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* New Setup Card */}
        <button
          onClick={() => onSelect('new')}
          onMouseEnter={() => setHovered('new')}
          onMouseLeave={() => setHovered(null)}
          className={`relative text-left p-5 rounded-xl border transition-all duration-200 ${
            hovered === 'new'
              ? 'border-[#6D4AFF] bg-[#6D4AFF]/10 shadow-lg shadow-[#6D4AFF]/20'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6D4AFF20, #6D4AFF40)' }}>
              <Rocket size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">New Setup</h3>
              <p className="text-gray-400 text-xs">Deploy ApexAegis fresh</p>
            </div>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed mb-3">
            Start from scratch. We'll auto-discover your organization, fetch your tenant ID,
            analyze your SaaS stack, and configure tenant-scoped access with intelligent CATE.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['Auto Tenant Lookup', 'Dynamic CATE', 'SaaS Access', 'Header Approval'].map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#6D4AFF]/20 text-[#a88bff] border border-[#6D4AFF]/30">
                {tag}
              </span>
            ))}
          </div>
          <ArrowRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-white transition-colors" />
        </button>

        {/* Migration Card */}
        <button
          onClick={() => onSelect('migration')}
          onMouseEnter={() => setHovered('migration')}
          onMouseLeave={() => setHovered(null)}
          className={`relative text-left p-5 rounded-xl border transition-all duration-200 ${
            hovered === 'migration'
              ? 'border-[#FF6D4A] bg-[#FF6D4A]/10 shadow-lg shadow-[#FF6D4A]/20'
              : 'border-white/10 bg-white/5 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6D4A20, #FF6D4A40)' }}>
              <ArrowUpRight size={20} className="text-[#FF6D4A]" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Migrating</h3>
              <p className="text-gray-400 text-xs">Import from existing platform</p>
            </div>
          </div>
          <p className="text-gray-300 text-xs leading-relaxed mb-3">
            Migrate from Zscaler, Netskope, Cloudflare, Palo Alto, Fortinet, or Cisco.
            AI analyzes your existing policies and maps them to ApexAegis CATE rules.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {['Policy Import', 'AI Analysis', 'Vendor APIs', 'Zero Downtime'].map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF6D4A]/20 text-[#ffb88c] border border-[#FF6D4A]/30">
                {tag}
              </span>
            ))}
          </div>
          <ArrowRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Sub-options for Migration */}
      <div className="mt-2 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
        <p className="text-xs text-gray-500 mb-2">Migration sources supported:</p>
        <div className="flex flex-wrap gap-2">
          {['Zscaler ZIA', 'Netskope', 'Cloudflare ZT', 'Prisma Access', 'FortiSASE', 'Cisco Umbrella'].map(vendor => (
            <span key={vendor} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/5">
              {vendor}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200">
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    </div>
  );
}
