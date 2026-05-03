'use client';
import { useState } from 'react';
import { Shield, GitBranch, Grid3X3 } from 'lucide-react';
import { clsx } from 'clsx';
import { AttackPathVisualization } from '@/components/security/attack-path-viz';
import { MicrosegmentationMap } from '@/components/security/microsegmentation';

export default function SecurityPage() {
  const [tab, setTab] = useState<'attack-paths' | 'microsegmentation'>('attack-paths');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-red-400" />
          <div>
            <h1 className="text-xl font-semibold">Security Posture</h1>
            <p className="text-sm text-gray-500">Attack path analysis & microsegmentation</p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        {[
          { key: 'attack-paths' as const, label: 'Attack Paths', icon: GitBranch },
          { key: 'microsegmentation' as const, label: 'Microsegmentation', icon: Grid3X3 },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t.key ? 'border-red-500 text-red-400' : 'border-transparent text-gray-500 hover:text-gray-300',
            )}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'attack-paths' && <AttackPathVisualization />}
      {tab === 'microsegmentation' && <MicrosegmentationMap />}
    </div>
  );
}
