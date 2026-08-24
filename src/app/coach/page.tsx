'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineShieldExclamation, HiOutlineGlobeAlt, HiOutlineComputerDesktop, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineClock, HiOutlineCommandLine, HiOutlineDocumentText, HiOutlineChatBubbleLeftRight, HiOutlineArrowRight, HiOutlineInformationCircle, HiOutlineLockClosed, HiOutlineServerStack, HiOutlineSignal, HiOutlineWifi } from 'react-icons/hi2';
import { FiSend, FiRefreshCw } from 'react-icons/fi';

// Types
type BlockReason = 'dns_sinkhole' | 'cate_denial' | 'ssl_inspection' | 'policy_violation';

interface CoachData {
  blockReason: BlockReason;
  title: string;
  subtitle: string;
  reason: string;
  technicalDetails: string;
  riskScore: number;
  policyId: string;
  policyName: string;
  blockedResource: string;
  blockedUrl?: string;
  timestamp: string;
  userId: string;
  userName: string;
  host: string;
  ipAddress: string;
  macAddress?: string;
  domain: string;
  deviceId?: string;
  cateScore?: number;
  edrStatus?: string;
  nicSaturation?: number;
  remediationSteps: string[];
  canRequestOverride: boolean;
  overrideRequiresJustification: boolean;
  itsmTemplateId: string;
  sinkholeIp?: string;
  pepProxy?: string;
}

// Default coach data - populated via URL params or MITM injection
const DEFAULT_COACH_DATA: CoachData = {
  blockReason: 'dns_sinkhole',
  title: 'Access Blocked — Security Policy',
  subtitle: 'This resource has been blocked by ApexAegis security policy.',
  reason: 'Your request was blocked because the destination has been classified as high-risk by our threat intelligence feeds.',
  technicalDetails: 'DNS Sinkhole Active: The requested domain has been classified as a Command & Control endpoint. Your DNS query has been redirected to a safe sinkhole to prevent potential compromise.',
  riskScore: 95,
  policyId: 'POL-DNS-001',
  policyName: 'DNS Sinkhole — Malicious Domain Blocking',
  blockedResource: 'example.com',
  timestamp: new Date().toISOString(),
  userId: 'unknown',
  userName: 'unknown',
  host: 'unknown',
  ipAddress: 'unknown',
  domain: 'unknown',
  remediationSteps: [
    'If you believe this is a false positive, submit a request for domain review.',
    'Contact your IT security team for verification.',
    'Check for any recent software installations that may have triggered this block.',
  ],
  canRequestOverride: true,
  overrideRequiresJustification: true,
  itsmTemplateId: 'ITSM-SEC-OVERRIDE',
  sinkholeIp: '10.0.0.1',
  pepProxy: 'swg-proxy.apexastute.com',
};

// Reason configurations
const REASON_CONFIG: Record<BlockReason, { icon: typeof HiOutlineShieldExclamation; color: string; bgColor: string; borderColor: string }> = {
  dns_sinkhole: { icon: HiOutlineGlobeAlt, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
  cate_denial: { icon: HiOutlineComputerDesktop, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  ssl_inspection: { icon: HiOutlineLockClosed, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' },
  policy_violation: { icon: HiOutlineExclamationTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
};

export default function CoachPage() {
  const [coachData, setCoachData] = useState<CoachData>(DEFAULT_COACH_DATA);
  const [activeTab, setActiveTab] = useState<'info' | 'remediation' | 'override'>('info');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [overrideStatus, setOverrideStatus] = useState<'idle' | 'submitting' | 'submitted' | 'approved' | 'denied'>('idle');
  const [justification, setJustification] = useState('');
  const [showTechnical, setShowTechnical] = useState(false);

  // Parse URL params and MITM-injected data
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // MITM-injected parameters from DNS/HTTP interception
    const blockReason = params.get('reason') as BlockReason || 'dns_sinkhole';
    const resource = params.get('resource') || params.get('domain') || 'unknown.com';
    const url = params.get('url') || '';
    const userId = params.get('user') || params.get('uid') || 'unknown';
    const userName = params.get('name') || params.get('username') || 'unknown';
    const host = params.get('host') || params.get('hostname') || 'unknown';
    const ip = params.get('ip') || params.get('src_ip') || 'unknown';
    const mac = params.get('mac') || '';
    const deviceId = params.get('device_id') || '';
    const riskScore = parseInt(params.get('risk') || params.get('risk_score') || '50');
    const policyId = params.get('policy') || params.get('policy_id') || 'POL-GEN-001';
    const policyName = params.get('policy_name') || 'Security Policy';
    const cateScore = parseInt(params.get('cate') || params.get('cate_score') || '0');
    const sinkholeIp = params.get('sinkhole_ip') || '10.0.0.1';
    const pepProxy = params.get('pep') || params.get('pep_proxy') || '';

    if (resource !== 'unknown.com') {
      setCoachData(prev => ({
        ...prev,
        blockReason,
        blockedResource: resource,
        blockedUrl: url || undefined,
        userId,
        userName,
        host,
        ipAddress: ip,
        macAddress: mac || undefined,
        deviceId: deviceId || undefined,
        riskScore: isNaN(riskScore) ? 50 : riskScore,
        policyId,
        policyName,
        cateScore: isNaN(cateScore) ? undefined : cateScore,
        sinkholeIp,
        pepProxy: pepProxy || undefined,
        timestamp: new Date().toISOString(),
        title: blockReason === 'dns_sinkhole' ? 'Access Blocked — DNS Sinkhole' :
               blockReason === 'cate_denial' ? 'Access Denied — CATE Policy' :
               blockReason === 'ssl_inspection' ? 'Access Blocked — SSL Inspection' :
               'Access Blocked — Policy Violation',
        reason: blockReason === 'dns_sinkhole' 
          ? `The domain ${resource} has been classified as high-risk and sinkholed by ApexAegis.`
          : blockReason === 'cate_denial'
          ? `Your device posture score (${cateScore}/100) falls below the required threshold for accessing ${resource}.`
          : `Access to ${resource} has been blocked by security policy ${policyId}.`,
        technicalDetails: blockReason === 'dns_sinkhole'
          ? `DNS Sinkhole Active: Your DNS query for ${resource} was intercepted and redirected to ${sinkholeIp}. The domain is classified as malicious by threat intelligence feeds.`
          : blockReason === 'cate_denial'
          ? `CATE Denial: Device ${host} (${ip}) failed continuous adaptive trust evaluation. Score: ${cateScore}/100. Required: 60/100.`
          : `Policy ${policyId} (${policyName}) blocked access to ${resource}. Risk score: ${riskScore}/100.`,
      }));
    }
  }, []);

  const handleChat = useCallback(async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage.trim();
    setChatHistory(prev => [...prev, { role: 'user', message: userMsg }]);
    setChatMessage('');

    await new Promise(resolve => setTimeout(resolve, 800));

    let aiResponse = '';
    const lowerMsg = userMsg.toLowerCase();

    if (lowerMsg.includes('why') || lowerMsg.includes('reason')) {
      aiResponse = `Your access to ${coachData.blockedResource} was blocked because:\n\n${coachData.reason}\n\nPolicy: ${coachData.policyName} (${coachData.policyId})\nRisk Score: ${coachData.riskScore}/100`;
    } else if (lowerMsg.includes('override') || lowerMsg.includes('request') || lowerMsg.includes('exception')) {
      aiResponse = `You can request a temporary override for this block. Switch to the "Request Override" tab to submit a justification.\n\nNote: Overrides require manager approval and are time-limited. All requests are logged to the immutable audit trail.`;
    } else if (lowerMsg.includes('itsm') || lowerMsg.includes('ticket')) {
      aiResponse = `An ITSM Change Request will be automatically created when you submit an override request. The ticket will be routed to the SOC team for review.\n\nTemplate: ${coachData.itsmTemplateId}`;
    } else if (lowerMsg.includes('contact') || lowerMsg.includes('help')) {
      aiResponse = `For immediate assistance:\n\n• IT Security: security@apexastute.com\n• NOC: noc@apexastute.com\n• Emergency: +91-80-4567-8900\n\nOr submit an override request through this portal.`;
    } else {
      aiResponse = `I can help you understand this block. Try asking:\n• "Why was I blocked?"\n• "Request an override"\n• "Create an ITSM ticket"\n• "Who do I contact?"`;
    }

    setChatHistory(prev => [...prev, { role: 'ai', message: aiResponse }]);
  }, [chatMessage, coachData]);

  const handleOverrideRequest = useCallback(async () => {
    if (!justification.trim()) return;
    setOverrideStatus('submitting');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOverrideStatus('submitted');
  }, [justification]);

  const config = REASON_CONFIG[coachData.blockReason];
  const ReasonIcon = config.icon;

  return (
    <div className="min-h-screen bg-[#0a0819] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HiOutlineShieldExclamation className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">ApexAegis Security Coach</h1>
              <p className="text-[10px] text-gray-400">Intelligent guidance for security events</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-gray-500">
            <span>Session: {coachData.userId}</span>
            <span>•</span>
            <span>{new Date(coachData.timestamp).toLocaleString()}</span>
            {coachData.sinkholeIp && (
              <>
                <span>•</span>
                <span className="font-mono">Sinkhole: {coachData.sinkholeIp}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-49px)]">
        {/* Left Panel - Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Alert Banner */}
          <div className={`px-6 py-4 border-b ${config.bgColor} ${config.borderColor}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                <ReasonIcon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-1">{coachData.title}</h2>
                <p className="text-sm text-gray-300">{coachData.subtitle}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{coachData.riskScore}</div>
                <div className="text-[10px] text-gray-400">Risk Score</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/5 px-6">
            <div className="flex gap-4">
              {(['info', 'remediation', 'override'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2.5 px-1 border-b-2 text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab === 'info' ? 'Event Details' : tab === 'remediation' ? 'Remediation' : 'Request Override'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'info' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Reason */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <HiOutlineInformationCircle className="w-4 h-4 text-indigo-400" />
                    Why was I blocked?
                  </h3>
                  <p className="text-sm text-gray-300">{coachData.reason}</p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                    <div className="text-[10px] text-gray-500 mb-1">Blocked Resource</div>
                    <div className="text-sm text-white font-mono truncate">{coachData.blockedResource}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                    <div className="text-[10px] text-gray-500 mb-1">Policy</div>
                    <div className="text-sm text-white font-mono">{coachData.policyId}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                    <div className="text-[10px] text-gray-500 mb-1">User</div>
                    <div className="text-sm text-white">{coachData.userName}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-3">
                    <div className="text-[10px] text-gray-500 mb-1">Host / IP</div>
                    <div className="text-sm text-white font-mono">{coachData.host}</div>
                  </div>
                </div>

                {/* Technical Details Toggle */}
                <button
                  onClick={() => setShowTechnical(!showTechnical)}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300"
                >
                  <HiOutlineCommandLine className="w-4 h-4" />
                  {showTechnical ? 'Hide' : 'Show'} Technical Details
                </button>

                {showTechnical && (
                  <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4 font-mono text-xs text-gray-400 space-y-1">
                    <p><span className="text-gray-500">Block Reason:</span> {coachData.blockReason}</p>
                    <p><span className="text-gray-500">Policy:</span> {coachData.policyId} - {coachData.policyName}</p>
                    <p><span className="text-gray-500">Resource:</span> {coachData.blockedResource}</p>
                    {coachData.blockedUrl && <p><span className="text-gray-500">URL:</span> {coachData.blockedUrl}</p>}
                    <p><span className="text-gray-500">Source IP:</span> {coachData.ipAddress}</p>
                    {coachData.macAddress && <p><span className="text-gray-500">MAC:</span> {coachData.macAddress}</p>}
                    {coachData.deviceId && <p><span className="text-gray-500">Device ID:</span> {coachData.deviceId}</p>}
                    {coachData.cateScore !== undefined && <p><span className="text-gray-500">CATE Score:</span> {coachData.cateScore}/100</p>}
                    {coachData.sinkholeIp && <p><span className="text-gray-500">Sinkhole IP:</span> {coachData.sinkholeIp}</p>}
                    {coachData.pepProxy && <p><span className="text-gray-500">PEP Proxy:</span> {coachData.pepProxy}</p>}
                    <p><span className="text-gray-500">Risk Score:</span> {coachData.riskScore}/100</p>
                    <p><span className="text-gray-500">Timestamp:</span> {coachData.timestamp}</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'remediation' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <HiOutlineCommandLine className="w-4 h-4 text-indigo-400" />
                    Recommended Steps
                  </h3>
                  <div className="space-y-2.5">
                    {coachData.remediationSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] text-indigo-400">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-gray-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <HiOutlineExclamationTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-amber-400">Important</h4>
                      <p className="text-xs text-gray-300 mt-1">
                        Do not attempt to bypass security controls manually. Submit an override request if you need immediate access.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'override' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {overrideStatus === 'idle' && (
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <h3 className="text-xs font-semibold text-gray-300 mb-3 flex items-center gap-2">
                      <HiOutlineDocumentText className="w-4 h-4 text-indigo-400" />
                      Request Temporary Override
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Submit a justification for temporary access. An ITSM Change Request will be automatically created and routed to the SOC team.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Justification (Required)</label>
                        <textarea
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          placeholder="Explain why you need access to this resource..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 h-24 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Duration</label>
                          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500/50">
                            <option>1 Hour</option>
                            <option>4 Hours</option>
                            <option>8 Hours</option>
                            <option>24 Hours</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 mb-1 block uppercase tracking-wider">Priority</label>
                          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-indigo-500/50">
                            <option>Low - Business continuity</option>
                            <option>Medium - Deadline approaching</option>
                            <option>High - Critical business function</option>
                            <option>Emergency - Production down</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                        <div className="text-[10px] text-indigo-400 mb-1">ITSM Template</div>
                        <div className="text-xs text-white font-mono">{coachData.itsmTemplateId}</div>
                      </div>

                      <button
                        onClick={handleOverrideRequest}
                        disabled={!justification.trim()}
                        className="w-full py-2 rounded-lg bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <HiOutlineDocumentText className="w-3.5 h-3.5" />
                        Submit Override Request
                      </button>
                    </div>
                  </div>
                )}

                {overrideStatus === 'submitting' && (
                  <div className="text-center py-12">
                    <FiRefreshCw className="w-8 h-8 text-indigo-400 mx-auto mb-3 animate-spin" />
                    <h4 className="text-sm font-semibold text-white mb-1">Creating ITSM Ticket...</h4>
                    <p className="text-xs text-gray-400">Submitting to SOC team for review</p>
                  </div>
                )}

                {overrideStatus === 'submitted' && (
                  <div className="text-center py-12">
                    <HiOutlineCheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-white mb-1">Override Request Submitted</h4>
                    <p className="text-xs text-gray-400 mb-2">Your request has been routed to the SOC team.</p>
                    <p className="text-[10px] text-gray-500">Ticket ID: CR-{Date.now().toString(36).toUpperCase()}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel - AI Chat */}
        <div className="w-80 border-l border-white/5 flex flex-col">
          <div className="p-3 border-b border-white/5">
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5 text-indigo-400" />
              AI Security Coach
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">Ask about this security event</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-6">
                <HiOutlineChatBubbleLeftRight className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>Ask about this event</p>
                <div className="mt-3 space-y-1.5">
                  {['Why was I blocked?', 'Request an override', 'Create an ITSM ticket'].map(q => (
                    <button
                      key={q}
                      onClick={() => setChatMessage(q)}
                      className="block w-full text-left px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-gray-400 hover:bg-white/10 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    msg.role === 'user'
                      ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-300'
                  }`}>
                    <p className="text-xs whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask about this event..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={handleChat}
                disabled={!chatMessage.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-500 text-white text-xs hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                <FiSend className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
