'use client';
import { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, AlertTriangle, Zap } from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────── */
export interface WafRule {
  id: string;
  label: string;
  description: string;
  category: 'owasp' | 'bot' | 'rate-limit' | 'geo' | 'custom';
  action: 'block' | 'challenge' | 'log' | 'off';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface RateLimitRule {
  id: string;
  path: string;
  requestsPerMinute: number;
  action: 'throttle' | 'block' | 'challenge';
  byField: 'ip' | 'session' | 'user' | 'api-key';
}

export interface GeoRule {
  id: string;
  countries: string[];
  action: 'block' | 'challenge' | 'allow';
}

export interface WafConfig {
  enabled: boolean;
  mode: 'detection' | 'prevention';
  owaspRules: WafRule[];
  botProtection: WafRule[];
  rateLimits: RateLimitRule[];
  geoBlocking: GeoRule[];
  customResponseCode: number;
  customBlockPage: boolean;
  logAllRequests: boolean;
  apiProtection: boolean;
  fileUploadScanning: boolean;
  maxBodySize: number;
}

/* ─── Defaults ─────────────────────────────────────────────── */
const DEFAULT_OWASP_RULES: WafRule[] = [
  { id: 'sqli', label: 'SQL Injection (SQLi)', description: 'Detects SQL injection attempts in query params, body, headers', category: 'owasp', action: 'block', severity: 'critical' },
  { id: 'xss', label: 'Cross-Site Scripting (XSS)', description: 'Blocks reflected and stored XSS attacks in request payloads', category: 'owasp', action: 'block', severity: 'critical' },
  { id: 'rfi-lfi', label: 'Remote/Local File Inclusion', description: 'Prevents path traversal and remote file include attempts', category: 'owasp', action: 'block', severity: 'critical' },
  { id: 'rce', label: 'Remote Code Execution', description: 'Detects OS command injection and code execution patterns', category: 'owasp', action: 'block', severity: 'critical' },
  { id: 'ssrf', label: 'Server-Side Request Forgery', description: 'Blocks requests targeting internal/metadata endpoints', category: 'owasp', action: 'block', severity: 'high' },
  { id: 'xxe', label: 'XML External Entity (XXE)', description: 'Prevents malicious XML entity expansion and data exfil', category: 'owasp', action: 'block', severity: 'high' },
  { id: 'csrf', label: 'Cross-Site Request Forgery', description: 'Validates origin and referer headers for state-changing requests', category: 'owasp', action: 'log', severity: 'medium' },
  { id: 'idor', label: 'Insecure Direct Object Ref', description: 'Detects unauthorized access patterns to object references', category: 'owasp', action: 'log', severity: 'medium' },
  { id: 'broken-auth', label: 'Broken Authentication', description: 'Detects brute force login, credential stuffing, token manipulation', category: 'owasp', action: 'block', severity: 'high' },
  { id: 'deserialization', label: 'Insecure Deserialization', description: 'Blocks serialized object injection in Java, PHP, Python, .NET', category: 'owasp', action: 'block', severity: 'critical' },
  { id: 'log4shell', label: 'Log4Shell / JNDI Injection', description: 'Detects Log4j CVE-2021-44228 and related JNDI lookup payloads', category: 'owasp', action: 'block', severity: 'critical' },
  { id: 'proto-attack', label: 'Protocol Attack', description: 'Malformed HTTP requests, header smuggling, request splitting', category: 'owasp', action: 'block', severity: 'high' },
];

const DEFAULT_BOT_RULES: WafRule[] = [
  { id: 'known-bad-bot', label: 'Known Bad Bots', description: 'Blocks bots from known malicious bot networks and scanners', category: 'bot', action: 'block', severity: 'high' },
  { id: 'scraper', label: 'Web Scrapers', description: 'Detects and blocks automated content scraping tools', category: 'bot', action: 'challenge', severity: 'medium' },
  { id: 'credential-stuffer', label: 'Credential Stuffing', description: 'Identifies and blocks automated login attempts with stolen creds', category: 'bot', action: 'block', severity: 'critical' },
  { id: 'api-abuse', label: 'API Abuse Bot', description: 'Detects automated API abuse, enumeration, and fuzzing', category: 'bot', action: 'block', severity: 'high' },
  { id: 'search-engine', label: 'Search Engine Bots', description: 'Verified crawlers (Google, Bing, etc.) — typically allowed', category: 'bot', action: 'log', severity: 'low' },
  { id: 'headless-browser', label: 'Headless Browsers', description: 'Detects Selenium, Puppeteer, Playwright automation', category: 'bot', action: 'challenge', severity: 'medium' },
];

const DEFAULT_RATE_LIMITS: RateLimitRule[] = [
  { id: 'rl-login', path: '/login', requestsPerMinute: 10, action: 'block', byField: 'ip' },
  { id: 'rl-api', path: '/api/*', requestsPerMinute: 120, action: 'throttle', byField: 'api-key' },
];

export const DEFAULT_WAF_CONFIG: WafConfig = {
  enabled: false,
  mode: 'prevention',
  owaspRules: DEFAULT_OWASP_RULES,
  botProtection: DEFAULT_BOT_RULES,
  rateLimits: DEFAULT_RATE_LIMITS,
  geoBlocking: [],
  customResponseCode: 403,
  customBlockPage: true,
  logAllRequests: false,
  apiProtection: true,
  fileUploadScanning: true,
  maxBodySize: 10,
};

/* ─── Component ────────────────────────────────────────────── */
export function WafEditor({
  config,
  onChange,
}: {
  config: WafConfig;
  onChange: (c: WafConfig) => void;
}) {
  const [expandOwasp, setExpandOwasp] = useState(false);
  const [expandBot, setExpandBot] = useState(false);
  const [expandRate, setExpandRate] = useState(false);
  const [expandGeo, setExpandGeo] = useState(false);
  const [newGeoCountries, setNewGeoCountries] = useState('');
  const [newRlPath, setNewRlPath] = useState('');
  const [newRlRpm, setNewRlRpm] = useState(60);

  const updateOwaspAction = (id: string, action: WafRule['action']) => {
    onChange({ ...config, owaspRules: config.owaspRules.map(r => r.id === id ? { ...r, action } : r) });
  };
  const updateBotAction = (id: string, action: WafRule['action']) => {
    onChange({ ...config, botProtection: config.botProtection.map(r => r.id === id ? { ...r, action } : r) });
  };
  const removeRateLimit = (id: string) => {
    onChange({ ...config, rateLimits: config.rateLimits.filter(r => r.id !== id) });
  };
  const addRateLimit = () => {
    if (!newRlPath) return;
    onChange({ ...config, rateLimits: [...config.rateLimits, { id: `rl-${Date.now()}`, path: newRlPath, requestsPerMinute: newRlRpm, action: 'throttle', byField: 'ip' }] });
    setNewRlPath('');
    setNewRlRpm(60);
  };
  const addGeoBlock = () => {
    if (!newGeoCountries.trim()) return;
    const countries = newGeoCountries.split(',').map(c => c.trim()).filter(Boolean);
    onChange({ ...config, geoBlocking: [...config.geoBlocking, { id: `geo-${Date.now()}`, countries, action: 'block' }] });
    setNewGeoCountries('');
  };
  const removeGeoBlock = (id: string) => {
    onChange({ ...config, geoBlocking: config.geoBlocking.filter(g => g.id !== id) });
  };

  const severityColor: Record<string, string> = {
    critical: 'text-red-400 bg-red-900/30 border-red-800/50',
    high: 'text-orange-400 bg-orange-900/30 border-orange-800/50',
    medium: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
    low: 'text-blue-400 bg-blue-900/30 border-blue-800/50',
  };
  const actionColor: Record<string, string> = {
    block: 'bg-red-600 text-white',
    challenge: 'bg-orange-600 text-white',
    log: 'bg-blue-600 text-white',
    off: 'bg-gray-700 text-gray-400',
    throttle: 'bg-yellow-600 text-white',
  };

  const owaspActive = config.owaspRules.filter(r => r.action !== 'off').length;
  const botActive = config.botProtection.filter(r => r.action !== 'off').length;

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-red-400" />
          <span className="text-sm font-medium">Web Application Firewall</span>
        </div>
        <button
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`w-9 h-5 rounded-full transition-colors relative ${config.enabled ? 'bg-red-600' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.enabled ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-4 pl-1">
          {/* Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Mode:</span>
            {(['detection', 'prevention'] as const).map(m => (
              <button
                key={m}
                onClick={() => onChange({ ...config, mode: m })}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  config.mode === m
                    ? m === 'prevention' ? 'bg-red-900/40 border-red-600 text-red-300' : 'bg-blue-900/40 border-blue-600 text-blue-300'
                    : 'bg-gray-800 border-gray-700 text-gray-500'
                }`}
              >
                {m.toUpperCase()}
              </button>
            ))}
            {config.mode === 'detection' && (
              <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                <AlertTriangle size={10} /> Logging only — no blocking
              </span>
            )}
          </div>

          {/* ── OWASP Rules ───────────────────────────────────── */}
          <div>
            <button onClick={() => setExpandOwasp(!expandOwasp)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandOwasp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              OWASP Top 10 + Core Rules
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 font-normal normal-case">
                {owaspActive}/{config.owaspRules.length} active
              </span>
            </button>
            {expandOwasp && (
              <div className="mt-2 space-y-1.5">
                {/* Bulk */}
                <div className="flex gap-1 mb-2">
                  {(['block', 'challenge', 'log', 'off'] as const).map(a => (
                    <button key={a} onClick={() => onChange({ ...config, owaspRules: config.owaspRules.map(r => ({ ...r, action: a })) })}
                      className="px-2 py-0.5 rounded text-[9px] bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
                      ALL {a.toUpperCase()}
                    </button>
                  ))}
                </div>
                {config.owaspRules.map(rule => (
                  <RuleRow key={rule.id} rule={rule} severityColor={severityColor} actionColor={actionColor}
                    onAction={(a) => updateOwaspAction(rule.id, a)} />
                ))}
              </div>
            )}
          </div>

          {/* ── Bot Protection ────────────────────────────────── */}
          <div>
            <button onClick={() => setExpandBot(!expandBot)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandBot ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Bot Detection & Protection
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-300 font-normal normal-case">
                {botActive}/{config.botProtection.length} active
              </span>
            </button>
            {expandBot && (
              <div className="mt-2 space-y-1.5">
                {config.botProtection.map(rule => (
                  <RuleRow key={rule.id} rule={rule} severityColor={severityColor} actionColor={actionColor}
                    onAction={(a) => updateBotAction(rule.id, a)} />
                ))}
              </div>
            )}
          </div>

          {/* ── Rate Limiting ─────────────────────────────────── */}
          <div>
            <button onClick={() => setExpandRate(!expandRate)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandRate ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Rate Limiting
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/40 text-yellow-300 font-normal normal-case">
                {config.rateLimits.length} rules
              </span>
            </button>
            {expandRate && (
              <div className="mt-2 space-y-2">
                {config.rateLimits.map(rl => (
                  <div key={rl.id} className="flex items-center gap-2 p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs overflow-x-auto">
                    <code className="text-blue-300 font-mono">{rl.path}</code>
                    <span className="text-gray-500">≤</span>
                    <span className="text-yellow-300 font-medium">{rl.requestsPerMinute}</span>
                    <span className="text-gray-500">req/min per {rl.byField}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${actionColor[rl.action]}`}>
                      {rl.action.toUpperCase()}
                    </span>
                    <button onClick={() => removeRateLimit(rl.id)} className="ml-auto text-gray-500 hover:text-red-400">×</button>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 p-2 bg-gray-900/50 border border-gray-700 border-dashed rounded-lg">
                  <input placeholder="/path/*" value={newRlPath} onChange={e => setNewRlPath(e.target.value)}
                    className="w-28 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs placeholder:text-gray-500 focus:outline-none" />
                  <input type="number" value={newRlRpm} onChange={e => setNewRlRpm(Number(e.target.value))} min={1}
                    className="w-16 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none" />
                  <span className="text-[10px] text-gray-500">req/min</span>
                  <button onClick={addRateLimit} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white transition-colors">Add</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Geo-Blocking ──────────────────────────────────── */}
          <div>
            <button onClick={() => setExpandGeo(!expandGeo)} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 w-full">
              {expandGeo ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Geo-Blocking
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-normal normal-case">
                {config.geoBlocking.length} rules
              </span>
            </button>
            {expandGeo && (
              <div className="mt-2 space-y-2">
                {config.geoBlocking.map(geo => (
                  <div key={geo.id} className="flex items-center gap-2 p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-xs overflow-x-auto">
                    <div className="flex flex-wrap gap-1 flex-1">
                      {geo.countries.map(c => (
                        <span key={c} className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">{c}</span>
                      ))}
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${actionColor[geo.action]}`}>
                      {geo.action.toUpperCase()}
                    </span>
                    <button onClick={() => removeGeoBlock(geo.id)} className="text-gray-500 hover:text-red-400">×</button>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 p-2 bg-gray-900/50 border border-gray-700 border-dashed rounded-lg">
                  <input placeholder="RU, CN, KP (comma separated)" value={newGeoCountries} onChange={e => setNewGeoCountries(e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs placeholder:text-gray-500 focus:outline-none" />
                  <button onClick={addGeoBlock} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white transition-colors">Add</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Advanced Options ───────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <div><span className="text-xs text-gray-300">API Protection</span><p className="text-[10px] text-gray-500">JSON/GraphQL body validation and schema enforcement</p></div>
              <Toggle value={config.apiProtection} onChange={v => onChange({ ...config, apiProtection: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div><span className="text-xs text-gray-300">File Upload Scanning</span><p className="text-[10px] text-gray-500">Scan uploaded files for malware, embedded scripts, polyglots</p></div>
              <Toggle value={config.fileUploadScanning} onChange={v => onChange({ ...config, fileUploadScanning: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div><span className="text-xs text-gray-300">Log All Requests</span><p className="text-[10px] text-gray-500">Log all requests (not just blocked) for threat analytics</p></div>
              <Toggle value={config.logAllRequests} onChange={v => onChange({ ...config, logAllRequests: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Max request body size (MB)</span>
              <select value={config.maxBodySize} onChange={e => onChange({ ...config, maxBodySize: Number(e.target.value) })}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none">
                {[1, 2, 5, 10, 25, 50, 100].map(s => <option key={s} value={s}>{s} MB</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Block response code</span>
              <select value={config.customResponseCode} onChange={e => onChange({ ...config, customResponseCode: Number(e.target.value) })}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs focus:outline-none">
                {[403, 429, 503].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */
function RuleRow({ rule, severityColor, actionColor, onAction }: {
  rule: WafRule;
  severityColor: Record<string, string>;
  actionColor: Record<string, string>;
  onAction: (a: WafRule['action']) => void;
}) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
      rule.action === 'off' ? 'bg-gray-800/30 border-gray-800 opacity-50' : 'bg-gray-800/50 border-gray-700'
    }`}>
      <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium border ${severityColor[rule.severity]}`}>
        {rule.severity.toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-200 truncate">{rule.label}</div>
        <div className="text-[10px] text-gray-500 truncate">{rule.description}</div>
      </div>
      <div className="flex gap-0.5 flex-shrink-0">
        {(['block', 'challenge', 'log', 'off'] as const).map(a => (
          <button key={a} onClick={() => onAction(a)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              rule.action === a ? actionColor[a] : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}>
            {a.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-gray-700'}`}>
      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'left-4' : 'left-0.5'}`} />
    </button>
  );
}
