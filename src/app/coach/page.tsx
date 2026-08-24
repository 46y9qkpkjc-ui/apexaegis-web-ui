'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineShieldExclamation, HiOutlineGlobeAlt, HiOutlineComputerDesktop, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineClock, HiOutlineCommandLine, HiOutlineDocumentText, HiOutlineChatBubbleLeftRight, HiOutlineArrowRight, HiOutlineInformationCircle } from 'react-icons/hi2';
import { FiSend, FiExternalLink, FiRefreshCw } from 'react-icons/fi';

// Types
type CoachPageType = 'dns_sinkhole' | 'cate_denial' | 'generic_block';

interface CoachData {
  type: CoachPageType;
  title: string;
  subtitle: string;
  reason: string;
  riskScore: number;
  policyId: string;
  policyName: string;
  blockedResource: string;
  timestamp: string;
  userId: string;
  userName: string;
  host: string;
  ipAddress: string;
  domain: string;
  remediationSteps: string[];
  canRequestAccess: boolean;
  canAcknowledge: boolean;
  itsmTemplateId: string;
}

// Mock data for different scenarios
const MOCK_COACH_DATA: Record<CoachPageType, CoachData> = {
  dns_sinkhole: {
    type: 'dns_sinkhole',
    title: 'Access Blocked — High-Risk Domain',
    subtitle: 'This domain has been identified as high-risk and has been sinkholed by ApexAegis security policy.',
    reason: 'DNS Sinkhole Active: The requested domain (malware-c2.evil.com) has been classified as a Command & Control endpoint by threat intelligence feeds. Your DNS query has been redirected to a safe sinkhole to prevent potential compromise.',
    riskScore: 95,
    policyId: 'POL-DNS-001',
    policyName: 'DNS Sinkhole — Malicious Domain Blocking',
    blockedResource: 'malware-c2.evil.com',
    timestamp: new Date().toISOString(),
    userId: 'user_2847',
    userName: 'priya.sharma@apexastute.com',
    host: 'dev-box-linux-wsl',
    ipAddress: '10.14.2.88',
    domain: 'apexastute.com',
    remediationSteps: [
      'If you believe this is a false positive, submit a request for domain review.',
      'Contact your IT security team for verification.',
      'Check for any recent software installations that may have triggered this block.',
      'Ensure your endpoint protection is up to date.',
    ],
    canRequestAccess: true,
    canAcknowledge: true,
    itsmTemplateId: 'ITSM-DNS-REVIEW',
  },
  cate_denial: {
    type: 'cate_denial',
    title: 'Access Denied — CATE Policy Violation',
    subtitle: 'Your session has been denied based on Continuous Adaptive Trust Evaluation (CATE) scoring.',
    reason: 'CATE Denial: Your device posture score (23/100) falls below the required threshold (60/100) for accessing this resource. Multiple security controls are in a non-compliant state: EDR sensor inactive, OS patches 45 days stale, BitLocker encryption unverified.',
    riskScore: 78,
    policyId: 'POL-CATE-003',
    policyName: 'CATE Threshold — Device Hygiene Minimum',
    blockedResource: 'internal-sharepoint.apexastute.com',
    timestamp: new Date().toISOString(),
    userId: 'user_1029',
    userName: 'james.wong@apexastute.com',
    host: 'macbook-pro-jw',
    ipAddress: '172.16.5.23',
    domain: 'apexastute.com',
    remediationSteps: [
      'Restart your device to re-initialize the EDR sensor.',
      'Check for and install pending OS updates.',
      'Verify BitLocker encryption status in System Settings.',
      'Re-run the device compliance check after completing the above steps.',
      'Contact IT support if the issue persists after remediation.',
    ],
    canRequestAccess: true,
    canAcknowledge: true,
    itsmTemplateId: 'ITSM-CATE-REMEDIATE',
  },
  generic_block: {
    type: 'generic_block',
    title: 'Access Restricted',
    subtitle: 'Your access to this resource has been restricted by security policy.',
    reason: 'Your current session does not meet the required security posture for this resource. Please follow the remediation steps below or contact your IT administrator.',
    riskScore: 50,
    policyId: 'POL-GEN-001',
    policyName: 'General Access Policy',
    blockedResource: 'restricted-resource.apexastute.com',
    timestamp: new Date().toISOString(),
    userId: 'user_0000',
    userName: 'unknown',
    host: 'unknown',
    ipAddress: 'unknown',
    domain: 'unknown',
    remediationSteps: [
      'Verify your identity through multi-factor authentication.',
      'Ensure your device meets the minimum security requirements.',
      'Contact your IT administrator for access.',
    ],
    canRequestAccess: true,
    canAcknowledge: true,
    itsmTemplateId: 'ITSM-GEN-REVIEW',
  },
};

export default function CoachPage() {
  const [coachData, setCoachData] = useState<CoachData>(MOCK_COACH_DATA.dns_sinkhole);
  const [activeTab, setActiveTab] = useState<'info' | 'remediation' | 'request' | 'itsm'>('info');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [acknowledged, setAcknowledged] = useState(false);

  // Simulate URL params for different scenarios
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') as CoachPageType;
    if (type && MOCK_COACH_DATA[type]) {
      setCoachData(MOCK_COACH_DATA[type]);
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
      aiResponse = `Your access was blocked because:\n\n${coachData.reason}\n\nRisk Score: ${coachData.riskScore}/100\nPolicy: ${coachData.policyName} (${coachData.policyId})`;
    } else if (lowerMsg.includes('remediate') || lowerMsg.includes('fix') || lowerMsg.includes('resolve')) {
      aiResponse = `To resolve this issue:\n\n${coachData.remediationSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nAfter completing these steps, you can request access through the ITSM portal.`;
    } else if (lowerMsg.includes('itsm') || lowerMsg.includes('ticket') || lowerMsg.includes('request')) {
      aiResponse = `I can help you submit an ITSM Change Request. Switch to the "Submit ITSM Request" tab to create a ticket with:\n\n• Template: ${coachData.itsmTemplateId}\n• Priority: Computed based on context\n• Severity: Based on user & business impact\n• Affected CI: ${coachData.blockedResource}\n\nWould you like me to pre-fill the request?`;
    } else if (lowerMsg.includes('contact') || lowerMsg.includes('admin') || lowerMsg.includes('help')) {
      aiResponse = `You can contact:\n\n• IT Security Team: security@apexastute.com\n• NOC: noc@apexastute.com\n• Emergency Hotline: +91-80-4567-8900\n\nOr submit an ITSM request for faster resolution.`;
    } else {
      aiResponse = `I can help you understand this block and get back online. Try asking:\n• "Why was I blocked?"\n• "How do I fix this?"\n• "Submit an ITSM request"\n• "Who do I contact?"`;
    }

    setChatHistory(prev => [...prev, { role: 'ai', message: aiResponse }]);
  }, [chatMessage, coachData]);

  const handleSubmitITSM = useCallback(async () => {
    setIsSubmitting(true);
    setRequestStatus('submitting');
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRequestStatus('submitted');
    setIsSubmitting(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0819] text-white">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <HiOutlineShieldExclamation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">ApexAegis Security Coach</h1>
              <p className="text-xs text-gray-400">Intelligent guidance for security events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Session ID: {coachData.userId}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{new Date(coachData.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Alert Banner */}
          <div className={`px-6 py-4 border-b ${
            coachData.type === 'dns_sinkhole'
              ? 'bg-red-500/10 border-red-500/20'
              : coachData.type === 'cate_denial'
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                coachData.type === 'dns_sinkhole'
                  ? 'bg-red-500/20'
                  : coachData.type === 'cate_denial'
                  ? 'bg-amber-500/20'
                  : 'bg-white/10'
              }`}>
                {coachData.type === 'dns_sinkhole' ? (
                  <HiOutlineGlobeAlt className="w-6 h-6 text-red-400" />
                ) : coachData.type === 'cate_denial' ? (
                  <HiOutlineComputerDesktop className="w-6 h-6 text-amber-400" />
                ) : (
                  <HiOutlineExclamationTriangle className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">{coachData.title}</h2>
                <p className="text-sm text-gray-300">{coachData.subtitle}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{coachData.riskScore}</div>
                <div className="text-xs text-gray-400">Risk Score</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/5 px-6">
            <div className="flex gap-4">
              {(['info', 'remediation', 'request', 'itsm'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab === 'info' ? 'Event Details' : tab === 'remediation' ? 'Remediation Steps' : tab === 'request' ? 'Request Access' : 'Submit ITSM Request'}
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
                className="space-y-6"
              >
                {/* Reason */}
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <HiOutlineInformationCircle className="w-4 h-4 text-indigo-400" />
                    Why was I blocked?
                  </h3>
                  <p className="text-sm text-gray-300">{coachData.reason}</p>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Policy Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Policy ID</span>
                        <span className="text-white font-mono">{coachData.policyId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Policy Name</span>
                        <span className="text-white">{coachData.policyName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Blocked Resource</span>
                        <span className="text-white font-mono">{coachData.blockedResource}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Session Context</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">User</span>
                        <span className="text-white">{coachData.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Host</span>
                        <span className="text-white font-mono">{coachData.host}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">IP Address</span>
                        <span className="text-white font-mono">{coachData.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acknowledgement */}
                {coachData.canAcknowledge && (
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Acknowledge This Event</h4>
                        <p className="text-xs text-gray-400 mt-1">I understand why this event was triggered and will take appropriate action.</p>
                      </div>
                      <button
                        onClick={() => setAcknowledged(!acknowledged)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          acknowledged
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {acknowledged ? 'Acknowledged' : 'Acknowledge'}
                      </button>
                    </div>
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
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <HiOutlineCommandLine className="w-4 h-4 text-indigo-400" />
                    Recommended Remediation Steps
                  </h3>
                  <div className="space-y-3">
                    {coachData.remediationSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-indigo-400">{idx + 1}</span>
                        </div>
                        <p className="text-sm text-gray-300">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <HiOutlineExclamationTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-400">Important Note</h4>
                      <p className="text-xs text-gray-300 mt-1">
                        If you are unable to remediate the issue yourself, please submit an ITSM request or contact your IT administrator. 
                        Do not attempt to bypass security controls manually.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'request' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3">Request Temporary Access</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    If you need immediate access to this resource, you can request a temporary exception. 
                    This will be routed to your manager and IT security team for approval.
                  </p>
                  
                  {requestStatus === 'idle' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Justification</label>
                        <textarea
                          placeholder="Explain why you need access (required for ITSM ticket)..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 h-24 resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Duration</label>
                          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50">
                            <option>1 Hour</option>
                            <option>4 Hours</option>
                            <option>8 Hours</option>
                            <option>24 Hours</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                          <select className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/50">
                            <option>Low - Business continuity</option>
                            <option>Medium - Deadline approaching</option>
                            <option>High - Critical business function</option>
                            <option>Emergency - Production down</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => setRequestStatus('submitted')}
                        className="w-full py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        Submit Access Request
                      </button>
                    </div>
                  )}

                  {requestStatus === 'submitted' && (
                    <div className="text-center py-8">
                      <HiOutlineCheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-white mb-1">Request Submitted</h4>
                      <p className="text-sm text-gray-400">Your request has been routed to your manager and IT security team.</p>
                      <p className="text-xs text-gray-500 mt-2">Ticket ID: REQ-{Date.now().toString(36).toUpperCase()}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'itsm' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <HiOutlineDocumentText className="w-4 h-4 text-indigo-400" />
                    Submit ITSM Change Request
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Create a formal ITSM ticket with AI-computed priority and severity based on context, user impact, business impact, and affected Configuration Items (CIs).
                  </p>

                  {requestStatus === 'idle' && (
                    <div className="space-y-4">
                      {/* AI-Computed Fields */}
                      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-4">
                        <h4 className="text-xs font-semibold text-indigo-400 mb-3">AI-Computed Ticket Metrics</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Priority</p>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-medium">P2 - High</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Business function impacted</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Severity</p>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-medium">S2 - Critical</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Security policy violation</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Impact</p>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30 text-sm font-medium">1 User</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Individual contributor</p>
                          </div>
                        </div>
                      </div>

                      {/* Affected CIs */}
                      <div>
                        <label className="text-xs text-gray-400 mb-2 block">Affected Configuration Items (CIs)</label>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 flex items-center gap-2">
                            <HiOutlineGlobeAlt className="w-4 h-4 text-red-400" />
                            {coachData.blockedResource}
                            <span className="text-xs text-red-400">(Blocked)</span>
                          </span>
                          <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 flex items-center gap-2">
                            <HiOutlineComputerDesktop className="w-4 h-4 text-amber-400" />
                            {coachData.host}
                            <span className="text-xs text-amber-400">(Non-compliant)</span>
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Description</label>
                        <textarea
                          defaultValue={`${coachData.type === 'dns_sinkhole' ? 'DNS Sinkhole' : 'CATE Denial'} event triggered for ${coachData.userName} on ${coachData.host}. ${coachData.reason}`}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 h-24 resize-none"
                        />
                      </div>

                      {/* Template */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Template: <span className="text-white font-mono">{coachData.itsmTemplateId}</span></span>
                        <span>•</span>
                        <span>Auto-assigned to: <span className="text-white">SOC Team</span></span>
                      </div>

                      <button
                        onClick={handleSubmitITSM}
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                            Submitting to ITSM...
                          </>
                        ) : (
                          <>
                            <HiOutlineArrowRight className="w-4 h-4" />
                            Submit ITSM Change Request
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {requestStatus === 'submitted' && (
                    <div className="text-center py-8">
                      <HiOutlineCheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-white mb-1">ITSM Ticket Created</h4>
                      <p className="text-sm text-gray-400 mb-2">Your Change Request has been submitted successfully.</p>
                      <p className="text-xs text-gray-500">Ticket ID: CR-{Date.now().toString(36).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-1">Template: {coachData.itsmTemplateId}</p>
                      <button
                        onClick={() => setRequestStatus('idle')}
                        className="mt-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Panel - AI Chat */}
        <div className="w-96 border-l border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HiOutlineChatBubbleLeftRight className="w-4 h-4 text-indigo-400" />
              AI Security Coach
            </h3>
            <p className="text-xs text-gray-400 mt-1">Ask about this security event</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                <HiOutlineChatBubbleLeftRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Ask about this security event</p>
                <div className="mt-4 space-y-2">
                  {['Why was I blocked?', 'How do I fix this?', 'Submit an ITSM request', 'Who do I contact?'].map(q => (
                    <button
                      key={q}
                      onClick={() => setChatMessage(q)}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:bg-white/10 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-300'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask about this security event..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={handleChat}
                disabled={!chatMessage.trim()}
                className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
