'use client';
import { useState } from 'react';
import { Layers, Plus, Pencil, Trash2, Search, X } from 'lucide-react';

interface ServiceObject {
  id: string;
  name: string;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP' | 'ICMP';
  portRange: string;
  description: string;
  usedInPolicies: number;
  builtin: boolean;
}

const demoServices: ServiceObject[] = [
  { id: '1', name: 'HTTP', protocol: 'TCP', portRange: '80', description: 'Hypertext Transfer Protocol', usedInPolicies: 2, builtin: true },
  { id: '2', name: 'HTTPS', protocol: 'TCP', portRange: '443', description: 'HTTP over TLS', usedInPolicies: 4, builtin: true },
  { id: '3', name: 'DNS', protocol: 'TCP/UDP', portRange: '53', description: 'Domain Name System', usedInPolicies: 1, builtin: true },
  { id: '4', name: 'SSH', protocol: 'TCP', portRange: '22', description: 'Secure Shell', usedInPolicies: 0, builtin: true },
  { id: '5', name: 'RDP', protocol: 'TCP', portRange: '3389', description: 'Remote Desktop Protocol', usedInPolicies: 0, builtin: true },
  { id: '6', name: 'QUIC', protocol: 'UDP', portRange: '443', description: 'QUIC transport protocol', usedInPolicies: 0, builtin: true },
  { id: '7', name: 'Custom-API', protocol: 'TCP', portRange: '8080-8089', description: 'Internal API services port range', usedInPolicies: 1, builtin: false },
  { id: '8', name: 'Kafka-Cluster', protocol: 'TCP', portRange: '9092-9094', description: 'Kafka broker ports', usedInPolicies: 0, builtin: false },
];

const protocolColor: Record<string, string> = {
  'TCP': 'bg-blue-900/30 text-blue-400 border-blue-800/50',
  'UDP': 'bg-green-900/30 text-green-400 border-green-800/50',
  'TCP/UDP': 'bg-purple-900/30 text-purple-400 border-purple-800/50',
  'ICMP': 'bg-orange-900/30 text-orange-400 border-orange-800/50',
};

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceObject[]>(demoServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editSvc, setEditSvc] = useState<ServiceObject | null>(null);
  const [newSvc, setNewSvc] = useState({ name: '', protocol: 'TCP', portRange: '', description: '' });

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.portRange.includes(searchQuery)
  );

  const handleCreate = () => {
    if (!newSvc.name || !newSvc.portRange) return;
    setServices(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newSvc.name,
      protocol: newSvc.protocol as ServiceObject['protocol'],
      portRange: newSvc.portRange,
      description: newSvc.description,
      usedInPolicies: 0,
      builtin: false,
    }]);
    setNewSvc({ name: '', protocol: 'TCP', portRange: '', description: '' });
    setShowCreate(false);
  };

  const saveSvc = () => {
    if (!editSvc) return;
    setServices(prev => prev.map(s => s.id === editSvc.id ? editSvc : s));
    setEditSvc(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers size={24} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold">Services</h1>
            <p className="text-sm text-gray-500">Protocol and port definitions used in security policies</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Service
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search services..."
          className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Protocol</th>
              <th className="px-4 py-3 text-left">Port(s)</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Used In</th>
              <th className="px-4 py-3 text-center">Type</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(svc => (
              <tr key={svc.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 font-medium">{svc.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs border ${protocolColor[svc.protocol]}`}>
                    {svc.protocol}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{svc.portRange}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{svc.description}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">{svc.usedInPolicies} policies</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${svc.builtin ? 'bg-gray-800 text-gray-400' : 'bg-green-900/30 text-green-400'}`}>
                    {svc.builtin ? 'Built-in' : 'Custom'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!svc.builtin && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditSvc({ ...svc })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Edit"><Pencil size={14} /></button>
                      <button className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreate(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <h3 className="text-lg font-semibold mb-4">New Service Object</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={newSvc.name} onChange={e => setNewSvc({ ...newSvc, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. Custom-HTTPS" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Protocol</label>
                <select value={newSvc.protocol} onChange={e => setNewSvc({ ...newSvc, protocol: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="TCP/UDP">TCP/UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Port Range</label>
                <input value={newSvc.portRange} onChange={e => setNewSvc({ ...newSvc, portRange: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. 8080 or 8080-8090" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={newSvc.description} onChange={e => setNewSvc({ ...newSvc, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="Optional description" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Create</button>
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editSvc && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditSvc(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Service</h3>
              <button onClick={() => setEditSvc(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editSvc.name} onChange={e => setEditSvc({ ...editSvc, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Protocol</label>
                <select value={editSvc.protocol} onChange={e => setEditSvc({ ...editSvc, protocol: e.target.value as ServiceObject['protocol'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="TCP/UDP">TCP/UDP</option>
                  <option value="ICMP">ICMP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Port Range</label>
                <input value={editSvc.portRange} onChange={e => setEditSvc({ ...editSvc, portRange: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={editSvc.description} onChange={e => setEditSvc({ ...editSvc, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditSvc(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveSvc} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
