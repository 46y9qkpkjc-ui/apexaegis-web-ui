'use client';

import { useState } from 'react';

interface SovereignCell {
  id: string;
  region: string;
  regionCode: string;
  provider: string;
  status: 'healthy' | 'degraded' | 'offline';
  vpcHealth: string;
  privateLink: string;
  kmsStatus: string;
  hsmStatus: string;
  position: { x: number; y: number };
}

const SOVEREIGN_CELLS: SovereignCell[] = [
  { id: 'cell-in-01', region: 'India (Mumbai)', regionCode: 'ap-south-1', provider: 'AWS', status: 'healthy', vpcHealth: 'Healthy', privateLink: 'Connected', kmsStatus: 'Active', hsmStatus: 'CloudHSM', position: { x: 68, y: 52 } },
  { id: 'cell-eu-01', region: 'EU (Frankfurt)', regionCode: 'eu-central-1', provider: 'AWS', status: 'healthy', vpcHealth: 'Healthy', privateLink: 'Connected', kmsStatus: 'Active', hsmStatus: 'CloudHSM', position: { x: 48, y: 38 } },
  { id: 'cell-us-01', region: 'US GovCloud', regionCode: 'us-gov-west-1', provider: 'AWS', status: 'healthy', vpcHealth: 'Healthy', privateLink: 'Connected', kmsStatus: 'Active', hsmStatus: 'CloudHSM', position: { x: 22, y: 40 } },
  { id: 'cell-sg-01', region: 'Singapore', regionCode: 'ap-southeast-1', provider: 'AWS', status: 'healthy', vpcHealth: 'Healthy', privateLink: 'Connected', kmsStatus: 'Active', hsmStatus: 'CloudHSM', position: { x: 76, y: 58 } },
  { id: 'cell-au-01', region: 'Australia (Sydney)', regionCode: 'ap-southeast-2', provider: 'AWS', status: 'degraded', vpcHealth: 'Degraded', privateLink: 'Reconnecting', kmsStatus: 'Active', hsmStatus: 'CloudHSM', position: { x: 82, y: 72 } },
  { id: 'cell-ae-01', region: 'UAE (Bahrain)', regionCode: 'me-south-1', provider: 'AWS', status: 'healthy', vpcHealth: 'Healthy', privateLink: 'Connected', kmsStatus: 'Active', hsmStatus: 'CloudHSM', position: { x: 58, y: 48 } },
];

interface GeofenceMode {
  mode: 'strict' | 'network' | 'permissive';
  violations: number;
  lastViolation: string;
}

const GEOFENCE: GeofenceMode = {
  mode: 'strict',
  violations: 3,
  lastViolation: '2024-01-15T14:22:00Z',
};

interface ConsensusNode {
  id: string;
  region: string;
  status: 'active' | 'syncing' | 'offline';
  lastConsensus: string;
  merkleRoot: string;
  chainHeight: number;
}

const CONSENSUS_NODES: ConsensusNode[] = [
  { id: 'node-in-01', region: 'India', status: 'active', lastConsensus: '2024-01-15T14:32:15Z', merkleRoot: '0x8f2a...3c1d', chainHeight: 12847291 },
  { id: 'node-eu-01', region: 'EU', status: 'active', lastConsensus: '2024-01-15T14:32:12Z', merkleRoot: '0x4b7e...9f2a', chainHeight: 12847290 },
  { id: 'node-us-01', region: 'US GovCloud', status: 'active', lastConsensus: '2024-01-15T14:32:10Z', merkleRoot: '0x1c3d...5e8b', chainHeight: 12847289 },
];

interface WORMCompliance {
  lockedRecords: number;
  lastLockTime: string;
  verifiableHashes: number;
  complianceMode: string;
}

const WORM: WORMCompliance = {
  lockedRecords: 847291,
  lastLockTime: '2024-01-15T14:32:18Z',
  verifiableHashes: 847291,
  complianceMode: 'SOC 2 / NIST / ISO 27001',
};

const STATUS_COLORS: Record<string, string> = {
  'healthy': 'bg-green-500/20 text-green-400',
  'degraded': 'bg-amber-500/20 text-amber-400',
  'offline': 'bg-red-500/20 text-red-400',
  'active': 'bg-green-500/20 text-green-400',
  'syncing': 'bg-cyan-500/20 text-cyan-400',
};

export default function SovereigntyPage() {
  const [selectedCell, setSelectedCell] = useState<SovereignCell | null>(null);
  const [geofenceMode, setGeofenceMode] = useState<'strict' | 'network' | 'permissive'>(GEOFENCE.mode);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Sovereign Cells & DLT Audit</h1>
        <p className="text-sm text-gray-400 mt-1">
          Real-time visibility and configuration of in-country enclaves, path controls, and immutable distributed ledger health.
        </p>
      </div>

      {/* Sovereign Cell Enclave Grid */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Sovereign Cell Enclave Grid</h2>
        <p className="text-sm text-gray-400 mb-4">
          Active regional AWS enclaves with in-country VPC health, PrivateLink status, and local AWS KMS/CloudHSM key boundaries.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map View */}
          <div className="relative bg-gray-800/30 rounded-lg p-4 min-h-[300px]">
            <svg viewBox="0 0 100 80" className="w-full h-full">
              <rect x="0" y="0" width="100" height="80" fill="rgba(124,92,255,0.02)" rx="4" />
              {SOVEREIGN_CELLS.map((cell) => {
                const statusColor = cell.status === 'healthy' ? '#22c55e' : cell.status === 'degraded' ? '#f59e0b' : '#ef4444';
                const isSelected = selectedCell?.id === cell.id;
                return (
                  <g key={cell.id} onClick={() => setSelectedCell(cell)} className="cursor-pointer">
                    <circle
                      cx={cell.position.x}
                      cy={cell.position.y}
                      r={isSelected ? 3 : 2}
                      fill={statusColor}
                      stroke={isSelected ? '#fff' : 'transparent'}
                      strokeWidth={0.5}
                    />
                    <text
                      x={cell.position.x}
                      y={cell.position.y - 4}
                      textAnchor="middle"
                      fill={statusColor}
                      fontSize={2}
                      fontWeight={isSelected ? 700 : 500}
                    >
                      {cell.regionCode}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Cell Cards */}
          <div className="grid grid-cols-2 gap-3">
            {SOVEREIGN_CELLS.map((cell) => (
              <div
                key={cell.id}
                onClick={() => setSelectedCell(cell)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedCell?.id === cell.id
                    ? 'border-cyan-500/50 bg-cyan-500/5'
                    : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-200">{cell.region}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLORS[cell.status]}`}>
                    {cell.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>VPC: <span className="text-gray-400">{cell.vpcHealth}</span></div>
                  <div>PrivateLink: <span className="text-gray-400">{cell.privateLink}</span></div>
                  <div>KMS: <span className="text-gray-400">{cell.kmsStatus}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hardware & Geocoding Boundary Status */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Hardware & Geocoding Boundary Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Active Geofencing Mode</label>
            <select
              value={geofenceMode}
              onChange={(e) => setGeofenceMode(e.target.value as typeof geofenceMode)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50 text-gray-200 text-sm"
            >
              <option value="strict">Strict Hardware (GPS + Wi-Fi BSSID + BGP ASN)</option>
              <option value="network">Network Path</option>
              <option value="permissive">Permissive Geo-IP</option>
            </select>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30">
            <div className="text-sm text-gray-500 mb-1">Violation Counter</div>
            <div className="text-2xl font-bold text-red-400">{GEOFENCE.violations}</div>
            <div className="text-xs text-gray-500">Out-of-jurisdiction attempts</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30">
            <div className="text-sm text-gray-500 mb-1">Last Violation</div>
            <div className="text-sm text-gray-300">{new Date(GEOFENCE.lastViolation).toLocaleString()}</div>
            <div className="text-xs text-gray-500">2 hours ago</div>
          </div>
        </div>
      </div>

      {/* Private Hiero aBFT Consensus Node Health */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Private Hiero aBFT Consensus Node Health</h2>
        <p className="text-sm text-gray-400 mb-4">
          Local validator node status, consensus timestamp generation, and running Merkle root stream.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Node ID</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Region</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Consensus</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Merkle Root</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Chain Height</th>
              </tr>
            </thead>
            <tbody>
              {CONSENSUS_NODES.map((node) => (
                <tr key={node.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 px-4 font-mono text-gray-300">{node.id}</td>
                  <td className="py-3 px-4 text-gray-300">{node.region}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[node.status]}`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{new Date(node.lastConsensus).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 font-mono text-cyan-400">{node.merkleRoot}</td>
                  <td className="py-3 px-4 font-mono text-gray-300">{node.chainHeight.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* S3 WORM Compliance Mode */}
      <div className="bg-gray-900/50 border border-gray-800/60 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">S3 WORM Compliance Mode</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-gray-800/30">
            <div className="text-sm text-gray-500 mb-1">Locked Records</div>
            <div className="text-2xl font-bold text-cyan-400">{WORM.lockedRecords.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30">
            <div className="text-sm text-gray-500 mb-1">Last Lock Time</div>
            <div className="text-sm text-gray-300">{new Date(WORM.lastLockTime).toLocaleTimeString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30">
            <div className="text-sm text-gray-500 mb-1">Verifiable Hashes</div>
            <div className="text-2xl font-bold text-green-400">{WORM.verifiableHashes.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/30">
            <div className="text-sm text-gray-500 mb-1">Compliance Mode</div>
            <div className="text-sm text-gray-300">{WORM.complianceMode}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
