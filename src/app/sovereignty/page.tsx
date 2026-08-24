'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Server, Shield, Lock, MapPin, Radio, CheckCircle,
  AlertTriangle, Activity, Database, Wifi, Key
} from 'lucide-react';

// Types
interface SovereignEnclave {
  id: string;
  region: string;
  regionCode: string;
  provider: string;
  vpcStatus: 'healthy' | 'degraded' | 'down';
  privateLinkStatus: 'active' | 'inactive' | 'error';
  kmsStatus: 'active' | 'inactive';
  cloudHSM: boolean;
  activeConnections: number;
  latencyMs: number;
}

interface GeofencingMode {
  mode: 'strict_hardware' | 'network_path' | 'permissive_geoip';
  enabled: boolean;
  violationCount: number;
  lastViolation?: string;
}

interface HieroNode {
  id: string;
  name: string;
  status: 'active' | 'syncing' | 'offline';
  consensusTimestamp: string;
  merkleRoot: string;
  blocksSynced: number;
  totalBlocks: number;
}

interface WORMCompliance {
  mode: 'compliant' | 'non_compliant' | 'pending';
  lockedObjects: number;
  lastVerification: string;
  hashLookups: number;
}

// Mock data
const ENCLAVES: SovereignEnclave[] = [
  {
    id: 'env_001',
    region: 'India (Mumbai)',
    regionCode: 'ap-south-1',
    provider: 'AWS',
    vpcStatus: 'healthy',
    privateLinkStatus: 'active',
    kmsStatus: 'active',
    cloudHSM: true,
    activeConnections: 1247,
    latencyMs: 12,
  },
  {
    id: 'env_002',
    region: 'EU (Frankfurt)',
    regionCode: 'eu-central-1',
    provider: 'AWS',
    vpcStatus: 'healthy',
    privateLinkStatus: 'active',
    kmsStatus: 'active',
    cloudHSM: true,
    activeConnections: 2103,
    latencyMs: 18,
  },
  {
    id: 'env_003',
    region: 'US GovCloud',
    regionCode: 'us-gov-west-1',
    provider: 'AWS',
    vpcStatus: 'healthy',
    privateLinkStatus: 'active',
    kmsStatus: 'active',
    cloudHSM: true,
    activeConnections: 892,
    latencyMs: 24,
  },
  {
    id: 'env_004',
    region: 'Singapore',
    regionCode: 'ap-southeast-1',
    provider: 'AWS',
    vpcStatus: 'degraded',
    privateLinkStatus: 'active',
    kmsStatus: 'active',
    cloudHSM: false,
    activeConnections: 456,
    latencyMs: 15,
  },
];

const GEOFENCING: GeofencingMode[] = [
  { mode: 'strict_hardware', enabled: true, violationCount: 3, lastViolation: new Date(Date.now() - 3600000).toISOString() },
  { mode: 'network_path', enabled: true, violationCount: 12, lastViolation: new Date(Date.now() - 1800000).toISOString() },
  { mode: 'permissive_geoip', enabled: false, violationCount: 0 },
];

const HIERO_NODES: HieroNode[] = [
  { id: 'node_001', name: 'hiero-validator-01.ap-south-1', status: 'active', consensusTimestamp: new Date(Date.now() - 5000).toISOString(), merkleRoot: '0x8f92a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', blocksSynced: 1847291, totalBlocks: 1847291 },
  { id: 'node_002', name: 'hiero-validator-02.ap-south-1', status: 'active', consensusTimestamp: new Date(Date.now() - 5200).toISOString(), merkleRoot: '0x8f92a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2', blocksSynced: 1847291, totalBlocks: 1847291 },
  { id: 'node_003', name: 'hiero-validator-01.eu-central-1', status: 'syncing', consensusTimestamp: new Date(Date.now() - 12000).toISOString(), merkleRoot: '0x7e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b', blocksSynced: 1847285, totalBlocks: 1847291 },
];

const WORM: WORMCompliance = {
  mode: 'compliant',
  lockedObjects: 2847291,
  lastVerification: new Date(Date.now() - 300000).toISOString(),
  hashLookups: 12847,
};

const STATUS_CONFIG = {
  healthy: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  degraded: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  down: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  active: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  inactive: { color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' },
  error: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  syncing: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  offline: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  compliant: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  non_compliant: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
};

export default function SovereigntyPage() {
  const [enclaves, setEnclaves] = useState(ENCLAVES);
  const [selectedEnclave, setSelectedEnclave] = useState<SovereignEnclave | null>(ENCLAVES[0]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">Sovereign Cells & DLT Audit</h1>
        <p className="text-xs text-gray-400 mt-1">
          Real-time visibility and configuration of in-country enclaves, path controls, and immutable distributed ledger health.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Enclave Grid */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Globe size={12} className="text-cyan-400" /> Sovereign Cell Enclave Grid
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {enclaves.map((enclave) => {
                const vpcStyle = STATUS_CONFIG[enclave.vpcStatus];
                const isSelected = selectedEnclave?.id === enclave.id;
                return (
                  <div
                    key={enclave.id}
                    onClick={() => setSelectedEnclave(enclave)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-500/50 bg-cyan-500/5'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-medium text-white">{enclave.region}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{enclave.regionCode}</div>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${vpcStyle.bg} ${vpcStyle.border} ${vpcStyle.color}`}>
                        {enclave.vpcStatus}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className="flex items-center gap-1">
                        <Link size={8} className={enclave.privateLinkStatus === 'active' ? 'text-emerald-400' : 'text-gray-500'} />
                        <span className="text-gray-400">PrivateLink</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Key size={8} className={enclave.kmsStatus === 'active' ? 'text-emerald-400' : 'text-gray-500'} />
                        <span className="text-gray-400">KMS</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Server size={8} className="text-gray-400" />
                        <span className="text-gray-400">{enclave.activeConnections}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wifi size={8} className="text-gray-400" />
                        <span className="text-gray-400">{enclave.latencyMs}ms</span>
                      </div>
                    </div>
                    {enclave.cloudHSM && (
                      <div className="mt-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 inline-block">
                        CloudHSM
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Geofencing Status */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MapPin size={12} className="text-amber-400" /> Hardware Geofencing
            </h3>
            <div className="space-y-2">
              {GEOFENCING.map((gf) => {
                const modeLabel = gf.mode === 'strict_hardware' ? 'Strict Hardware (GPS + Wi-Fi + BGP)' :
                                  gf.mode === 'network_path' ? 'Network Path' : 'Permissive Geo-IP';
                return (
                  <div key={gf.mode} className="p-2 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-300">{modeLabel}</span>
                      <span className={`text-[10px] ${gf.enabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {gf.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    {gf.enabled && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500">Violations</span>
                        <span className={`font-mono ${gf.violationCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {gf.violationCount}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* WORM Compliance */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lock size={12} className="text-purple-400" /> S3 WORM Compliance
            </h3>
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Mode</span>
                <span className={`px-1.5 py-0.5 rounded border ${STATUS_CONFIG[WORM.mode].bg} ${STATUS_CONFIG[WORM.mode].border} ${STATUS_CONFIG[WORM.mode].color}`}>
                  {WORM.mode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Locked Objects</span>
                <span className="text-white font-mono">{WORM.lockedObjects.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Hash Lookups</span>
                <span className="text-white font-mono">{WORM.hashLookups.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Last Verification</span>
                <span className="text-gray-300">{new Date(WORM.lastVerification).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hiero Consensus Nodes */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Database size={12} className="text-indigo-400" /> Private Hiero aBFT Consensus Nodes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left font-medium px-3 py-2">Node</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
                <th className="text-left font-medium px-3 py-2">Last Consensus</th>
                <th className="text-left font-medium px-3 py-2">Merkle Root</th>
                <th className="text-right font-medium px-3 py-2">Blocks</th>
              </tr>
            </thead>
            <tbody>
              {HIERO_NODES.map((node) => {
                const style = STATUS_CONFIG[node.status];
                return (
                  <tr key={node.id} className="border-b border-gray-800/50">
                    <td className="px-3 py-2 font-mono text-gray-300">{node.name}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded border ${style.bg} ${style.border} ${style.color}`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-400">{new Date(node.consensusTimestamp).toLocaleTimeString()}</td>
                    <td className="px-3 py-2 font-mono text-gray-400 truncate max-w-[200px]">{node.merkleRoot}</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-300">{node.blocksSynced.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Link(props: { size: number; className?: string }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
