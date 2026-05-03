'use client';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import { MigrationTool } from '@/components/migration/migration-tool';

export default function MigrationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowDownToLine size={24} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold">Policy Migration</h1>
            <p className="text-sm text-gray-500">
              Import policies from Zscaler, Netskope, Cloudflare, Palo Alto, Fortinet &amp; Cisco Umbrella
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-900/15 border border-blue-800/30 rounded-xl">
        <ArrowRight size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="text-blue-300 font-medium">One-Click Migration</p>
          <p className="text-blue-400/70 mt-1">
            Connect to your existing SSE/SASE platform via API, review each policy with duplicate detection
            and optimization suggestions, then import into ApexAegis with a single click. API credentials
            are used only for this session and are never persisted.
          </p>
        </div>
      </div>

      <MigrationTool />
    </div>
  );
}
