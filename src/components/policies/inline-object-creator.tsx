'use client';
import { useState } from 'react';
import { X } from 'lucide-react';

type ObjectType = 'address' | 'service' | 'user-group' | 'device-group' | 'url-category' | 'cloud-app' | 'atp-profile' | 'ssl-profile' | 'dns-list';

interface InlineObjectCreatorProps {
  type: ObjectType;
  onClose: () => void;
  onCreated: (obj: { name: string; id: string }) => void;
}

const typeLabels: Record<ObjectType, string> = {
  address: 'Address Object',
  service: 'Service Object',
  'user-group': 'User Group',
  'device-group': 'Device Group',
  'url-category': 'Custom URL Category',
  'cloud-app': 'Cloud Application',
  'atp-profile': 'ATP Profile',
  'ssl-profile': 'SSL Inspection Profile',
  'dns-list': 'DNS Filter List',
};

export function InlineObjectCreator({ type, onClose, onCreated }: InlineObjectCreatorProps) {
  const [name, setName] = useState('');

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-[70]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h3 className="font-semibold text-sm">Create {typeLabels[type]}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`e.g., ${type === 'address' ? '10.0.0.0/8' : type === 'service' ? 'Custom-HTTPS-8443' : 'My Group'}`}
              className="input-field"
              autoFocus
            />
          </div>

          {/* Type-specific fields */}
          {type === 'address' && <AddressFields />}
          {type === 'service' && <ServiceFields />}
          {type === 'user-group' && <GroupFields placeholder="Add users by email..." />}
          {type === 'device-group' && <GroupFields placeholder="Add devices by serial..." />}
          {type === 'url-category' && <URLCategoryFields />}
          {type === 'cloud-app' && <CloudAppFields />}
        </div>

        <div className="flex gap-3 px-5 py-3 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!name.trim()) return;
              // In production: POST to /api/v1/objects/{type}
              onCreated({ name: name.trim(), id: crypto.randomUUID() });
            }}
            disabled={!name.trim()}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Create & Select
          </button>
        </div>
      </div>
    </>
  );
}

function AddressFields() {
  const [addressType, setAddressType] = useState('subnet');
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Type</label>
        <select value={addressType} onChange={e => setAddressType(e.target.value)} className="input-field">
          <option value="subnet">Subnet (CIDR)</option>
          <option value="ip_range">IP Range</option>
          <option value="fqdn">FQDN</option>
          <option value="wildcard_fqdn">Wildcard FQDN</option>
          <option value="geography">Geography</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Value</label>
        <input
          placeholder={addressType === 'subnet' ? '10.0.0.0/8' : addressType === 'fqdn' ? 'example.com' : '10.0.0.1-10.0.0.255'}
          className="input-field"
        />
      </div>
    </>
  );
}

function ServiceFields() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Protocol</label>
          <select className="input-field">
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="TCP/UDP">TCP/UDP</option>
            <option value="ICMP">ICMP</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Port(s)</label>
          <input placeholder="443 or 8000-9000" className="input-field" />
        </div>
      </div>
    </>
  );
}

function GroupFields({ placeholder }: { placeholder: string }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">Members</label>
      <textarea
        placeholder={placeholder}
        className="input-field min-h-[80px] resize-none"
        rows={3}
      />
      <p className="text-xs text-gray-600 mt-1">One per line. Members can be added later.</p>
    </div>
  );
}

function URLCategoryFields() {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">Domains / URLs</label>
      <textarea
        placeholder="example.com&#10;*.bad-domain.net&#10;suspicious-site.org"
        className="input-field min-h-[100px] resize-none font-mono text-xs"
        rows={5}
      />
      <p className="text-xs text-gray-600 mt-1">One domain per line. Wildcards supported.</p>
    </div>
  );
}

function CloudAppFields() {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Vendor</label>
        <input placeholder="e.g., Microsoft" className="input-field" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Risk Level</label>
        <select className="input-field">
          <option value="1">1 — Trusted</option>
          <option value="2">2 — Low Risk</option>
          <option value="3">3 — Medium Risk</option>
          <option value="4">4 — High Risk</option>
          <option value="5">5 — Critical Risk</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Domains</label>
        <input placeholder="*.office.com, *.microsoft.com" className="input-field" />
      </div>
    </>
  );
}
