'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield, Eye, EyeOff, Fingerprint, Lock, ArrowRight,
  Smartphone, KeyRound, Loader2, AlertCircle, CheckCircle2,
  Building2, Wifi, WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiUrl } from '@/lib/api-url';
import { useAuthStore } from '@/lib/auth-store';
import type { SsoMethod } from '@/lib/auth-store';

/* ─── ApexAegis brand identity (mirrors apexastute.com/products/apexaegis) ─── */
const ACCENT = '#6D4AFF';

/* Purple/indigo re-skin: override Tailwind's blue and cyan color vars so every
   accent on this page maps to the product palette, without touching utilities. */
const brandVars = {
  fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
  backgroundColor: '#0f0b25',
  '--color-blue-300': '#b8a6ff',
  '--color-blue-400': '#9b7fff',
  '--color-blue-500': '#7c5cff',
  '--color-blue-600': '#6d4aff',
  '--color-blue-700': '#5a39e0',
  '--color-blue-950': '#140d33',
  '--color-cyan-300': '#b8a6ff',
  '--color-cyan-400': '#9b7fff',
  '--color-cyan-500': '#7c5cff',
  '--color-cyan-600': '#6d4aff',
} as React.CSSProperties;

/** Shield-with-check mark + "Apex Aegis" wordmark, exactly as on the product site. */
function BrandLockup({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 30 : 26;
  return (
    <span className="inline-flex items-center gap-2.5" style={{ fontFamily: "'Outfit', sans-serif" }} aria-label="Apex Aegis">
      <svg width={dim} height={dim} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill={ACCENT} fillOpacity="0.15" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12L11 14L15 10" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-2xl font-bold tracking-tight text-white">Apex <span style={{ color: ACCENT }}>Aegis</span></span>
    </span>
  );
}

/* ─── SSO Provider type returned by /api/v1/auth/sso/providers ─── */
interface SSOProvider {
  id: string;
  name: string;
  provider_type: string;
}

/* ─── SSO Detection helpers (simulated in UI, wired to real APIs in prod) ─── */

/** Probe Kerberos ticket (checks if negotiate/SPNego is available) */
async function probeKerberos(): Promise<boolean> {
  try {
    // In production: fetch('/api/auth/negotiate', { credentials: 'include' })
    // and check for WWW-Authenticate: Negotiate response.
    // Here we simulate: domain-joined Windows machines have a ticket.
    await new Promise(r => setTimeout(r, 600));
    return false; // Simulated: no Kerberos ticket detected
  } catch {
    return false;
  }
}

/** Probe Microsoft Work Account (checks WAM / Entra ID session) */
async function probeMicrosoftAccount(): Promise<boolean> {
  try {
    // In production: check navigator.credentials or MSAL silent token acquisition.
    await new Promise(r => setTimeout(r, 800));
    return false; // Simulated: no work account detected
  } catch {
    return false;
  }
}

/* ─── Spinner sub-component ─── */
function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

/* ─── Detection Step ─── */
function DetectionStep({ onComplete }: { onComplete: (kerberos: boolean, microsoft: boolean) => void }) {
  const [phase, setPhase] = useState<'kerberos' | 'microsoft' | 'done'>('kerberos');
  const [kerberosResult, setKerberosResult] = useState<boolean | null>(null);
  const [microsoftResult, setMicrosoftResult] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Phase 1: Kerberos
      const k = await probeKerberos();
      if (cancelled) return;
      setKerberosResult(k);
      setPhase('microsoft');

      // Phase 2: Microsoft Work Account
      const m = await probeMicrosoftAccount();
      if (cancelled) return;
      setMicrosoftResult(m);
      setPhase('done');

      // Short pause then advance
      await new Promise(r => setTimeout(r, 400));
      if (!cancelled) onComplete(k, m);
    })();
    return () => { cancelled = true; };
  }, [onComplete]);

  const steps = [
    { id: 'kerberos', label: 'Kerberos Ticket (SPNego)', result: kerberosResult, icon: Shield },
    { id: 'microsoft', label: 'Microsoft Work Account (Entra ID)', result: microsoftResult, icon: Building2 },
  ];

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Wifi size={28} className="text-blue-400 animate-pulse" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Detecting SSO</h1>
      <p className="text-sm text-gray-500 mb-8">
        Checking your environment for single sign-on credentials...
      </p>

      <div className="space-y-3 text-left max-w-sm mx-auto">
        {steps.map(s => {
          const Icon = s.icon;
          const isActive =
            (s.id === 'kerberos' && phase === 'kerberos') ||
            (s.id === 'microsoft' && phase === 'microsoft');
          const isDone = s.result !== null;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'bg-blue-600/5 border-blue-500/30'
                  : isDone
                    ? s.result
                      ? 'bg-green-600/5 border-green-500/30'
                      : 'bg-gray-800/30 border-gray-700/50'
                    : 'bg-gray-800/20 border-gray-800/30'
              }`}
            >
              <Icon size={18} className={
                isActive ? 'text-blue-400' :
                isDone && s.result ? 'text-green-400' :
                isDone ? 'text-gray-600' : 'text-gray-700'
              } />
              <span className={`text-sm flex-1 ${
                isActive ? 'text-gray-200' :
                isDone && s.result ? 'text-green-300' :
                isDone ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {s.label}
              </span>
              {isActive && <Spinner className="w-4 h-4 text-blue-400" />}
              {isDone && s.result && <CheckCircle2 size={16} className="text-green-400" />}
              {isDone && !s.result && <WifiOff size={16} className="text-gray-600" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── SSO Prompt Step ─── */
function SsoPromptStep({
  kerberos,
  microsoft,
  onSelectSso,
  onUseCredentials,
  ssoProviders,
  onSsoProviderClick,
}: {
  kerberos: boolean;
  microsoft: boolean;
  onSelectSso: (method: SsoMethod) => void;
  onUseCredentials: () => void;
  ssoProviders: SSOProvider[];
  onSsoProviderClick: (id: string) => void;
}) {
  const anyDetected = kerberos || microsoft || ssoProviders.length > 0;

  return (
    <div className="text-center">
      <div className={`w-16 h-16 ${anyDetected ? 'bg-green-600/10 border-green-500/20' : 'bg-amber-600/10 border-amber-500/20'} border rounded-2xl flex items-center justify-center mx-auto mb-6`}>
        {anyDetected ? (
          <CheckCircle2 size={28} className="text-green-400" />
        ) : (
          <AlertCircle size={28} className="text-amber-400" />
        )}
      </div>

      <h1 className="text-2xl font-bold mb-2">
        {anyDetected ? 'SSO Available' : 'SSO Not Detected'}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {anyDetected
          ? 'Your environment supports single sign-on. Choose a method below.'
          : 'No Kerberos ticket or Microsoft Work Account was found on this device.'}
      </p>

      {/* Available SSO methods. Windows/Kerberos SSO is always offered — on a
          domain-joined machine it signs in silently (SPNEGO); elsewhere it fails
          gracefully back with a message. The probe only decides the header copy. */}
      <div className="space-y-2.5 max-w-sm mx-auto mb-6">
        <button
          onClick={() => onSelectSso('kerberos')}
          className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-600/10 to-blue-600/5 hover:from-blue-600/20 hover:to-blue-600/10 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-sm transition-all group"
        >
          <Shield size={20} className="text-blue-400" />
          <div className="text-left flex-1">
            <div className="font-medium text-gray-200 group-hover:text-white">Sign in with Windows</div>
            <div className="text-[11px] text-gray-500">Kerberos SSO · SPNEGO / Windows Integrated Authentication</div>
          </div>
          <ArrowRight size={14} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
        </button>
        {microsoft && (
          <button
            onClick={() => onSelectSso('microsoft')}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-cyan-600/10 to-cyan-600/5 hover:from-cyan-600/20 hover:to-cyan-600/10 border border-cyan-500/30 hover:border-cyan-500/50 rounded-xl text-sm transition-all group"
          >
            <Building2 size={20} className="text-cyan-400" />
            <div className="text-left flex-1">
              <div className="font-medium text-gray-200 group-hover:text-white">Microsoft Entra ID</div>
              <div className="text-[11px] text-gray-500">Azure AD / Work Account sign-in</div>
            </div>
            <ArrowRight size={14} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
          </button>
        )}

        {/* Dynamic SSO providers from management plane */}
        {ssoProviders.map(p => {
          const colors: Record<string, string> = {
            okta:     'text-blue-400',
            azure_ad: 'text-cyan-400',
            google:   'text-red-400',
            ping:     'text-emerald-400',
          };
          const iconColor = colors[p.provider_type] ?? 'text-blue-400';
          return (
            <button
              key={p.id}
              onClick={() => onSsoProviderClick(p.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-gradient-to-r from-blue-600/10 to-blue-600/5 hover:from-blue-600/20 hover:to-blue-600/10 border border-blue-500/30 hover:border-blue-500/50 rounded-xl text-sm transition-all group"
            >
              <Shield size={20} className={iconColor} />
              <div className="text-left flex-1">
                <div className="font-medium text-gray-200 group-hover:text-white">Sign in with {p.name}</div>
                <div className="text-[11px] text-gray-500">{p.provider_type.replace('_', ' ').toUpperCase()} · OIDC</div>
              </div>
              <ArrowRight size={14} className="text-gray-600 group-hover:text-blue-400 transition-colors" />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 max-w-sm mx-auto mb-4">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-[11px] text-gray-600 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* Manual credentials */}
      <div className="max-w-sm mx-auto space-y-2.5">
        <button
          onClick={onUseCredentials}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700 rounded-xl text-sm text-gray-300 transition-colors"
        >
          <KeyRound size={14} className="text-gray-500" />
          Sign in with credentials
        </button>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN LOGIN PAGE                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { step, setStep, setSsoProbe, setSsoMethod, ssoProbe, signIn } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMethod, setMfaMethod] = useState<'totp' | 'passkey' | 'push'>('totp');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);

  /* Fetch SSO providers on mount */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/v1/auth/sso/providers'));
        if (res.ok) {
          const data = await res.json();
          setSsoProviders(data.sso_providers ?? []);
        }
      } catch { /* management plane may not be running */ }
    })();
  }, []);

  /* Handle SSO callback — URL has ?code=xxx&state=yyy */
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !state) return;

    (async () => {
      setLoading(true);
      setStep('credentials'); // show a loading state
      try {
        const res = await fetch(apiUrl('/api/v1/auth/sso/callback'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'SSO authentication failed');
          setLoading(false);
          return;
        }
        signIn(
          { email: data.user?.email, name: data.user?.name, role: data.user?.role, id: data.user?.id, org_id: data.user?.org_id, operator_scope: data.user?.operator_scope },
          data.access_token,
          data.refresh_token,
        );
        toast.success(`Signed in via SSO as ${data.user?.email}`);
        router.replace('/');
      } catch {
        toast.error('SSO callback failed — network error');
        setLoading(false);
      }
    })();
  }, [searchParams, signIn, router, setStep]);

  /* Handle the Kerberos (SPNEGO) return: ?code&method=kerberos → swap the
     one-time code for tokens; ?sso_error → surface why silent sign-in failed. */
  useEffect(() => {
    const ssoError = searchParams.get('sso_error');
    if (ssoError) {
      const msg: Record<string, string> = {
        kerberos_validation_failed: 'Windows sign-in could not be verified. Use your credentials instead.',
        principal_not_provisioned: 'Your Windows account is not provisioned for this console.',
        code_issue_failed: 'Windows sign-in failed to complete. Try again or use credentials.',
      };
      toast.error(msg[ssoError] ?? 'Windows sign-in failed.');
      window.history.replaceState({}, '', '/login');
      return;
    }
    const code = searchParams.get('code');
    if (!code || searchParams.get('method') !== 'kerberos') return;
    (async () => {
      setLoading(true);
      setStep('credentials'); // show a loading state
      try {
        const res = await fetch(apiUrl('/api/v1/auth/negotiate/exchange'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || 'Windows sign-in failed');
          setLoading(false);
          window.history.replaceState({}, '', '/login');
          return;
        }
        signIn(
          { email: data.user.email, name: data.user.name, role: data.user.role, id: data.user.id, org_id: data.user.org_id, operator_scope: data.user.operator_scope },
          data.access_token,
          data.refresh_token,
        );
        toast.success(`Signed in as ${data.user.email}`);
        router.replace('/');
      } catch {
        toast.error('Windows sign-in failed — network error');
        setLoading(false);
      }
    })();
  }, [searchParams, signIn, router, setStep]);

  /* Initiate SSO redirect for a configured OIDC provider */
  const handleSsoProviderClick = useCallback(async (idpId: string) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/v1/auth/sso/${encodeURIComponent(idpId)}/authorize`));
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to start SSO' }));
        toast.error(data.error || 'SSO authorize failed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.authorization_url) {
        globalThis.location.href = data.authorization_url;
      } else {
        toast.error('No authorization URL returned');
        setLoading(false);
      }
    } catch {
      toast.error('Network error starting SSO');
      setLoading(false);
    }
  }, []);

  /* Reset step on mount */
  useEffect(() => {
    setStep('detecting');
  }, [setStep]);

  /* Detection complete callback */
  const handleDetectionComplete = useCallback(
    (kerberos: boolean, microsoft: boolean) => {
      setSsoProbe({ kerberos, microsoft, checked: true });
      setStep('sso-prompt');
    },
    [setSsoProbe, setStep],
  );

  /* SSO method selection. Kerberos does a full-page navigation to the MP's
     Negotiate endpoint so the browser can complete Windows Integrated Auth
     silently (SPNEGO), then it redirects back here with ?code&method=kerberos. */
  const handleSsoSignIn = (method: SsoMethod) => {
    setSsoMethod(method);
    if (method === 'kerberos') {
      const redirect = `${window.location.origin}/login`;
      window.location.href = `${apiUrl('/api/v1/auth/negotiate')}?redirect_uri=${encodeURIComponent(redirect)}`;
      return;
    }
    const label = method === 'microsoft' ? 'Microsoft Entra ID' : 'SAML';
    toast.info(`${label} is not configured for this tenant yet. Use the configured Okta provider or local administrator credentials.`);
    setStep('sso-prompt');
  };

  /* Credentials submit */
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      // Check if user has MFA enabled
      if (data.user?.mfa_enabled) {
        setLoading(false);
        toast.error('MFA is required for this account. Use SSO until MFA verification is enabled.');
        return;
      }
      // No MFA — sign in directly
      signIn(
        { email: data.user.email, name: data.user.name, role: data.user.role, id: data.user.id, org_id: data.user.org_id, operator_scope: data.user.operator_scope },
        data.access_token,
        data.refresh_token,
      );
      setLoading(false);
      toast.success('Signed in successfully');
      router.push('/');
    } catch {
      setLoading(false);
      toast.error('Network error — check that https://api.apexaegis.app is reachable from this browser.');
    }
  };

  /* MFA submit */
  const handleMfa = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (mfaMethod === 'totp' && mfaCode.length < 6) {
      toast.error('Enter a valid 6-digit code');
      return;
    }
    toast.error('MFA verification is not enabled for local administrator login yet. Use SSO for MFA-protected users.');
  };

  /* ─── Render ─── */
  return (
    <div className="min-h-screen flex" style={brandVars}>
      {/* Left - branding panel (glass effect) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative overflow-hidden flex-col justify-between p-10 border-r border-[rgba(109,74,255,0.15)]">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0925] via-[#1a1440] to-[#0d0925]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(109,74,255,0.12),transparent)]" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[rgba(109,74,255,0.10)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[rgba(155,127,255,0.08)] rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="mb-14">
            <BrandLockup size="lg" />
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Security Service Edge<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Management Console
            </span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Zero-trust network access, SCION path-aware routing with AegisRoute™,
            advanced threat protection and unified security policy management —
            powered by the NextGenNodes global backbone.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { label: 'Global PoPs', value: '428', color: 'text-cyan-400' },
              { label: 'Uptime SLA', value: '99.999%', color: 'text-green-400' },
              { label: 'SCION ISDs', value: '12', color: 'text-amber-400' },
            ].map(s => (
              <div key={s.label} className="p-3 bg-gray-800/30 backdrop-blur-sm border border-gray-700/40 rounded-xl text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['SOC 2 Type II', 'ISO 27001', 'FedRAMP', 'PCI-DSS 4.0', 'GDPR', 'NIST 800-53'].map(c => (
              <span key={c} className="px-2 py-0.5 rounded-md bg-gray-800/40 text-gray-500 text-[10px] border border-gray-700/40 backdrop-blur-sm">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right - login form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Subtle bg mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_30%,rgba(109,74,255,0.06),transparent)]" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo */}
          <div className="lg:hidden flex mb-8 justify-center">
            <BrandLockup />
          </div>

          {/* ─── Step: Detecting SSO ─── */}
          {step === 'detecting' && (
            <DetectionStep onComplete={handleDetectionComplete} />
          )}

          {/* ─── Step: SSO Prompt ─── */}
          {step === 'sso-prompt' && (
            <SsoPromptStep
              kerberos={ssoProbe.kerberos}
              microsoft={ssoProbe.microsoft}
              onSelectSso={handleSsoSignIn}
              onUseCredentials={() => setStep('credentials')}
              ssoProviders={ssoProviders}
              onSsoProviderClick={handleSsoProviderClick}
            />
          )}

          {/* ─── Step: Credentials ─── */}
          {step === 'credentials' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Sign in</h1>
                <p className="text-sm text-gray-500">Enter your credentials to access the management console</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5" htmlFor="email">Email Address</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-600"
                    placeholder="admin@apexaegis.app" autoComplete="email" autoFocus />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-gray-400" htmlFor="password">Password</label>
                    <button type="button" className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 pr-10 bg-gray-800/50 border border-gray-700/80 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-gray-600"
                      placeholder="••••••••••••" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500/20" />
                    <span className="text-xs text-gray-400">Remember this device</span>
                  </label>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20">
                  {loading ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <>Sign In <ArrowRight size={14} /></>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-800/60">
                <p className="text-[11px] text-gray-600 text-center mb-3">Or sign in with</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setStep('sso-prompt')} className="flex items-center justify-center gap-2 py-2.5 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/60 rounded-xl text-xs text-gray-300 transition-all">
                    <Shield size={14} className="text-blue-400" /> SSO / SAML
                  </button>
                  <button className="flex items-center justify-center gap-2 py-2.5 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/60 rounded-xl text-xs text-gray-300 transition-all">
                    <Fingerprint size={14} className="text-green-400" /> Passkey
                  </button>
                </div>
              </div>

              {/* Back to SSO detection */}
              <button
                type="button"
                onClick={() => setStep('sso-prompt')}
                className="w-full mt-3 py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                ← Back to SSO options
              </button>
            </>
          )}

          {/* ─── Step: MFA ─── */}
          {step === 'mfa' && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={26} className="text-blue-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Multi-Factor Authentication</h1>
                <p className="text-sm text-gray-500">
                  Verify your identity to continue. Select a method below.
                </p>
              </div>

              {/* MFA method selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
                {[
                  { key: 'totp' as const, icon: KeyRound, label: 'TOTP Code', color: 'text-amber-400' },
                  { key: 'passkey' as const, icon: Fingerprint, label: 'Passkey', color: 'text-green-400' },
                  { key: 'push' as const, icon: Smartphone, label: 'Push Notify', color: 'text-blue-400' },
                ].map(m => (
                  <button key={m.key} onClick={() => setMfaMethod(m.key)}
                    className={`p-3 rounded-xl border text-center text-xs transition-all ${
                      mfaMethod === m.key
                        ? 'bg-blue-600/10 border-blue-500/40 text-white'
                        : 'bg-gray-800/30 border-gray-700/60 text-gray-400 hover:border-gray-600'
                    }`}>
                    <m.icon size={18} className={`mx-auto mb-1 ${m.color}`} />
                    {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleMfa} className="space-y-4">
                {mfaMethod === 'totp' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5" htmlFor="mfa-code">6-Digit Code</label>
                    <input id="mfa-code" type="text" inputMode="numeric" maxLength={6} value={mfaCode}
                      onChange={e => setMfaCode(e.target.value.replaceAll(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/80 rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                      placeholder="000000" autoFocus />
                    <p className="text-[10px] text-gray-600 mt-1.5 text-center">Enter the code from your authenticator app</p>
                  </div>
                )}

                {mfaMethod === 'passkey' && (
                  <div className="p-6 bg-gray-800/20 border border-gray-700/50 rounded-xl text-center">
                    <Fingerprint size={40} className="text-green-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-300 mb-1">Touch your security key or use biometrics</p>
                    <p className="text-[10px] text-gray-600">WebAuthn/FIDO2 hardware or platform authenticator</p>
                  </div>
                )}

                {mfaMethod === 'push' && (
                  <div className="p-6 bg-gray-800/20 border border-gray-700/50 rounded-xl text-center">
                    <Smartphone size={40} className="text-blue-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-300 mb-1">Push notification sent to your device</p>
                    <p className="text-[10px] text-gray-600">Approve the login request on the ApexAegis mobile app</p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-400">
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" /> Waiting for approval...
                    </div>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-600/20">
                  {loading ? (
                    <Spinner className="w-4 h-4" />
                  ) : (
                    <>Verify & Sign In <ArrowRight size={14} /></>
                  )}
                </button>

                <button type="button" onClick={() => { setStep('credentials'); setMfaCode(''); }}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  ← Back to credentials
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-[10px] text-gray-700">
            Protected by ApexAegis Zero Trust · TLS 1.3 · FIDO2 · Session bound to device fingerprint
          </p>
        </div>
      </div>
    </div>
  );
}
