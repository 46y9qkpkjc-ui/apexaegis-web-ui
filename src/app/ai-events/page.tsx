'use client';
import { useCallback, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Bot, Sparkles, Activity, ShieldAlert, RefreshCw } from 'lucide-react';

type Classification = 'human' | 'assisted' | 'autonomous-agent';
type AgentAction = 'allow' | 'monitor' | 'deny';

interface AiEventRow {
  id: string;
  time: string; // ISO
  user: string;
  device: string;
  app: string;
  signal: string;
  classification: Classification;
  action: AgentAction;
  risk: number; // 0-100
}

// Action verdict chip palette — matches the risk-engine bands used across the console.
const actionChip: Record<AgentAction, string> = {
  allow: 'text-green-400 border-green-800 bg-green-900/20',
  monitor: 'text-amber-400 border-amber-800 bg-amber-900/20',
  deny: 'text-red-400 border-red-800 bg-red-900/20',
};

// Classification chip palette — human is benign (green), assisted is human-in-the-loop
// (cyan), a fully autonomous agent is the thing we care about (purple accent).
const classChip: Record<Classification, string> = {
  human: 'text-green-400 border-green-800 bg-green-900/20',
  assisted: 'text-cyan-400 border-cyan-800 bg-cyan-900/20',
  'autonomous-agent': 'text-purple-400 border-purple-800 bg-purple-900/20',
};

function timeAgo(iso: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Risk score → colour (risk-engine bands: deny 65-100, monitor 25-64, allow 0-24).
const riskColor = (s: number) =>
  typeof s !== 'number' || isNaN(s) ? 'text-gray-400' : s >= 65 ? 'text-red-400' : s >= 25 ? 'text-amber-400' : 'text-gray-300';

// Frontend demo data. Times are computed relative to module load so the "… ago"
// column stays fresh across refreshes without a backend call.
const now = Date.now();
const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();

const DEMO_ROWS: AiEventRow[] = [
  {
    id: 'evt-001',
    time: iso(2),
    user: 'evelyn.ng',
    device: 'vdi-aspire-01',
    app: 'LinkedIn',
    signal: 'Claude browser agent — auto-apply; superhuman input cadence, no human dwell',
    classification: 'autonomous-agent',
    action: 'monitor',
    risk: 58,
  },
  {
    id: 'evt-002',
    time: iso(6),
    user: 'steven.tan',
    device: 'steven-laptop',
    app: 'pastebin-ai.com',
    signal: 'Autonomous exfil to AI paste site; API-origin, headless',
    classification: 'autonomous-agent',
    action: 'deny',
    risk: 84,
  },
  {
    id: 'evt-003',
    time: iso(13),
    user: 'priya.raman',
    device: 'priya-mbp',
    app: 'chatgpt.com',
    signal: 'ChatGPT web session — human-in-the-loop prompting, organic dwell + pointer entropy',
    classification: 'assisted',
    action: 'allow',
    risk: 21,
  },
  {
    id: 'evt-004',
    time: iso(24),
    user: 'daniel.wong',
    device: 'dev-win-04',
    app: 'github.com · Copilot',
    signal: 'GitHub Copilot inline completions in VS Code; IDE-scoped, sanctioned tool',
    classification: 'assisted',
    action: 'allow',
    risk: 17,
  },
  {
    id: 'evt-005',
    time: iso(41),
    user: 'mei.lin',
    device: 'mei-laptop',
    app: 'perplexity.ai',
    signal: 'Perplexity answer engine — autonomous multi-site crawl, scripted fetch cadence',
    classification: 'autonomous-agent',
    action: 'monitor',
    risk: 47,
  },
  {
    id: 'evt-006',
    time: iso(56),
    user: 'raj.kumar',
    device: 'raj-vdi-02',
    app: 'wiki.apexaegis.app',
    signal: 'Autonomous agent bulk-reading internal wiki; token-auth, no page render, ~40 req/s',
    classification: 'autonomous-agent',
    action: 'deny',
    risk: 72,
  },
  {
    id: 'evt-007',
    time: iso(88),
    user: 'john.chen',
    device: 'john-desktop',
    app: 'news.google.com',
    signal: 'Human browsing — organic scroll, natural pointer entropy, per-tab dwell',
    classification: 'human',
    action: 'allow',
    risk: 4,
  },
];

export default function AiEventsPage() {
  const [rows, setRows] = useState<AiEventRow[]>(DEMO_ROWS);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    // No backend for this surface yet — re-set the demo rows so relative times
    // re-render, and pulse the spinner so the control feels live.
    setLoading(true);
    setTimeout(() => {
      setRows([...DEMO_ROWS]);
      setLoading(false);
    }, 350);
  }, []);

  const kpis = useMemo(() => {
    const agents = rows.filter(r => r.classification !== 'human');
    const autonomous = rows.filter(r => r.classification === 'autonomous-agent');
    const actioned = rows.filter(r => r.action !== 'allow');
    const humans = rows.filter(r => r.classification === 'human');
    return {
      agents: agents.length,
      autonomous: autonomous.length,
      actioned: actioned.length,
      ratio: `${humans.length} : ${agents.length}`,
    };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="text-purple-400" size={24} /> AI Events
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Detected autonomous-AI and agent activity, risk-scored against human browsing.
          </p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 border border-gray-700 rounded-lg text-xs"
        >
          <RefreshCw size={13} className={clsx(loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Bot size={15} className="text-cyan-400" /> Agents detected (24h)
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-100">{kpis.agents}</div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Sparkles size={15} className="text-purple-400" /> Autonomous sessions
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-100">{kpis.autonomous}</div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <ShieldAlert size={15} className="text-red-400" /> Actioned (monitor + deny)
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-100">{kpis.actioned}</div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-400 text-xs">
            <Activity size={15} className="text-green-400" /> Human vs agent ratio
          </div>
          <div className="mt-2 text-2xl font-bold text-gray-100">{kpis.ratio}</div>
        </div>
      </div>

      {/* Detected AI agent activity */}
      <div>
        <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
          <Bot size={16} className="text-purple-400" /> Detected AI Agent Activity
          <span className="text-[11px] font-normal text-gray-500">
            agent vs. human classification from behavioural + origin signals — risk-scored off-path
          </span>
        </h2>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
                  <th className="text-left font-medium px-4 py-2">Time</th>
                  <th className="text-left font-medium px-4 py-2">User</th>
                  <th className="text-left font-medium px-4 py-2">Device</th>
                  <th className="text-left font-medium px-4 py-2">App / Site</th>
                  <th className="text-left font-medium px-4 py-2">Agent signal</th>
                  <th className="text-left font-medium px-4 py-2">Classification</th>
                  <th className="text-left font-medium px-4 py-2">Action</th>
                  <th className="text-center font-medium px-4 py-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      No AI-agent activity detected for this tenant yet.
                    </td>
                  </tr>
                )}
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-2.5 text-gray-400 text-[12px] whitespace-nowrap">{timeAgo(r.time)}</td>
                    <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">{r.user}</td>
                    <td className="px-4 py-2.5 font-mono text-[12px] text-gray-200 whitespace-nowrap">{r.device}</td>
                    <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">{r.app}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-[12px] min-w-[280px]">{r.signal}</td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border capitalize whitespace-nowrap', classChip[r.classification])}>
                        {r.classification.replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('text-[11px] px-1.5 py-0.5 rounded border capitalize', actionChip[r.action])}>
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <span className={clsx('font-mono font-bold', riskColor(r.risk))}>{r.risk}</span>
                      <span className="text-gray-600 text-[10px]"> /100</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
