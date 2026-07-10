'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { TenantScopeInterceptor } from './tenant-scope-interceptor';
import { TenantScopeBanner } from './tenant-scope-banner';
import { BrandApplier } from './brand-applier';
import { useTenantContext } from '@/lib/tenant-context';
import { FeatureProvider } from '@/hooks/use-features';
import { GuidedTour, type TourStep } from '@/components/guided-tour';

const TOUR_STEPS: TourStep[] = [
  { title: 'Welcome to ApexAegis', body: 'A 30-second tour of your managed SASE console — navigation, tenant scoping, and the tools you use most.' },
  { target: '[data-tour="sidebar"]', placement: 'right', title: 'Navigate the console', body: 'Policies, logs & events, identity, security profiles, and administration — all your controls live in the sidebar.' },
  { target: '[data-tour="tenant-switcher"]', placement: 'bottom', title: 'Switch tenants', body: 'Scope every page to a tenant here. The Overview lists all tenants, filterable by operator and dedicated/shared resource pool.' },
  { title: "You're all set", body: 'Replay this tour anytime from the guide button on the right edge of the screen.' },
];
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
  const { active } = useTenantContext();
  const activeTenantId = active?.id ?? 'all';

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
    <BrandApplier />
    <TenantScopeInterceptor />
    <div className="flex h-screen">
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <div data-tour="sidebar" className={`fixed inset-y-0 left-0 z-50 lg:static lg:z-auto transition-transform duration-200 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header onMenuToggle={() => setMobileMenuOpen(prev => !prev)} />
        <TenantScopeBanner />
        {/* Key by active tenant so pages re-mount and re-fetch scoped data on switch. */}
        <main key={activeTenantId} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gray-950/50">
          {children}
        </main>
      </div>
    </div>
    <GuidedTour steps={TOUR_STEPS} storageKey="apexaegis-webui-tour-v1" label="Product tour" />
    </FeatureProvider>
  );
}
