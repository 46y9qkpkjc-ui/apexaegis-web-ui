'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, Search, LogOut, Settings, Shield,
  ChevronDown, AlertTriangle, CheckCircle, Info, X,
  Bug, Keyboard, Menu,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { TenantSwitcher } from './tenant-switcher';

/* Notification data */
interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const demoNotifications: Notification[] = [
  { id: 'n1', type: 'critical', title: 'ATP: Ransomware Blocked', message: 'CryptoLocker variant detected from 203.0.113.42 — payload quarantined. Source matched TI feed.', time: '2 min ago', read: false },
  { id: 'n2', type: 'warning', title: 'SSL Certificate Expiring', message: 'Wildcard cert *.apexaegis.io expires in 14 days. Renew via CA Certificates page.', time: '18 min ago', read: false },
  { id: 'n3', type: 'critical', title: 'DRKey Session Failure', message: 'ISD-202 (DBS Bank) DRKey derivation timed out — SCION peering degraded.', time: '45 min ago', read: false },
  { id: 'n4', type: 'info', title: 'Policy Migration Complete', message: 'Legacy firewall → ApexAegis migration batch #7 completed. 42 rules imported.', time: '1 hr ago', read: true },
  { id: 'n5', type: 'success', title: 'Gateway Node Online', message: 'NextGenNodes SG-03 (Singtel Singapore) is now operational. Latency: 1.2ms.', time: '2 hr ago', read: true },
  { id: 'n6', type: 'warning', title: 'UEBA Anomaly Detected', message: 'User jsmith@acme.com accessed 340 files in 5 minutes — risk score elevated to 87.', time: '3 hr ago', read: true },
  { id: 'n7', type: 'info', title: 'OAuth Client Registered', message: 'New client "SIEM-Splunk-v2" registered with scopes: logs:read, events:read.', time: '5 hr ago', read: true },
];

const notifIcon: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  critical: { icon: AlertTriangle, color: 'text-red-400' },
  warning: { icon: Bug, color: 'text-amber-400' },
  info: { icon: Info, color: 'text-blue-400' },
  success: { icon: CheckCircle, color: 'text-green-400' },
};

export function Header({ onMenuToggle }: { onMenuToggle?: () => void } = {}) {
  const router = useRouter();
  const { user, signOut, isDevMode, ssoMethod } = useAuthStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [notifications, setNotifications] = useState(demoNotifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const displayName = user?.name ?? 'Administrator';
  const displayEmail = user?.email ?? 'admin@apexaegis.io';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setShowAdmin(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const dismissNotif = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleLogout = () => {
    signOut();
    router.push('/login');
  };

  /* SSO method badge */
  const ssoLabel =
    ssoMethod === 'kerberos' ? 'KERBEROS' :
    ssoMethod === 'microsoft' ? 'ENTRA ID' :
    ssoMethod === 'saml' ? 'SAML SSO' : null;

  return (
    <header className="h-14 border-b border-gray-800/60 bg-gray-900/50 backdrop-blur-xl flex items-center px-3 sm:px-6 gap-2 sm:gap-4">
      {/* Mobile hamburger */}
      <button onClick={onMenuToggle} className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all -ml-1">
        <Menu size={20} />
      </button>

      {/* Active tenant scope */}
      <TenantSwitcher />

      {/* Search */}
      <div className="flex-1 max-w-md relative group">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
        <input
          type="text"
          placeholder="Search policies, objects, logs..."
          className="w-full pl-10 pr-12 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 focus:bg-gray-800/50 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-gray-700/50 bg-gray-800/50 text-[10px] text-gray-600 font-mono">
          <Keyboard size={10} /> K
        </kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Dev mode indicator */}
        {isDevMode && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-950/30 text-amber-400/80 border border-amber-800/30">
            DEV
          </span>
        )}

        {/* ─── Notifications ─── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowAdmin(false); }}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 bg-red-500 rounded-full text-[10px] font-bold shadow-lg shadow-red-500/30">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-[420px] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <button onClick={markAllRead} className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                  Mark all read
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-800/40">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">No notifications</div>
                ) : (
                  notifications.map(n => {
                    const NIcon = notifIcon[n.type].icon;
                    return (
                      <div key={n.id} onClick={() => { setShowNotifs(false); router.push('/logs'); }} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-800/30 transition-colors cursor-pointer ${n.read ? '' : 'bg-blue-600/5'}`}>
                        <NIcon size={16} className={`mt-0.5 flex-shrink-0 ${notifIcon[n.type].color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-200">{n.title}</span>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-gray-600 mt-1 block">{n.time}</span>
                        </div>
                        <button onClick={() => dismissNotif(n.id)} className="text-gray-600 hover:text-gray-400 mt-0.5">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-800/60 text-center">
                <button onClick={() => { setShowNotifs(false); router.push('/logs'); }} className="text-[11px] text-gray-400 hover:text-gray-200 transition-colors">View all notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* ─── Admin Profile & Logout ─── */}
        <div className="relative" ref={adminRef}>
          <button
            onClick={() => { setShowAdmin(!showAdmin); setShowNotifs(false); }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-800/50 transition-all overflow-x-auto"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md shadow-cyan-600/20">
              {initials}
            </div>
            <span className="text-sm text-gray-300 hidden sm:inline">{displayName.split(' ')[0]}</span>
            <ChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${showAdmin ? 'rotate-180' : ''}`} />
          </button>

          {showAdmin && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-full flex items-center justify-center text-sm font-bold shadow-md shadow-cyan-600/20">{initials}</div>
                  <div>
                    <div className="text-sm font-medium">{displayName}</div>
                    <div className="text-[11px] text-gray-500">{displayEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-green-900/30 text-green-400 border border-green-800/40">SUPER ADMIN</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-blue-900/30 text-blue-400 border border-blue-800/40">MFA ENABLED</span>
                  {ssoLabel && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-purple-900/30 text-purple-400 border border-purple-800/40">{ssoLabel}</span>
                  )}
                </div>
              </div>
              <div className="py-1">
                <button onClick={() => { setShowAdmin(false); router.push('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/40 transition-colors">
                  <Settings size={14} className="text-gray-500" /> Account Settings
                </button>
                <button onClick={() => { setShowAdmin(false); router.push('/admin/oauth-api'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800/40 transition-colors">
                  <Shield size={14} className="text-gray-500" /> API & OAuth Keys
                </button>
              </div>
              <div className="border-t border-gray-800/60 py-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/20 transition-colors">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
