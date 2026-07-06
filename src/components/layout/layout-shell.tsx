'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { TenantScopeInterceptor } from './tenant-scope-interceptor';
import { TenantScopeBanner } from './tenant-scope-banner';
import { FeatureProvider } from '@/hooks/use-features';
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';

const AUTH_ROUTES = new Set(['/login']);

export function LayoutShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuth = AUTH_ROUTES.has(pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(!isAuth);
  const { accessToken, signOut } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    if (isAuth) {
      setCheckingAuth(false);
      return;
    }

    if (!accessToken) {
      signOut();
      router.replace('/login');
      setCheckingAuth(false);
      return;
    }

    const rejectSession = () => {
      if (cancelled) return;
      signOut();
      router.replace('/login');
    };
    const validateSession = async (showLoading = false) => {
      if (showLoading) setCheckingAuth(true);
      try {
        const res = await fetch(apiUrl('/api/v1/auth/me'), {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });
        if (!res.ok) rejectSession();
      } catch {
        // A temporary network outage should not destroy a valid local session.
      } finally {
        if (!cancelled && showLoading) setCheckingAuth(false);
      }
    };

    void validateSession(true);
    const timer = window.setInterval(() => void validateSession(), 30_000);
    const validateVisibleSession = () => {
      if (document.visibilityState === 'visible') void validateSession();
    };
    window.addEventListener('focus', validateVisibleSession);
    document.addEventListener('visibilitychange', validateVisibleSession);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', validateVisibleSession);
      document.removeEventListener('visibilitychange', validateVisibleSession);
    };
  }, [accessToken, isAuth, router, signOut]);

  if (isAuth) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-sm text-gray-500">
        Verifying session...
      </div>
    );
  }

  return (
    <FeatureProvider>
    <TenantScopeInterceptor />
    <div className="flex h-screen">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header onMenuToggle={() => setMobileMenuOpen(prev => !prev)} />
        <TenantScopeBanner />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-950/50">
          {children}
        </main>
      </div>
    </div>
    </FeatureProvider>
  );
}
