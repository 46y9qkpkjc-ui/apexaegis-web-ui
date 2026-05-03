'use client';

/** Simulated AI engine that interprets natural-language commands and returns
 *  structured intents the UI can act on. In production this would call the
 *  Claude API via a backend route – the interface stays the same. */

export interface AiAction {
  type:
    | 'navigate'
    | 'create_policy'
    | 'block_domain'
    | 'show_logs'
    | 'analyze_logs'
    | 'create_ticket'
    | 'check_duplicate'
    | 'inspect_traffic'
    | 'tunnel_detection'
    | 'activity_control'
    | 'waf_config'
    | 'iap_proxy'
    | 'url_lookup'
    | 'search'
    | 'info'
    | 'error';
  payload: Record<string, unknown>;
  summary: string;
}

export interface AiConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: AiAction;
  timestamp: Date;
}

/* ─── keyword → route map ──────────────────────────────────── */
const NAV_MAP: Record<string, string> = {
  dashboard: '/',
  overview: '/',
  logs: '/logs',
  events: '/logs',
  policies: '/policies',
  'security policies': '/policies',
  addresses: '/objects/addresses',
  services: '/objects/services',
  'url categories': '/objects/url-categories',
  'cloud apps': '/objects/cloud-apps',
  'cloud applications': '/objects/cloud-apps',
  atp: '/profiles/atp',
  ssl: '/profiles/ssl',
  dns: '/profiles/dns',
  'web filter': '/profiles/web',
  users: '/identity/users',
  devices: '/identity/devices',
  'identity providers': '/identity/providers',
  gateways: '/gateways',
  certificates: '/certificates',
  settings: '/settings',
};

/* ─── intent detection (local, no API needed) ──────────────── */
export function processCommand(input: string): AiAction {
  const q = input.toLowerCase().trim();

  // ── Navigation ─────────────────────────────────────────────
  if (/^(go to|open|show|navigate to|take me to)\s+/i.test(q)) {
    const target = q.replace(/^(go to|open|show|navigate to|take me to)\s+/i, '').trim();
    for (const [key, route] of Object.entries(NAV_MAP)) {
      if (target.includes(key)) {
        return { type: 'navigate', payload: { route }, summary: `Navigating to ${key}` };
      }
    }
  }

  // ── Block domain ───────────────────────────────────────────
  const blockMatch = q.match(/block\s+(domain\s+)?([a-z0-9.-]+\.[a-z]{2,})/i);
  if (blockMatch) {
    const domain = blockMatch[2];
    return {
      type: 'block_domain',
      payload: { domain, action: 'deny', category: 'Custom Block' },
      summary: `Creating policy to block ${domain}`,
    };
  }

  // ── Create policy ──────────────────────────────────────────
  if (/create\s+(a\s+)?(new\s+)?policy/i.test(q)) {
    return {
      type: 'create_policy',
      payload: { suggestion: q },
      summary: 'Opening policy editor with AI-suggested rule',
    };
  }

  // ── Check duplicate policies ──────────────────────────────
  if (/duplicate|overlap|already exist|similar polic|conflicting polic/i.test(q)) {
    return {
      type: 'check_duplicate',
      payload: { query: q },
      summary: 'Checking for duplicate or overlapping policies',
    };
  }

  // ── Tunnel-in-tunnel detection ─────────────────────────────
  if (/tunnel|ssh over https|dns tunnel|icmp tunnel|protocol encapsulat|covert channel|tunnel.in.tunnel|deep packet|dpi|content inspection|header inspection/i.test(q)) {
    const protocols: string[] = [];
    if (/ssh/i.test(q)) protocols.push('ssh-over-https');
    if (/dns/i.test(q)) protocols.push('dns-tunnel');
    if (/icmp/i.test(q)) protocols.push('icmp-tunnel');
    if (/websocket/i.test(q)) protocols.push('websocket-tunnel');
    if (/rdp/i.test(q)) protocols.push('rdp-over-https');
    if (/vpn|ssl vpn/i.test(q)) protocols.push('ssl-vpn-tunnel');
    if (/quic|udp/i.test(q)) protocols.push('quic-tunnel');
    if (/grpc/i.test(q)) protocols.push('grpc-tunnel');
    if (/http.*connect/i.test(q)) protocols.push('http-connect-abuse');
    return {
      type: 'tunnel_detection',
      payload: { protocols, query: q, action: /block/i.test(q) ? 'block' : 'detect' },
      summary: protocols.length
        ? `Configuring tunnel detection for: ${protocols.join(', ')}`
        : 'Opening content & header inspection settings to detect tunnel-in-tunnel protocols',
    };
  }

  // ── Activity controls ──────────────────────────────────────
  if (/activit|what.*user.*can|user.*allow|restrict.*upload|block.*download|prevent.*copy|prevent.*paste|prevent.*print|prevent.*share|control.*permission|read.only/i.test(q)) {
    const activities: string[] = [];
    if (/upload/i.test(q)) activities.push('upload');
    if (/download/i.test(q)) activities.push('download');
    if (/copy|clipboard/i.test(q)) activities.push('clipboard-copy');
    if (/paste/i.test(q)) activities.push('clipboard-paste');
    if (/print/i.test(q)) activities.push('print');
    if (/share/i.test(q)) activities.push('share');
    if (/post|comment/i.test(q)) activities.push('post');
    if (/edit/i.test(q)) activities.push('edit');
    if (/delete/i.test(q)) activities.push('delete-content');
    if (/login/i.test(q)) activities.push('login');
    if (/api/i.test(q)) activities.push('api-access');
    if (/setting/i.test(q)) activities.push('admin-settings');
    return {
      type: 'activity_control',
      payload: { activities, query: q, suggestedPermission: /block|prevent|restrict|deny/i.test(q) ? 'block' : /alert|monitor/i.test(q) ? 'alert' : 'allow' },
      summary: activities.length
        ? `Configuring activity controls: ${activities.join(', ')} → ${/block|prevent/i.test(q) ? 'blocked' : 'managed'}`
        : 'Opening activity control settings to manage user permissions on allowed access',
    };
  }

  // ── WAF configuration ──────────────────────────────────────
  if (/waf|web application firewall|owasp|sql.?inject|xss|cross.site|bot protect|rate.?limit|geo.?block|brute.?force|ddos/i.test(q)) {
    const features: string[] = [];
    if (/sql|sqli/i.test(q)) features.push('sqli');
    if (/xss|cross.site.script/i.test(q)) features.push('xss');
    if (/bot/i.test(q)) features.push('bot-protection');
    if (/rate.?limit/i.test(q)) features.push('rate-limiting');
    if (/geo/i.test(q)) features.push('geo-blocking');
    if (/owasp/i.test(q)) features.push('owasp-rules');
    return {
      type: 'waf_config',
      payload: { features, query: q, mode: /block|prevent/i.test(q) ? 'prevention' : 'detection' },
      summary: features.length
        ? `Configuring WAF: ${features.join(', ')}`
        : 'Opening Web Application Firewall configuration with OWASP rules, bot protection, and rate limiting',
    };
  }

  // ── Identity-Aware Proxy ─────────────────────────────────
  if (/iap|identity.?aware|beyondcorp|zero.?trust.?proxy|reverse.?proxy|clientless|unmanaged.?device|device.?trust|access.?level|signed.?header|tcp forward|browser.?isolat/i.test(q)) {
    const aspects: string[] = [];
    if (/unmanaged|byod|device trust/i.test(q)) aspects.push('device-trust');
    if (/access.?level|context/i.test(q)) aspects.push('access-levels');
    if (/tcp|ssh|rdp/i.test(q)) aspects.push('tcp-forwarding');
    if (/browser.?isolat/i.test(q)) aspects.push('browser-isolation');
    if (/signed.?header|jwt/i.test(q)) aspects.push('signed-headers');
    return {
      type: 'iap_proxy',
      payload: { aspects, query: q },
      summary: aspects.length
        ? `Configuring Identity-Aware Proxy: ${aspects.join(', ')}`
        : 'Opening Identity-Aware Proxy — zero trust access with identity + device trust + context-aware policies',
    };
  }

  // ── Inspect traffic flow ──────────────────────────────────
  if (/inspect|traffic flow|inspection layer|where.*(drop|block)|flow.*visuali/i.test(q)) {
    return {
      type: 'inspect_traffic',
      payload: { query: q },
      summary: 'Opening traffic inspection flow visualization',
    };
  }

  // ── Analyze / troubleshoot logs ────────────────────────────
  if (/analyz|troubleshoot|investigate|diagnos|why.*(block|denied|fail)/i.test(q)) {
    return {
      type: 'analyze_logs',
      payload: { query: q },
      summary: 'Analyzing logs to identify the issue',
    };
  }

  // ── Show filtered logs ─────────────────────────────────────
  if (/show.*log|filter.*log|log.*for/i.test(q)) {
    const userMatch = q.match(/(?:for|by|user)\s+([a-z0-9_.@-]+)/i);
    const sevMatch = q.match(/(critical|high|medium|low)/i);
    return {
      type: 'show_logs',
      payload: {
        user: userMatch?.[1] ?? null,
        severity: sevMatch?.[1] ?? null,
        query: q,
      },
      summary: `Filtering logs${userMatch ? ` for ${userMatch[1]}` : ''}${sevMatch ? ` (${sevMatch[1]} severity)` : ''}`,
    };
  }

  // ── Create ITSM ticket ─────────────────────────────────────
  if (/create\s+(a\s+)?(ticket|incident|issue|jira|servicenow)/i.test(q)) {
    const platformMatch = q.match(/(jira|servicenow|service now)/i);
    const platform = platformMatch ? (platformMatch[1].toLowerCase().replace(' ', '') === 'servicenow' ? 'servicenow' : 'jira') : 'jira';
    return {
      type: 'create_ticket',
      payload: { platform, description: q },
      summary: `Creating ${platform === 'jira' ? 'Jira' : 'ServiceNow'} ticket`,
    };
  }

  // ── URL lookup ──────────────────────────────────────────────
  const urlLookupMatch = q.match(/(?:lookup|look up|check|classify|categorize|category of|what is|what's|whats)\s+(?:url\s+)?(?:for\s+)?(?:https?:\/\/)?([a-z0-9.-]+\.[a-z]{2,})/i);
  if (urlLookupMatch || (/(?:url|domain)\s+(?:lookup|look\s*up|check|categor)/i.test(q) && q.match(/([a-z0-9.-]+\.[a-z]{2,})/i))) {
    const domain = urlLookupMatch?.[1] ?? q.match(/([a-z0-9.-]+\.[a-z]{2,})/i)?.[1] ?? '';
    if (domain) {
      const result = lookupUrl(domain);
      return {
        type: 'url_lookup',
        payload: result as unknown as Record<string, unknown>,
        summary: `URL lookup for ${domain}`,
      };
    }
  }

  // ── Search ─────────────────────────────────────────────────
  if (/search|find|look up|lookup/i.test(q)) {
    return {
      type: 'search',
      payload: { query: q },
      summary: `Searching for: ${q.replace(/^(search|find|look up|lookup)\s+(for\s+)?/i, '')}`,
    };
  }

  // ── Fallback ───────────────────────────────────────────────
  return {
    type: 'info',
    payload: {},
    summary: generateHelpResponse(q),
  };
}

function generateHelpResponse(q: string): string {
  if (/help|what can you do/i.test(q)) {
    return 'I can help you: navigate pages, create/edit policies, block domains, check for duplicate policies, configure tunnel-in-tunnel detection (SSH over HTTPS, DNS tunnels, ICMP tunnels), manage activity controls (upload, download, copy, share permissions), configure WAF (OWASP rules, bot protection, rate limiting), set up Identity-Aware Proxy (zero-trust access, device trust, access levels), inspect traffic inspection layers, look up URL categories & cloud apps, analyze logs, create Jira/ServiceNow tickets, and troubleshoot security events. Just tell me what you need!';
  }
  return `I understood your request: "${q}". Try commands like "go to policies", "block domain evil.com", "lookup slack.com", "analyze critical logs", or "create a Jira ticket for this incident".`;
}

/* ═══════════════════════════════════════════════════════════════
   URL LOOKUP ENGINE
   ═══════════════════════════════════════════════════════════════ */

export interface UrlLookupResult {
  domain: string;
  categories: { name: string; action: 'allow' | 'block' | 'monitor'; confidence: number }[];
  cloudApp: { name: string; vendor: string; category: string; risk: 'low' | 'medium' | 'high'; sanctioned: boolean; domains: string[] } | null;
  relatedUrls: { domain: string; reason: string }[];
  threatLevel: 'safe' | 'caution' | 'dangerous' | 'unknown';
}

/* ─── URL category database (simulated) ──────────────────── */
interface CategoryEntry {
  category: string;
  action: 'allow' | 'block' | 'monitor';
  patterns: string[];
  sampleDomains: string[];
}

const URL_CATEGORY_DB: CategoryEntry[] = [
  { category: 'Malware', action: 'block', patterns: ['malware', 'c2', 'evil', 'botnet', 'trojan'], sampleDomains: ['malware-c2.evil.com', 'botnet-ctrl.xyz', 'trojan-drop.ru', 'darkloader.net', 'payload-host.cc'] },
  { category: 'Phishing', action: 'block', patterns: ['phishing', 'login-verify', 'account-secure', 'credential'], sampleDomains: ['phishing-login.net', 'secure-verify-account.com', 'login-microsoft-365.xyz', 'paypal-secure.cc', 'apple-id-confirm.net'] },
  { category: 'Spyware', action: 'block', patterns: ['spyware', 'spy', 'keylog', 'tracker-drop'], sampleDomains: ['spyware-drop.ru', 'keylog-collect.cc', 'spy-agent.net', 'tracker-drop.xyz'] },
  { category: 'Cryptomining', action: 'block', patterns: ['crypto-miner', 'coinhive', 'miner', 'cryptojack'], sampleDomains: ['crypto-miner.cc', 'coinhive-proxy.net', 'browser-miner.xyz', 'cryptojack.ru'] },
  { category: 'Newly Registered Domains', action: 'block', patterns: ['new-domain', 'newdomain', '-3day', '-7day'], sampleDomains: ['new-domain-3day.xyz', 'freshsite-2day.cc', 'just-registered.net', 'newdomain-today.com'] },
  { category: 'Adult Content', action: 'block', patterns: ['adult', 'xxx', 'porn'], sampleDomains: ['example-adult.com', 'content-xxx.net'] },
  { category: 'Gambling', action: 'monitor', patterns: ['bet', 'casino', 'poker', 'gambl'], sampleDomains: ['online-casino.com', 'bet365.com', 'poker-room.net', 'sports-gamble.cc'] },
  { category: 'Social Media', action: 'monitor', patterns: ['facebook', 'twitter', 'instagram', 'tiktok', 'linkedin', 'reddit', 'snapchat'], sampleDomains: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'linkedin.com', 'reddit.com'] },
  { category: 'SaaS', action: 'allow', patterns: ['slack', 'github', 'jira', 'atlassian', 'office365', 'microsoft', 'salesforce', 'zoom', 'notion'], sampleDomains: ['slack.com', 'github.com', 'jira.atlassian.com', 'outlook.office365.com', 'salesforce.com', 'zoom.us', 'notion.so'] },
  { category: 'File Sharing', action: 'monitor', patterns: ['dropbox', 'drive.google', 'box.com', 'wetransfer', 'mega.nz'], sampleDomains: ['dropbox.com', 'drive.google.com', 'box.com', 'wetransfer.com', 'mega.nz'] },
  { category: 'AI/ML', action: 'monitor', patterns: ['openai', 'chatgpt', 'claude', 'anthropic', 'bard', 'gemini', 'copilot'], sampleDomains: ['chat.openai.com', 'claude.ai', 'bard.google.com', 'copilot.microsoft.com', 'huggingface.co'] },
  { category: 'Development', action: 'allow', patterns: ['github', 'gitlab', 'bitbucket', 'stackoverflow', 'npmjs', 'pypi'], sampleDomains: ['github.com', 'gitlab.com', 'bitbucket.org', 'stackoverflow.com', 'npmjs.com', 'pypi.org'] },
  { category: 'Streaming', action: 'monitor', patterns: ['youtube', 'netflix', 'twitch', 'spotify', 'hulu', 'disney'], sampleDomains: ['youtube.com', 'netflix.com', 'twitch.tv', 'spotify.com', 'hulu.com', 'disneyplus.com'] },
  { category: 'Uncategorized', action: 'monitor', patterns: [], sampleDomains: ['unknown-saas.io', 'random-site.xyz'] },
];

/* ─── Cloud app database (simulated) ────────────────────── */
interface CloudAppEntry {
  name: string;
  vendor: string;
  category: string;
  risk: 'low' | 'medium' | 'high';
  sanctioned: boolean;
  domainPatterns: string[];
  domains: string[];
}

const CLOUD_APP_DB: CloudAppEntry[] = [
  { name: 'Microsoft 365', vendor: 'Microsoft', category: 'Productivity', risk: 'low', sanctioned: true, domainPatterns: ['office365', 'office.com', 'microsoft.com', 'outlook', 'sharepoint', 'onedrive'], domains: ['*.office365.com', '*.microsoft.com', '*.office.com', '*.sharepoint.com', '*.onedrive.com'] },
  { name: 'Slack', vendor: 'Salesforce', category: 'Collaboration', risk: 'low', sanctioned: true, domainPatterns: ['slack.com', 'slack-edge'], domains: ['*.slack.com', '*.slack-edge.com'] },
  { name: 'GitHub', vendor: 'Microsoft', category: 'Development', risk: 'low', sanctioned: true, domainPatterns: ['github.com', 'githubusercontent'], domains: ['*.github.com', '*.githubusercontent.com'] },
  { name: 'Jira', vendor: 'Atlassian', category: 'Project Management', risk: 'low', sanctioned: true, domainPatterns: ['atlassian', 'jira.com', 'jira.atlassian'], domains: ['*.atlassian.net', '*.jira.com'] },
  { name: 'Salesforce', vendor: 'Salesforce', category: 'CRM', risk: 'low', sanctioned: true, domainPatterns: ['salesforce.com', 'force.com'], domains: ['*.salesforce.com', '*.force.com'] },
  { name: 'Dropbox', vendor: 'Dropbox', category: 'File Sharing', risk: 'medium', sanctioned: false, domainPatterns: ['dropbox.com', 'dropboxapi'], domains: ['*.dropbox.com', '*.dropboxapi.com'] },
  { name: 'Google Drive', vendor: 'Google', category: 'File Sharing', risk: 'medium', sanctioned: false, domainPatterns: ['drive.google', 'googleapis'], domains: ['drive.google.com', '*.googleapis.com'] },
  { name: 'ChatGPT', vendor: 'OpenAI', category: 'AI/ML', risk: 'high', sanctioned: false, domainPatterns: ['openai.com', 'chatgpt', 'chat.openai'], domains: ['chat.openai.com', '*.openai.com'] },
  { name: 'Zoom', vendor: 'Zoom', category: 'Collaboration', risk: 'low', sanctioned: true, domainPatterns: ['zoom.us', 'zoom.com'], domains: ['*.zoom.us', '*.zoom.com'] },
  { name: 'Notion', vendor: 'Notion', category: 'Productivity', risk: 'low', sanctioned: true, domainPatterns: ['notion.so', 'notion.com'], domains: ['*.notion.so', '*.notion.com'] },
  { name: 'Google Workspace', vendor: 'Google', category: 'Productivity', risk: 'low', sanctioned: false, domainPatterns: ['google.com', 'gmail', 'docs.google', 'workspace.google'], domains: ['*.google.com', 'mail.google.com', 'docs.google.com'] },
  { name: 'YouTube', vendor: 'Google', category: 'Streaming', risk: 'medium', sanctioned: false, domainPatterns: ['youtube.com', 'youtu.be', 'ytimg'], domains: ['*.youtube.com', 'youtu.be', '*.ytimg.com'] },
  { name: 'Netflix', vendor: 'Netflix', category: 'Streaming', risk: 'medium', sanctioned: false, domainPatterns: ['netflix.com', 'nflxvideo'], domains: ['*.netflix.com', '*.nflxvideo.net'] },
  { name: 'Claude AI', vendor: 'Anthropic', category: 'AI/ML', risk: 'high', sanctioned: false, domainPatterns: ['claude.ai', 'anthropic.com'], domains: ['claude.ai', '*.anthropic.com'] },
];

export function lookupUrl(rawDomain: string): UrlLookupResult {
  const domain = rawDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');

  /* ── Match categories ────────────────────────────────────── */
  const matchedCategories: UrlLookupResult['categories'] = [];

  for (const entry of URL_CATEGORY_DB) {
    // Direct match in sample domains
    if (entry.sampleDomains.some(d => d === domain || domain.endsWith(`.${d}`) || d.endsWith(`.${domain}`))) {
      matchedCategories.push({ name: entry.category, action: entry.action, confidence: 99 });
      continue;
    }
    // Pattern match
    if (entry.patterns.some(p => domain.includes(p))) {
      matchedCategories.push({ name: entry.category, action: entry.action, confidence: 85 });
    }
  }

  if (matchedCategories.length === 0) {
    matchedCategories.push({ name: 'Uncategorized', action: 'monitor', confidence: 50 });
  }

  /* ── Match cloud app ─────────────────────────────────────── */
  let cloudApp: UrlLookupResult['cloudApp'] = null;
  for (const app of CLOUD_APP_DB) {
    if (app.domainPatterns.some(p => domain.includes(p))) {
      cloudApp = {
        name: app.name,
        vendor: app.vendor,
        category: app.category,
        risk: app.risk,
        sanctioned: app.sanctioned,
        domains: app.domains,
      };
      break;
    }
  }

  /* ── Gather related URLs ─────────────────────────────────── */
  const relatedUrls: UrlLookupResult['relatedUrls'] = [];

  // Same category
  for (const cat of matchedCategories) {
    const catEntry = URL_CATEGORY_DB.find(e => e.category === cat.name);
    if (catEntry) {
      for (const d of catEntry.sampleDomains) {
        if (d !== domain && relatedUrls.length < 8) {
          relatedUrls.push({ domain: d, reason: `Same category: ${cat.name}` });
        }
      }
    }
  }

  // Same cloud app
  if (cloudApp) {
    const appEntry = CLOUD_APP_DB.find(a => a.name === cloudApp!.name);
    if (appEntry) {
      for (const d of appEntry.domains) {
        if (!d.includes(domain) && relatedUrls.length < 12 && !relatedUrls.some(r => r.domain === d)) {
          relatedUrls.push({ domain: d, reason: `Same cloud app: ${cloudApp!.name}` });
        }
      }
    }
    // Other apps in same category
    for (const app of CLOUD_APP_DB) {
      if (app.category === cloudApp.category && app.name !== cloudApp.name && relatedUrls.length < 12) {
        relatedUrls.push({ domain: app.domains[0], reason: `Same app category: ${cloudApp.category}` });
      }
    }
  }

  /* ── Determine threat level ──────────────────────────────── */
  let threatLevel: UrlLookupResult['threatLevel'] = 'unknown';
  const blocked = matchedCategories.some(c => c.action === 'block');
  const monitored = matchedCategories.some(c => c.action === 'monitor');
  if (matchedCategories.some(c => ['Malware', 'Phishing', 'Spyware', 'Cryptomining'].includes(c.name))) {
    threatLevel = 'dangerous';
  } else if (blocked) {
    threatLevel = 'dangerous';
  } else if (monitored || (cloudApp && !cloudApp.sanctioned)) {
    threatLevel = 'caution';
  } else if (cloudApp?.sanctioned || matchedCategories.some(c => c.action === 'allow')) {
    threatLevel = 'safe';
  }

  return { domain, categories: matchedCategories, cloudApp, relatedUrls, threatLevel };
}
