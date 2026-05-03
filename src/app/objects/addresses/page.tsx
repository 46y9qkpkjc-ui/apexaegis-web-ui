'use client';
import { useState } from 'react';
import { Globe, Plus, Pencil, Trash2, Search, X } from 'lucide-react';

interface AddressObject {
  id: string;
  name: string;
  type: 'subnet' | 'ip-range' | 'fqdn' | 'wildcard-fqdn' | 'geography';
  value: string;
  description: string;
  usedInPolicies: number;
}

const demoAddresses: AddressObject[] = [
  { id: '1', name: 'Internal Subnets', type: 'subnet', value: '10.0.0.0/8', description: 'All internal RFC1918 subnets', usedInPolicies: 3 },
  { id: '2', name: 'HQ Office', type: 'subnet', value: '10.0.1.0/24', description: 'Headquarters LAN', usedInPolicies: 1 },
  { id: '3', name: 'Remote VPN Pool', type: 'ip-range', value: '10.10.0.1-10.10.0.254', description: 'VPN client IP pool', usedInPolicies: 2 },
  { id: '4', name: 'CDN Endpoints', type: 'fqdn', value: 'cdn.acme.com', description: 'Content delivery servers', usedInPolicies: 1 },
  { id: '5', name: 'Partner APIs', type: 'wildcard-fqdn', value: '*.partner-api.com', description: 'All partner API subdomains', usedInPolicies: 1 },
  { id: '6', name: 'Blocked Countries', type: 'geography', value: 'CN, RU, KP, IR', description: 'Sanctioned country geo-block', usedInPolicies: 2 },
];

const typeLabels: Record<string, { label: string; color: string }> = {
  'subnet': { label: 'Subnet', color: 'bg-blue-900/30 text-blue-400 border-blue-800/50' },
  'ip-range': { label: 'IP Range', color: 'bg-cyan-900/30 text-cyan-400 border-cyan-800/50' },
  'fqdn': { label: 'FQDN', color: 'bg-green-900/30 text-green-400 border-green-800/50' },
  'wildcard-fqdn': { label: 'Wildcard', color: 'bg-purple-900/30 text-purple-400 border-purple-800/50' },
  'geography': { label: 'Geo', color: 'bg-orange-900/30 text-orange-400 border-orange-800/50' },
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressObject[]>(demoAddresses);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editAddr, setEditAddr] = useState<AddressObject | null>(null);
  const [newAddr, setNewAddr] = useState({ name: '', type: 'subnet', value: '', description: '' });

  const filtered = addresses.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (!newAddr.name || !newAddr.value) return;
    setAddresses(prev => [...prev, {
      id: crypto.randomUUID(),
      name: newAddr.name,
      type: newAddr.type as AddressObject['type'],
      value: newAddr.value,
      description: newAddr.description,
      usedInPolicies: 0,
    }]);
    setNewAddr({ name: '', type: 'subnet', value: '', description: '' });
    setShowCreate(false);
  };

  const saveAddr = () => {
    if (!editAddr) return;
    setAddresses(prev => prev.map(a => a.id === editAddr.id ? editAddr : a));
    setEditAddr(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe size={24} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold">Addresses</h1>
            <p className="text-sm text-gray-500">Manage address objects used in security policies</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Address
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search addresses..."
          className="w-full pl-9 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Value</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-center">Used In</th>
              <th className="w-20 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(addr => (
              <tr key={addr.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3 font-medium">{addr.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs border ${typeLabels[addr.type].color}`}>
                    {typeLabels[addr.type].label}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{addr.value}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{addr.description}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">{addr.usedInPolicies} policies</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditAddr({ ...addr })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors" title="Edit"><Pencil size={14} /></button>
                    <button className="p-1 text-gray-500 hover:text-red-400 transition-colors" title="Delete"><Trash2 size={14} /></button>
                  </div>
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
            <h3 className="text-lg font-semibold mb-4">New Address Object</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={newAddr.name} onChange={e => setNewAddr({ ...newAddr, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. Branch Office" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={newAddr.type} onChange={e => setNewAddr({ ...newAddr, type: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="subnet">Subnet (CIDR)</option>
                  <option value="ip-range">IP Range</option>
                  <option value="fqdn">FQDN</option>
                  <option value="wildcard-fqdn">Wildcard FQDN</option>
                  <option value="geography">Geography</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Value</label>
                <input value={newAddr.value} onChange={e => setNewAddr({ ...newAddr, value: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="e.g. 192.168.1.0/24" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={newAddr.description} onChange={e => setNewAddr({ ...newAddr, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" placeholder="Optional description" />
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
      {editAddr && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditAddr(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Address Object</h3>
              <button onClick={() => setEditAddr(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editAddr.name} onChange={e => setEditAddr({ ...editAddr, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={editAddr.type} onChange={e => setEditAddr({ ...editAddr, type: e.target.value as AddressObject['type'] })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                  <option value="subnet">Subnet (CIDR)</option>
                  <option value="ip-range">IP Range</option>
                  <option value="fqdn">FQDN</option>
                  <option value="wildcard-fqdn">Wildcard FQDN</option>
                  <option value="geography">Geography</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Value</label>
                <input value={editAddr.value} onChange={e => setEditAddr({ ...editAddr, value: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={editAddr.description} onChange={e => setEditAddr({ ...editAddr, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditAddr(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveAddr} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
