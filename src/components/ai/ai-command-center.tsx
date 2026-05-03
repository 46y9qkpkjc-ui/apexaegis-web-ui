'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, X, Send, Mic, MicOff, Bot,
  ArrowRight, Shield, FileText, AlertTriangle, TicketIcon,
  Sparkles, ChevronDown, Globe, Layers, Lock, Zap, Fingerprint,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useVoiceControl } from '@/hooks/use-voice-control';
import { processCommand, type AiConversationMessage, type AiAction, type UrlLookupResult } from '@/lib/ai-engine';
import { toast } from 'sonner';
import { UrlLookupResultCard } from '@/components/ai/url-lookup-result';

/* ─── Action-result icon ──────────────────────────────────── */
function ActionIcon({ type }: { type: AiAction['type'] }) {
  switch (type) {
    case 'navigate': return <ArrowRight size={14} className="text-blue-400" />;
    case 'create_policy':
    case 'block_domain': return <Shield size={14} className="text-green-400" />;
    case 'show_logs':
    case 'analyze_logs': return <FileText size={14} className="text-yellow-400" />;
    case 'create_ticket': return <TicketIcon size={14} className="text-purple-400" />;
    case 'url_lookup': return <Globe size={14} className="text-cyan-400" />;
    case 'tunnel_detection': return <Layers size={14} className="text-purple-400" />;
    case 'activity_control': return <Lock size={14} className="text-amber-400" />;
    case 'waf_config': return <Zap size={14} className="text-red-400" />;
    case 'iap_proxy': return <Fingerprint size={14} className="text-teal-400" />;
    case 'error': return <AlertTriangle size={14} className="text-red-400" />;
    default: return <Sparkles size={14} className="text-gray-400" />;
  }
}

/* ─── Quick-action suggestions ────────────────────────────── */
const SUGGESTIONS = [
  'Show critical logs',
  'Go to policies',
  'Lookup slack.com',
  'Block SSH over HTTPS',
  'Enable WAF',
  'Setup Identity-Aware Proxy',
];

export function AiCommandCenter() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiConversationMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I\'m your ApexAegis AI assistant. Type or use voice to tell me what you need — navigate pages, create policies, analyze logs, or open tickets.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  /* ── Voice control ─────────────────────────────────────── */
  const onVoiceFinal = useCallback((text: string) => {
    setInput(text);
    /* auto-submit after brief delay so user sees it */
    setTimeout(() => handleSubmit(text), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isListening, interimTranscript, isSupported, toggleListening } =
    useVoiceControl(onVoiceFinal);

  /* ── Auto-scroll ───────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Focus input when panel opens ──────────────────────── */
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* ── Execute the resolved action ───────────────────────── */
  const executeAction = useCallback((action: AiAction) => {
    switch (action.type) {
      case 'navigate':
        router.push(action.payload.route as string);
        toast.success(action.summary);
        break;
      case 'block_domain':
        toast.success(`Policy created: block ${action.payload.domain}`);
        router.push('/policies');
        break;
      case 'create_policy':
        router.push('/policies');
        toast.info('Opening policy editor…');
        break;
      case 'show_logs':
      case 'analyze_logs':
        router.push('/logs');
        toast.info(action.summary);
        break;
      case 'create_ticket':
        toast.success(action.summary);
        break;
      case 'url_lookup':
        toast.info(action.summary);
        break;
      case 'tunnel_detection':
        router.push('/policies');
        toast.success(action.summary);
        break;
      case 'activity_control':
        router.push('/policies');
        toast.success(action.summary);
        break;
      case 'waf_config':
        router.push('/policies');
        toast.success(action.summary);
        break;
      case 'iap_proxy':
        router.push('/policies');
        toast.success(action.summary);
        break;
      case 'search':
        toast.info(action.summary);
        break;
      default:
        break;
    }
  }, [router]);

  /* ── Submit handler ────────────────────────────────────── */
  const handleSubmit = useCallback((overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || processing) return;

    const userMsg: AiConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setProcessing(true);

    /* Simulate slight delay for realism */
    setTimeout(() => {
      const action = processCommand(text);
      const assistantMsg: AiConversationMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: action.summary,
        action,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setProcessing(false);
      executeAction(action);
    }, 600);
  }, [input, processing, executeAction]);

  /* ── Keyboard shortcut (Ctrl+K to toggle) ──────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* ── Floating trigger button ──────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all',
          'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white',
          open && 'scale-0 pointer-events-none',
        )}
      >
        <Bot size={20} />
        <span className="text-sm font-medium">AI Assistant</span>
        <kbd className="hidden sm:inline-flex ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded">Ctrl K</kbd>
      </button>

      {/* ── Panel ────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[600px] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-slidein">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-blue-600/10 to-indigo-600/10">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-blue-400" />
              <span className="font-semibold text-sm">ApexAegis AI</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">Claude</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-800 rounded transition-colors">
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[280px]">
            {messages.map(msg => (
              <div key={msg.id} className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={clsx(
                    'max-w-[85%] px-3 py-2 rounded-xl text-sm',
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-200 rounded-bl-sm',
                  )}
                >
                  {msg.content}
                  {msg.action && msg.action.type !== 'info' && msg.action.type !== 'url_lookup' && (
                    <div className="mt-1.5 flex items-center gap-1.5 pt-1.5 border-t border-white/10 text-xs opacity-80">
                      <ActionIcon type={msg.action.type} />
                      <span>{msg.action.type.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
                {msg.action?.type === 'url_lookup' && msg.action.payload && (
                  <div className="max-w-[95%] mt-1">
                    <UrlLookupResultCard result={msg.action.payload as unknown as UrlLookupResult} />
                  </div>
                )}
              </div>
            ))}

            {processing && (
              <div className="flex justify-start">
                <div className="bg-gray-800 px-4 py-2 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {isListening && interimTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-xl text-sm bg-blue-600/40 text-blue-200 rounded-br-sm italic">
                  {interimTranscript}…
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-4 pb-2">
            <div className="flex gap-1.5 flex-wrap">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); handleSubmit(s); }}
                  className="px-2 py-1 text-[11px] rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-gray-800">
            <form
              onSubmit={e => { e.preventDefault(); handleSubmit(); }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={isListening ? interimTranscript || input : input}
                onChange={e => setInput(e.target.value)}
                placeholder={isListening ? 'Listening…' : 'Type a command or ask…'}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
                disabled={processing}
              />

              {/* Voice button */}
              {isSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isListening
                      ? 'bg-red-500/20 text-red-400 animate-pulse'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700',
                  )}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}

              {/* Send */}
              <button
                type="submit"
                disabled={processing || (!input.trim() && !isListening)}
                className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
