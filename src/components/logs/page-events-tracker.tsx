'use client';
import { useState } from 'react';
import { Eye, Clock, MousePointerClick, FileDown, Copy, ExternalLink, X, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

/* ─── Types ─────────────────────────────────────────────────── */
export interface PageEvent {
  id: string;
  timestamp: string;
  user: string;
  eventType: 'page_view' | 'file_download' | 'copy_paste' | 'form_submit' | 'print' | 'screenshot' | 'upload' | 'external_link';
  destination: string;
  pageTitle: string;
  details: string;
  risk: 'high' | 'medium' | 'low' | 'none';
  duration?: number; // seconds on page
  bytesTransferred?: number;
}

const EVENT_ICONS: Record<PageEvent['eventType'], typeof Eye> = {
  page_view: Eye,
  file_download: FileDown,
  copy_paste: Copy,
  form_submit: MousePointerClick,
  print: FileDown,
  screenshot: Eye,
  upload: FileDown,
  external_link: ExternalLink,
};

const EVENT_LABELS: Record<PageEvent['eventType'], string> = {
  page_view: 'Page View',
  file_download: 'File Download',
  copy_paste: 'Copy / Paste',
  form_submit: 'Form Submit',
  print: 'Print',
  screenshot: 'Screenshot',
  upload: 'File Upload',
  external_link: 'External Link',
};

const RISK_STYLE: Record<string, string> = {
  high: 'bg-red-900/30 text-red-400 border-red-800',
  medium: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
  low: 'bg-blue-900/30 text-blue-400 border-blue-800',
  none: 'bg-gray-800 text-gray-400 border-gray-700',
};

/* ─── Demo Data ─────────────────────────────────────────────── */
const DEMO_PAGE_EVENTS: PageEvent[] = [
  { id: 'pe1', timestamp: '2026-03-10 14:35:12', user: 'jdoe@acme.com', eventType: 'page_view', destination: 'salesforce.com/reports/Q1-revenue', pageTitle: 'Q1 Revenue Dashboard', details: 'Viewed financial report page', risk: 'low', duration: 145 },
  { id: 'pe2', timestamp: '2026-03-10 14:34:08', user: 'jdoe@acme.com', eventType: 'file_download', destination: 'salesforce.com/reports/Q1-revenue.xlsx', pageTitle: 'Q1 Revenue Dashboard', details: 'Downloaded Q1-revenue.xlsx (2.3 MB)', risk: 'medium', bytesTransferred: 2411724 },
  { id: 'pe3', timestamp: '2026-03-10 14:33:55', user: 'alice@acme.com', eventType: 'copy_paste', destination: 'docs.google.com/spreadsheets/d/secret-budget', pageTitle: 'FY2026 Budget Plan', details: 'Copied 847 cells containing financial data', risk: 'high' },
  { id: 'pe4', timestamp: '2026-03-10 14:33:20', user: 'bob@acme.com', eventType: 'upload', destination: 'dropbox.com/upload', pageTitle: 'Dropbox Upload', details: 'Uploaded design-spec-v3.pdf (14.7 MB) to personal Dropbox', risk: 'high', bytesTransferred: 15414681 },
  { id: 'pe5', timestamp: '2026-03-10 14:32:45', user: 'charlie@acme.com', eventType: 'form_submit', destination: 'github.com/acme-corp/internal-api/issues/new', pageTitle: 'New Issue', details: 'Submitted form with code snippet containing API key', risk: 'high' },
  { id: 'pe6', timestamp: '2026-03-10 14:32:10', user: 'eve@acme.com', eventType: 'page_view', destination: 'outlook.office365.com/mail', pageTitle: 'Outlook Mail', details: 'Viewed email inbox', risk: 'none', duration: 320 },
  { id: 'pe7', timestamp: '2026-03-10 14:31:40', user: 'dave@acme.com', eventType: 'print', destination: 'confluence.acme.com/display/SEC/incident-response', pageTitle: 'Incident Response Playbook', details: 'Printed 23-page internal security document', risk: 'medium' },
  { id: 'pe8', timestamp: '2026-03-10 14:31:15', user: 'frank@acme.com', eventType: 'external_link', destination: 'pastebin.com/raw/x9k2m', pageTitle: 'External Paste', details: 'Navigated from internal wiki to external pastebin', risk: 'high' },
  { id: 'pe9', timestamp: '2026-03-10 14:30:55', user: 'alice@acme.com', eventType: 'screenshot', destination: 'hr.acme.com/payroll/salaries', pageTitle: 'Payroll Data', details: 'Screenshot captured on sensitive HR page', risk: 'high' },
  { id: 'pe10', timestamp: '2026-03-10 14:30:30', user: 'bob@acme.com', eventType: 'page_view', destination: 'slack.com/acme/channel/engineering', pageTitle: 'Slack - Engineering', details: 'Viewed Slack channel', risk: 'none', duration: 890 },
];

/* ─── Component ─────────────────────────────────────────────── */
interface PageEventsTrackerProps {
  onClose: () => void;
}

export function PageEventsTracker({ onClose }: PageEventsTrackerProps) {
  const [events] = useState<PageEvent[]>(DEMO_PAGE_EVENTS);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = events.filter(e => {
    if (typeFilter !== 'all' && e.eventType !== typeFilter) return false;
    if (riskFilter !== 'all' && e.risk !== riskFilter) return false;
    return true;
  });

  const highRiskCount = events.filter(e => e.risk === 'high').length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/30">
        <div className="flex items-center gap-3">
          <Eye size={18} className="text-cyan-400" />
          <div>
            <h3 className="text-sm font-semibold">Page Activity Events</h3>
            <p className="text-xs text-gray-500">User actions on accessed web pages — downloads, copy/paste, uploads, prints</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {highRiskCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-red-900/30 text-red-400 text-xs font-medium border border-red-800">
              {highRiskCount} High Risk
            </span>
          )}
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded text-gray-400">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800/50">
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="pl-3 pr-8 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs appearance-none focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="page_view">Page View</option>
            <option value="file_download">Download</option>
            <option value="copy_paste">Copy/Paste</option>
            <option value="upload">Upload</option>
            <option value="form_submit">Form Submit</option>
            <option value="print">Print</option>
            <option value="screenshot">Screenshot</option>
            <option value="external_link">External Link</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="pl-3 pr-8 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs appearance-none focus:outline-none"
          >
            <option value="all">All Risk</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="none">None</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        </div>
        <span className="ml-auto text-xs text-gray-500">{filtered.length} events</span>
      </div>

      {/* Events list */}
      <div className="divide-y divide-gray-800/40 max-h-[400px] overflow-y-auto">
        {filtered.map(evt => {
          const Icon = EVENT_ICONS[evt.eventType];
          const expanded = expandedId === evt.id;
          return (
            <div
              key={evt.id}
              className={clsx('px-4 py-2.5 hover:bg-gray-800/20 transition-colors cursor-pointer', expanded && 'bg-gray-800/30')}
              onClick={() => setExpandedId(expanded ? null : evt.id)}
            >
              <div className="flex items-center gap-3">
                <Icon size={14} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500 font-mono w-32 shrink-0">{evt.timestamp.split(' ')[1]}</span>
                <span className="text-xs text-gray-300 w-28 shrink-0 truncate">{evt.user.split('@')[0]}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 shrink-0">
                  {EVENT_LABELS[evt.eventType]}
                </span>
                <span className="text-xs text-gray-400 truncate flex-1">{evt.destination}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border shrink-0 ${RISK_STYLE[evt.risk]}`}>
                  {evt.risk.toUpperCase()}
                </span>
                {expanded ? <ChevronDown size={12} className="text-gray-500" /> : <ChevronRight size={12} className="text-gray-500" />}
              </div>
              {expanded && (
                <div className="mt-2 ml-7 pl-4 border-l border-gray-700 space-y-1">
                  <p className="text-xs text-gray-400"><span className="text-gray-500">Page:</span> {evt.pageTitle}</p>
                  <p className="text-xs text-gray-400"><span className="text-gray-500">Detail:</span> {evt.details}</p>
                  {evt.duration && <p className="text-xs text-gray-400"><span className="text-gray-500">Time on page:</span> {Math.floor(evt.duration / 60)}m {evt.duration % 60}s</p>}
                  {evt.bytesTransferred && <p className="text-xs text-gray-400"><span className="text-gray-500">Transfer size:</span> {(evt.bytesTransferred / 1048576).toFixed(1)} MB</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
