'use client';
import { useState } from 'react';
import {
  Brain, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Users, Activity, Eye, X, Zap, Target, BarChart3, Clock,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Layers,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────── */
interface ThreatModel {
  id: string;
  name: string;
  type: 'ml' | 'dl' | 'behavioral' | 'anomaly';
  description: string;
  accuracy: number;
  falsePositiveRate: number;
  enabled: boolean;
  lastTrained: string;
  status: 'active' | 'training' | 'disabled';
  detections24h: number;
  category: 'malware' | 'phishing' | 'c2' | 'exfiltration' | 'lateral' | 'insider';
}

interface UebaEntity {
  id: string;
  name: string;
  email: string;
  department: string;
  riskScore: number;
  riskTrend: 'rising' | 'stable' | 'falling';
  anomalies: { type: string; description: string; timestamp: string; severity: 'critical' | 'high' | 'medium' | 'low' }[];
  baselineDeviation: number;
  peerGroupDeviation: number;
  lastActivity: string;
}

interface AiDetection {
  id: string;
  timestamp: string;
  modelName: string;
  threat: string;
  confidence: number;
  entity: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'false-positive';
  details: string;
}

/* ─── Demo data ─────────────────────────────────────────────── */
const demoModels: ThreatModel[] = [
  { id: '1', name: 'Neural Malware Classifier', type: 'dl', description: 'Deep learning model trained on 50M+ malware samples. Classifies zero-day malware using PE header analysis and behavioral sandboxing telemetry.', accuracy: 99.2, falsePositiveRate: 0.3, enabled: true, lastTrained: '2026-03-12', status: 'active', detections24h: 47, category: 'malware' },
  { id: '2', name: 'Phishing URL Detector', type: 'ml', description: 'Gradient-boosted model analyzing URL structure, domain age, SSL certificate anomalies, and page content similarity to detect phishing.', accuracy: 97.8, falsePositiveRate: 0.8, enabled: true, lastTrained: '2026-03-11', status: 'active', detections24h: 128, category: 'phishing' },
  { id: '3', name: 'C2 Beacon Detector', type: 'behavioral', description: 'Identifies command-and-control beaconing patterns using JA3/JA3S fingerprinting and periodic connection analysis.', accuracy: 96.4, falsePositiveRate: 1.2, enabled: true, lastTrained: '2026-03-10', status: 'active', detections24h: 8, category: 'c2' },
  { id: '4', name: 'Data Exfiltration Monitor', type: 'anomaly', description: 'Anomaly-based model detecting unusual outbound data volumes, encoding patterns (Base64/hex in DNS), and steganography indicators.', accuracy: 94.1, falsePositiveRate: 2.1, enabled: true, lastTrained: '2026-03-09', status: 'active', detections24h: 3, category: 'exfiltration' },
  { id: '5', name: 'Lateral Movement Tracker', type: 'behavioral', description: 'Graph-based analysis of internal network connections to detect credential re-use, pass-the-hash, and unusual service access.', accuracy: 93.7, falsePositiveRate: 1.8, enabled: true, lastTrained: '2026-03-08', status: 'active', detections24h: 12, category: 'lateral' },
  { id: '6', name: 'Insider Threat Scorer', type: 'ml', description: 'Ensemble model combining access patterns, download behavior, off-hours activity, and resignation signals for insider risk.', accuracy: 91.5, falsePositiveRate: 3.2, enabled: false, lastTrained: '2026-03-05', status: 'disabled', detections24h: 0, category: 'insider' },
];

const demoEntities: UebaEntity[] = [
  { id: '1', name: 'John Doe', email: 'jdoe@acme.com', department: 'Engineering', riskScore: 87, riskTrend: 'rising', baselineDeviation: 3.4, peerGroupDeviation: 4.1, lastActivity: '2 min ago', anomalies: [
    { type: 'Impossible Travel', description: 'Login from US-East and EU-West within 20 minutes', timestamp: '2026-03-10 14:30', severity: 'critical' },
    { type: 'Bulk Download', description: 'Downloaded 2.3 GB from internal repos in 15 minutes', timestamp: '2026-03-10 14:15', severity: 'high' },
    { type: 'Off-hours Access', description: 'Accessed sensitive docs at 3:42 AM local time', timestamp: '2026-03-10 03:42', severity: 'medium' },
  ]},
  { id: '2', name: 'Alice Smith', email: 'alice@acme.com', department: 'Finance', riskScore: 72, riskTrend: 'rising', baselineDeviation: 2.8, peerGroupDeviation: 3.5, lastActivity: '5 min ago', anomalies: [
    { type: 'Privilege Escalation', description: 'Attempted to access admin panel without authorization', timestamp: '2026-03-10 13:55', severity: 'high' },
    { type: 'Unusual Destination', description: 'Multiple connections to file-sharing sites', timestamp: '2026-03-10 12:30', severity: 'medium' },
  ]},
  { id: '3', name: 'Bob Chen', email: 'bob@acme.com', department: 'Engineering', riskScore: 34, riskTrend: 'stable', baselineDeviation: 0.8, peerGroupDeviation: 0.5, lastActivity: '12 min ago', anomalies: [
    { type: 'New Application', description: 'First-time use of cloud IDE not in sanctioned list', timestamp: '2026-03-10 11:00', severity: 'low' },
  ]},
  { id: '4', name: 'Eve Martinez', email: 'eve@acme.com', department: 'HR', riskScore: 58, riskTrend: 'falling', baselineDeviation: 1.9, peerGroupDeviation: 2.2, lastActivity: '28 min ago', anomalies: [
    { type: 'Credential Sharing', description: 'Same session token used from 2 different IPs', timestamp: '2026-03-10 10:45', severity: 'high' },
  ]},
  { id: '5', name: 'Charlie Wilson', email: 'charlie@acme.com', department: 'Sales', riskScore: 15, riskTrend: 'stable', baselineDeviation: 0.3, peerGroupDeviation: 0.2, lastActivity: '1 hr ago', anomalies: [] },
];

const demoDetections: AiDetection[] = [
  { id: '1', timestamp: '2026-03-10 14:32:05', modelName: 'Neural Malware Classifier', threat: 'Emotet variant dropper', confidence: 98.7, entity: 'jdoe@acme.com', severity: 'critical', status: 'open', details: 'PE file with packed UPX sections, connects to known Emotet C2 infrastructure' },
  { id: '2', timestamp: '2026-03-10 14:31:58', modelName: 'Phishing URL Detector', threat: 'Credential harvesting page', confidence: 96.3, entity: 'alice@acme.com', severity: 'high', status: 'investigating', details: 'URL mimics Microsoft 365 login, domain registered 2 days ago, invalid SSL certificate' },
  { id: '3', timestamp: '2026-03-10 14:30:22', modelName: 'C2 Beacon Detector', threat: 'Cobalt Strike beacon', confidence: 94.1, entity: 'jdoe@acme.com', severity: 'critical', status: 'open', details: 'JA3 fingerprint matches Cobalt Strike, 60-second interval beaconing with jitter' },
  { id: '4', timestamp: '2026-03-10 14:28:00', modelName: 'Data Exfiltration Monitor', threat: 'DNS tunneling detected', confidence: 89.5, entity: 'eve@acme.com', severity: 'high', status: 'resolved', details: 'Base64-encoded data in DNS TXT queries to suspicious domain, 4.2 MB exfiltrated' },
  { id: '5', timestamp: '2026-03-10 14:22:00', modelName: 'Lateral Movement Tracker', threat: 'Pass-the-hash attempt', confidence: 87.2, entity: 'alice@acme.com', severity: 'medium', status: 'false-positive', details: 'NTLM authentication to 3 servers in rapid succession, determined to be automated deployment script' },
];

const typeLabels: Record<string, { label: string; color: string }> = {
  ml: { label: 'Machine Learning', color: 'bg-blue-900/40 text-blue-400 border-blue-800' },
  dl: { label: 'Deep Learning', color: 'bg-purple-900/40 text-purple-400 border-purple-800' },
  behavioral: { label: 'Behavioral', color: 'bg-cyan-900/40 text-cyan-400 border-cyan-800' },
  anomaly: { label: 'Anomaly Detection', color: 'bg-orange-900/40 text-orange-400 border-orange-800' },
};

const severityBadge: Record<string, string> = {
  critical: 'bg-red-900/40 text-red-400 border-red-800',
  high: 'bg-orange-900/40 text-orange-400 border-orange-800',
  medium: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
  low: 'bg-blue-900/40 text-blue-400 border-blue-800',
};

const statusBadge: Record<string, string> = {
  open: 'bg-red-900/30 text-red-400',
  investigating: 'bg-yellow-900/30 text-yellow-400',
  resolved: 'bg-green-900/30 text-green-400',
  'false-positive': 'bg-gray-800 text-gray-400',
};

/* ═══════════════════════════════════════════════════════════════ */
export default function AiUebaPage() {
  const [models, setModels] = useState(demoModels);
  const [entities] = useState(demoEntities);
  const [detections, setDetections] = useState(demoDetections);
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'ueba' | 'detections'>('overview');
  const [viewEntity, setViewEntity] = useState<UebaEntity | null>(null);
  const [viewDetection, setViewDetection] = useState<AiDetection | null>(null);

  const totalDetections = models.reduce((s, m) => s + m.detections24h, 0);
  const criticalEntities = entities.filter(e => e.riskScore >= 70).length;
  const openDetections = detections.filter(d => d.status === 'open' || d.status === 'investigating').length;
  const avgAccuracy = models.filter(m => m.enabled).reduce((s, m) => s + m.accuracy, 0) / models.filter(m => m.enabled).length;

  const toggleModel = (id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled, status: m.enabled ? 'disabled' : 'active' } : m));
  };

  const updateDetectionStatus = (id: string, status: AiDetection['status']) => {
    setDetections(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'models', label: 'AI Models', icon: Brain },
    { key: 'ueba', label: 'UEBA', icon: Users },
    { key: 'detections', label: 'Detections', icon: Target },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain size={24} className="text-purple-400" />
          <div>
            <h1 className="text-xl font-semibold">ML/AI Advanced Protection & UEBA</h1>
            <p className="text-sm text-gray-500">AI-powered threat detection, behavioral analytics, and entity risk scoring</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 w-fit overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── OVERVIEW TAB ──────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'AI Detections (24h)', value: totalDetections, icon: Zap, color: 'text-purple-400', trend: '+12%', trendUp: true },
              { label: 'Active Models', value: `${models.filter(m => m.enabled).length}/${models.length}`, icon: Brain, color: 'text-blue-400', trend: null, trendUp: false },
              { label: 'High-Risk Entities', value: criticalEntities, icon: AlertTriangle, color: 'text-red-400', trend: '+2', trendUp: true },
              { label: 'Avg Model Accuracy', value: `${avgAccuracy.toFixed(1)}%`, icon: Target, color: 'text-green-400', trend: '+0.3%', trendUp: true },
            ].map(kpi => (
              <div key={kpi.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon size={18} className={kpi.color} />
                  {kpi.trend && (
                    <span className={`flex items-center gap-0.5 text-xs ${kpi.trendUp ? 'text-red-400' : 'text-green-400'}`}>
                      {kpi.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {kpi.trend}
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* Recent detections + top risk entities side by side */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Target size={14} className="text-red-400" /> Recent AI Detections</h3>
              {detections.slice(0, 4).map(d => (
                <button key={d.id} onClick={() => setViewDetection(d)} className="w-full text-left p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{d.threat}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusBadge[d.status]}`}>{d.status}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{d.modelName}</span>
                    <span>Confidence: {d.confidence}%</span>
                    <span>{d.entity}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Users size={14} className="text-orange-400" /> Top Risk Entities</h3>
              {entities.filter(e => e.riskScore > 30).sort((a, b) => b.riskScore - a.riskScore).slice(0, 4).map(e => (
                <button key={e.id} onClick={() => setViewEntity(e)} className="w-full text-left p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{e.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${e.riskScore >= 70 ? 'text-red-400' : e.riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>{e.riskScore}</span>
                      {e.riskTrend === 'rising' && <TrendingUp size={12} className="text-red-400" />}
                      {e.riskTrend === 'falling' && <TrendingDown size={12} className="text-green-400" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{e.department}</span>
                    <span>{e.anomalies.length} anomalies</span>
                    <span>Last: {e.lastActivity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODELS TAB ────────────────────────────── */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 gap-4">
          {models.map(model => (
            <div key={model.id} className={`bg-gray-900 border border-gray-800 rounded-xl p-5 ${!model.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Brain size={18} className="text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-sm">{model.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${typeLabels[model.type].color}`}>{typeLabels[model.type].label}</span>
                      <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs capitalize">{model.category}</span>
                      <span className={`flex items-center gap-1 text-xs ${model.status === 'active' ? 'text-green-400' : model.status === 'training' ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {model.status === 'active' ? <CheckCircle size={10} /> : model.status === 'training' ? <Activity size={10} className="animate-pulse" /> : <XCircle size={10} />}
                        {model.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleModel(model.id)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${model.enabled ? 'bg-green-600' : 'bg-gray-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${model.enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">{model.description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-xs text-gray-500 mb-0.5">Accuracy</div>
                  <div className="text-sm font-bold text-green-400">{model.accuracy}%</div>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-xs text-gray-500 mb-0.5">False Positive</div>
                  <div className="text-sm font-bold text-yellow-400">{model.falsePositiveRate}%</div>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-xs text-gray-500 mb-0.5">Detections (24h)</div>
                  <div className="text-sm font-bold">{model.detections24h}</div>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-xs text-gray-500 mb-0.5">Last Trained</div>
                  <div className="text-sm text-gray-300">{model.lastTrained}</div>
                </div>
                <div className="p-2.5 bg-gray-800/30 rounded-lg">
                  <div className="text-xs text-gray-500 mb-0.5">F1 Score</div>
                  <div className="text-sm font-bold text-blue-400">{(2 * model.accuracy * (100 - model.falsePositiveRate) / (model.accuracy + (100 - model.falsePositiveRate))).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── UEBA TAB ──────────────────────────────── */}
      {activeTab === 'ueba' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Entity</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-center">Risk Score</th>
                  <th className="px-4 py-3 text-center">Trend</th>
                  <th className="px-4 py-3 text-center">Anomalies</th>
                  <th className="px-4 py-3 text-center">Baseline Dev.</th>
                  <th className="px-4 py-3 text-center">Peer Group Dev.</th>
                  <th className="px-4 py-3 text-left">Last Activity</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {entities.sort((a, b) => b.riskScore - a.riskScore).map(entity => (
                  <tr key={entity.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{entity.name}</div>
                      <div className="text-xs text-gray-500">{entity.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{entity.department}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${entity.riskScore >= 70 ? 'bg-red-500' : entity.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${entity.riskScore}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold ${entity.riskScore >= 70 ? 'text-red-400' : entity.riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {entity.riskScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entity.riskTrend === 'rising' && <TrendingUp size={14} className="inline text-red-400" />}
                      {entity.riskTrend === 'stable' && <span className="text-gray-500 text-xs">Stable</span>}
                      {entity.riskTrend === 'falling' && <TrendingDown size={14} className="inline text-green-400" />}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${entity.anomalies.length > 2 ? 'bg-red-900/30 text-red-400' : entity.anomalies.length > 0 ? 'bg-yellow-900/30 text-yellow-400' : 'bg-gray-800 text-gray-500'}`}>
                        {entity.anomalies.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400">{entity.baselineDeviation}σ</td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400">{entity.peerGroupDeviation}σ</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{entity.lastActivity}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewEntity(entity)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── DETECTIONS TAB ─────────────────────────── */}
      {activeTab === 'detections' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Threat</th>
                <th className="px-4 py-3 text-center">Confidence</th>
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-center">Severity</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {detections.map(d => (
                <tr key={d.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{d.timestamp}</td>
                  <td className="px-4 py-3 text-xs text-gray-300">{d.modelName}</td>
                  <td className="px-4 py-3 text-sm font-medium">{d.threat}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${d.confidence >= 95 ? 'text-red-400' : d.confidence >= 85 ? 'text-yellow-400' : 'text-blue-400'}`}>
                      {d.confidence}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{d.entity}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severityBadge[d.severity]}`}>{d.severity}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={d.status}
                      onChange={e => updateDetectionStatus(d.id, e.target.value as AiDetection['status'])}
                      className={`px-2 py-0.5 rounded text-xs font-medium bg-transparent border-0 focus:outline-none appearance-none cursor-pointer ${statusBadge[d.status]}`}
                    >
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                      <option value="false-positive">False Positive</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewDetection(d)} className="p-1 text-gray-500 hover:text-blue-400 transition-colors">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── View Entity Modal ──────────────────────── */}
      {viewEntity && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewEntity(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{viewEntity.name}</h3>
                <span className={`text-lg font-bold ${viewEntity.riskScore >= 70 ? 'text-red-400' : viewEntity.riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                  Risk: {viewEntity.riskScore}
                </span>
              </div>
              <button onClick={() => setViewEntity(null)} className="text-gray-400 hover:text-gray-200"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <span className="text-gray-500">Email</span>
                <div className="text-gray-300 mt-0.5">{viewEntity.email}</div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <span className="text-gray-500">Department</span>
                <div className="text-gray-300 mt-0.5">{viewEntity.department}</div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <span className="text-gray-500">Baseline Deviation</span>
                <div className="text-gray-300 mt-0.5">{viewEntity.baselineDeviation}σ</div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <span className="text-gray-500">Peer Group Deviation</span>
                <div className="text-gray-300 mt-0.5">{viewEntity.peerGroupDeviation}σ</div>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Anomaly Timeline</h4>
            <div className="space-y-2">
              {viewEntity.anomalies.length === 0 && <p className="text-xs text-gray-500">No anomalies detected</p>}
              {viewEntity.anomalies.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg border ${severityBadge[a.severity]}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{a.type}</span>
                    <span className="text-xs text-gray-500">{a.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-400">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── View Detection Modal ───────────────────── */}
      {viewDetection && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setViewDetection(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{viewDetection.threat}</h3>
              <button onClick={() => setViewDetection(null)} className="text-gray-400 hover:text-gray-200"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Model</span><div className="text-gray-300 mt-0.5">{viewDetection.modelName}</div></div>
                <div className="p-3 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Confidence</span><div className="text-gray-300 mt-0.5 text-lg font-bold">{viewDetection.confidence}%</div></div>
                <div className="p-3 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Entity</span><div className="text-gray-300 mt-0.5">{viewDetection.entity}</div></div>
                <div className="p-3 bg-gray-800/30 rounded-lg"><span className="text-gray-500">Timestamp</span><div className="text-gray-300 mt-0.5">{viewDetection.timestamp}</div></div>
              </div>
              <div className="p-3 bg-gray-800/30 rounded-lg">
                <span className="text-gray-500">Details</span>
                <p className="text-gray-300 mt-1">{viewDetection.details}</p>
              </div>
              <div className="flex gap-2">
                {(['open', 'investigating', 'resolved', 'false-positive'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => { updateDetectionStatus(viewDetection.id, s); setViewDetection({ ...viewDetection, status: s }); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${viewDetection.status === s ? statusBadge[s] + ' ring-1 ring-white/20' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                  >
                    {s === 'false-positive' ? 'FP' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
