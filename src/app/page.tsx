'use client';
import { BarChart3, Shield, Server, Users, AlertTriangle, Activity, Globe, Lock } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Shield} label="Active Policies" value="12" change="+2 this week" color="blue" />
        <StatCard icon={Server} label="Gateway Nodes" value="4" change="All healthy" color="green" />
        <StatCard icon={Users} label="Active Users" value="247" change="+18 today" color="purple" />
        <StatCard icon={AlertTriangle} label="Threats Blocked" value="1,842" change="+126 today" color="red" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top blocked categories */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Globe size={16} className="text-orange-400" />
            Top Blocked URL Categories (24h)
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Malware', count: 487, pct: 100 },
              { name: 'Phishing', count: 312, pct: 64 },
              { name: 'Cryptomining', count: 201, pct: 41 },
              { name: 'Newly Registered Domains', count: 156, pct: 32 },
              { name: 'Spyware', count: 98, pct: 20 },
              { name: 'Newly Observed Domains', count: 74, pct: 15 },
            ].map(cat => (
              <div key={cat.name} className="flex items-center gap-3">
                <span className="text-sm text-gray-300 w-48 truncate">{cat.name}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500/60 rounded-full" style={{ width: `${cat.pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right font-mono">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gateway health */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity size={16} className="text-green-400" />
            Gateway Health
          </h3>
          <div className="space-y-3">
            {[
              { region: 'us-east-1', endpoint: 'gw-use1.apexaegis.io', cpu: 23, conns: 142, status: 'healthy' },
              { region: 'us-west-2', endpoint: 'gw-usw2.apexaegis.io', cpu: 18, conns: 89, status: 'healthy' },
              { region: 'eu-west-1', endpoint: 'gw-euw1.apexaegis.io', cpu: 31, conns: 201, status: 'healthy' },
              { region: 'ap-southeast-1', endpoint: 'gw-apse1.apexaegis.io', cpu: 12, conns: 56, status: 'healthy' },
            ].map(gw => (
              <div key={gw.region} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{gw.region}</div>
                  <div className="text-xs text-gray-500">{gw.endpoint}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">CPU: {gw.cpu}%</div>
                  <div className="text-xs text-gray-500">{gw.conns} conns</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent security events */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Lock size={16} className="text-yellow-400" />
          Recent Security Events
        </h3>
        <div className="space-y-2">
          {[
            { time: '2m ago', user: 'jdoe@acme.com', action: 'Blocked', detail: 'malware-c2.evil.com', category: 'Malware', severity: 'critical' },
            { time: '5m ago', user: 'alice@acme.com', action: 'Blocked', detail: 'phishing-login.net', category: 'Phishing', severity: 'high' },
            { time: '8m ago', user: 'bob@acme.com', action: 'SSL Inspected', detail: 'slack.com', category: 'SaaS', severity: 'info' },
            { time: '12m ago', user: 'charlie@acme.com', action: 'Blocked', detail: 'crypto-miner.cc', category: 'Cryptomining', severity: 'high' },
            { time: '15m ago', user: 'jdoe@acme.com', action: 'DNS Blocked', detail: 'new-domain-3day.xyz', category: 'NRD', severity: 'medium' },
          ].map((evt, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800/30 rounded-lg transition-colors text-sm">
              <span className={`w-2 h-2 rounded-full ${
                evt.severity === 'critical' ? 'bg-red-500' :
                evt.severity === 'high' ? 'bg-orange-500' :
                evt.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <span className="text-gray-500 w-16 text-xs">{evt.time}</span>
              <span className="text-gray-300 w-40 truncate">{evt.user}</span>
              <span className={`w-24 text-xs font-medium ${
                evt.action.includes('Blocked') ? 'text-red-400' : 'text-blue-400'
              }`}>{evt.action}</span>
              <span className="flex-1 text-gray-400 font-mono text-xs truncate">{evt.detail}</span>
              <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">{evt.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, change, color }: {
  icon: any; label: string; value: string; change: string; color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-900/20 text-blue-400',
    green: 'bg-green-900/20 text-green-400',
    purple: 'bg-purple-900/20 text-purple-400',
    red: 'bg-red-900/20 text-red-400',
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{change}</div>
    </div>
  );
}
