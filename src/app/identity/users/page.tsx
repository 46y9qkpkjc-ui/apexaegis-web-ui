'use client';
import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, Search, Shield, UserCheck, UserX, X } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  groups: string[];
  status: string;
  mfa_enabled: boolean;
  last_login_at: string | null;
  oauth_provider: string;
  created_at: string | null;
}

interface ClientUser {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  status: string;
  oauth_provider: string;
  scim_external_id: string;
  created_at: string | null;
  updated_at: string | null;
}

interface Group {
  id: string;
  name: string;
  memberCount: number;
  description: string;
}

const initGroups: Group[] = [
  { id: 'g1', name: 'Engineering', memberCount: 0, description: 'Engineering team members' },
  { id: 'g2', name: 'Marketing', memberCount: 0, description: 'Marketing team' },
  { id: 'g3', name: 'Security', memberCount: 0, description: 'Security & compliance team' },
  { id: 'g4', name: 'Finance', memberCount: 0, description: 'Finance department' },
  { id: 'g5', name: 'VPN-Users', memberCount: 0, description: 'Users authorized for remote VPN access' },
];

const allGroupNames = ['Engineering', 'Marketing', 'Security', 'Finance', 'VPN-Users'];

const statusBadge: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-900/40 text-green-400 border-green-800' },
  inactive: { label: 'Inactive', color: 'bg-gray-800 text-gray-500 border-gray-700' },
  locked: { label: 'Locked', color: 'bg-red-900/40 text-red-400 border-red-800' },
};

const roleBadge: Record<string, string> = {
  super_admin: 'bg-purple-900/40 text-purple-400 border-purple-800',
  admin: 'bg-purple-900/40 text-purple-400 border-purple-800',
  user: 'bg-blue-900/30 text-blue-400 border-blue-800',
  read_only: 'bg-blue-900/30 text-blue-400 border-blue-800',
  auditor: 'bg-yellow-900/40 text-yellow-400 border-yellow-800',
};

const sourceBadge: Record<string, string> = {
  '': 'text-gray-400',
  local: 'text-gray-400',
  okta: 'text-blue-400',
  azure_ad: 'text-cyan-400',
  'azure-ad': 'text-cyan-400',
};

function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken ?? '';
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function formatLoginTime(dt: string | null): string {
  if (!dt) return 'Never';
  const d = new Date(dt);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

export default function UsersGroupsPage() {
  const [tab, setTab] = useState<'admins' | 'clients' | 'groups'>('admins');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>(initGroups);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newUser, setNewUser] = useState<User>({ id: '', name: '', email: '', role: 'user', groups: [], status: 'active', mfa_enabled: false, last_login_at: null, oauth_provider: '', created_at: null });
  const [newGroup, setNewGroup] = useState<Group>({ id: '', name: '', memberCount: 0, description: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const [admRes, clRes] = await Promise.all([
        fetch('/api/v1/users', { headers: getAuthHeaders() }),
        fetch('/api/v1/client-users', { headers: getAuthHeaders() }),
      ]);
      if (admRes.ok) {
        const data = await admRes.json();
        setUsers(data.map((u: User) => ({ ...u, groups: u.groups || [] })));
      }
      if (clRes.ok) {
        const data = await clRes.json();
        setClientUsers(data);
      }
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClientUsers = clientUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter(u => u.status === 'active').length;
  const mfaCount = users.filter(u => u.mfa_enabled).length;
  const clientActiveCount = clientUsers.filter(u => u.status === 'active').length;

  const saveUser = async () => {
    if (!editUser) return;
    try {
      const res = await fetch(`/api/v1/users/${editUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: editUser.name, role: editUser.role, status: editUser.status, mfa_enabled: editUser.mfa_enabled }),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch { /* silent */ }
    setEditUser(null);
  };

  const saveGroup = () => {
    if (!editGroup) return;
    setGroups(prev => prev.map(g => g.id === editGroup.id ? editGroup : g));
    setEditGroup(null);
  };

  const toggleUserGroup = (group: string) => {
    if (!editUser) return;
    setEditUser({
      ...editUser,
      groups: editUser.groups.includes(group)
        ? editUser.groups.filter(g => g !== group)
        : [...editUser.groups, group],
    });
  };

  const handleCreateUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    // Local-only for now (no backend create endpoint for manual users yet)
    setUsers(prev => [...prev, { ...newUser, id: String(Date.now()) }]);
    setNewUser({ id: '', name: '', email: '', role: 'user', groups: [], status: 'active', mfa_enabled: false, last_login_at: null, oauth_provider: '', created_at: null });
    setShowCreateUser(false);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) return;
    setGroups(prev => [...prev, { ...newGroup, id: 'g' + Date.now() }]);
    setNewGroup({ id: '', name: '', memberCount: 0, description: '' });
    setShowCreateGroup(false);
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch { /* silent */ }
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-semibold">Users & Groups</h1>
            <p className="text-sm text-gray-500">Manage user identities, group memberships, and access roles</p>
          </div>
        </div>
        <button onClick={() => tab === 'users' ? setShowCreateUser(true) : setShowCreateGroup(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          {tab === 'users' ? 'Add User' : 'Create Group'}
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm">
          Admins: <span className="text-white font-medium">{users.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm">
          Client Users: <span className="text-white font-medium">{clientUsers.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-green-900/20 border border-green-800/30 text-sm text-green-400">
          <UserCheck size={14} className="inline mr-1" /> Active: {activeCount + clientActiveCount}
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-blue-900/20 border border-blue-800/30 text-sm text-blue-400">
          <Shield size={14} className="inline mr-1" /> MFA Enabled: {mfaCount}
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm">
          Groups: <span className="text-white font-medium">{groups.length}</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-800">
        <button
          onClick={() => { setTab('admins'); setSearch(''); }}
          className={`pb-2 text-sm font-medium transition-colors ${tab === 'admins' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >Administrators</button>
        <button
          onClick={() => { setTab('clients'); setSearch(''); }}
          className={`pb-2 text-sm font-medium transition-colors ${tab === 'clients' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >Client Users</button>
        <button
          onClick={() => { setTab('groups'); setSearch(''); }}
          className={`pb-2 text-sm font-medium transition-colors ${tab === 'groups' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
        >Groups</button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tab === 'admins' ? 'Search administrators...' : tab === 'clients' ? 'Search client users...' : 'Search groups...'}
          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-600"
        />
      </div>

      {/* Administrators tab */}
      {tab === 'admins' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Loading administrators...</div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Groups</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">MFA</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${roleBadge[user.role] || roleBadge['user']}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.groups.map(g => (
                        <span key={g} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs">{g}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${(statusBadge[user.status] || statusBadge['active']).color}`}>
                      {(statusBadge[user.status] || statusBadge['active']).label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.mfa_enabled
                      ? <Shield size={14} className="text-green-400" />
                      : <UserX size={14} className="text-gray-600" />
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${sourceBadge[user.oauth_provider] || 'text-gray-400'}`}>{user.oauth_provider || 'local'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatLoginTime(user.last_login_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditUser({ ...user })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      )}

      {/* Client Users tab */}
      {tab === 'clients' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">Loading client users...</div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Provisioned</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{user.department || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{user.title || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${(statusBadge[user.status] || statusBadge['active']).color}`}>
                      {(statusBadge[user.status] || statusBadge['active']).label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${sourceBadge[user.oauth_provider] || 'text-gray-400'}`}>{user.oauth_provider || 'SCIM'}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatLoginTime(user.created_at)}</td>
                </tr>
              ))}
              {filteredClientUsers.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500 text-sm">No client users provisioned yet. Configure SCIM on your IdP to sync endpoint users.</td></tr>
              )}
            </tbody>
          </table>
          )}
        </div>
      )}

      {/* Groups tab */}
      {tab === 'groups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map(group => (
            <div key={group.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  <h3 className="font-semibold">{group.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditGroup({ ...group })} className="p-1 text-gray-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDeleteGroup(group.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">{group.description}</p>
              <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs">
                {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditUser(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit User</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <select value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="read_only">Read Only</option>
                    <option value="auditor">Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select value={editUser.status} onChange={e => setEditUser({ ...editUser, status: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="locked">Locked</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Groups</label>
                <div className="flex flex-wrap gap-2">
                  {allGroupNames.map(g => (
                    <button key={g} onClick={() => toggleUserGroup(g)} className={`px-2.5 py-1 rounded text-xs border transition-colors ${editUser.groups.includes(g) ? 'bg-blue-600/30 text-blue-300 border-blue-700' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">MFA Enabled</span>
                <button onClick={() => setEditUser({ ...editUser, mfa_enabled: !editUser.mfa_enabled })} className={`w-8 h-4 rounded-full transition-colors relative ${editUser.mfa_enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${editUser.mfa_enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveUser} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}

      {/* Edit Group Modal */}
      {editGroup && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setEditGroup(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Group</h3>
              <button onClick={() => setEditGroup(null)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={editGroup.name} onChange={e => setEditGroup({ ...editGroup, name: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={editGroup.description} onChange={e => setEditGroup({ ...editGroup, description: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditGroup(null)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={saveGroup} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Save</button>
            </div>
          </div>
        </>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreateUser(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add User</h3>
              <button onClick={() => setShowCreateUser(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@acme.io" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="read_only">Read Only</option>
                    <option value="auditor">Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Source</label>
                  <select value={newUser.oauth_provider} onChange={e => setNewUser({ ...newUser, oauth_provider: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50">
                    <option value="">Local</option>
                    <option value="okta">Okta</option>
                    <option value="azure_ad">Azure AD</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Groups</label>
                <div className="flex flex-wrap gap-2">
                  {allGroupNames.map(g => (
                    <button key={g} onClick={() => setNewUser({ ...newUser, groups: newUser.groups.includes(g) ? newUser.groups.filter(x => x !== g) : [...newUser.groups, g] })} className={`px-2.5 py-1 rounded text-xs border transition-colors ${newUser.groups.includes(g) ? 'bg-blue-600/30 text-blue-300 border-blue-700' : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-600'}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">MFA Enabled</span>
                <button onClick={() => setNewUser({ ...newUser, mfa_enabled: !newUser.mfa_enabled })} className={`w-8 h-4 rounded-full transition-colors relative ${newUser.mfa_enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${newUser.mfa_enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateUser(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreateUser} disabled={!newUser.name.trim() || !newUser.email.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">Add User</button>
            </div>
          </div>
        </>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowCreateGroup(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Group Name</label>
                <input value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="e.g. DevOps" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="Group description" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateGroup(false)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleCreateGroup} disabled={!newGroup.name.trim()} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors">Create Group</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
