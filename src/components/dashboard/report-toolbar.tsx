'use client';
import React, { useState } from 'react';
import { clsx } from 'clsx';
import { FileBarChart, Download, Mail, X } from 'lucide-react';
import { emailReport } from '@/lib/tenants-api';

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}

// ReportToolbar: "Generate Report" opens a preview; from there Download PDF
// (browser print-to-PDF) or Send Email Report (via SES). buildBody composes the
// report text from the page's current data.
export function ReportToolbar({ title, buildBody }: { title: string; buildBody: () => string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');

  function generate() {
    setBody(buildBody());
    setStatus('');
    setOpen(true);
  }

  function downloadPdf() {
    const w = window.open('', '_blank', 'width=800,height=900');
    if (!w) { setStatus('Pop-up blocked — allow pop-ups to download the PDF.'); return; }
    w.document.write(
      `<html><head><title>${escapeHtml(title)}</title>` +
      `<style>body{font-family:ui-sans-serif,system-ui,sans-serif;padding:32px;white-space:pre-wrap;font-size:13px;line-height:1.5;color:#111}h1{font-size:18px}</style>` +
      `</head><body><h1>${escapeHtml(title)}</h1>${escapeHtml(body)}</body></html>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }

  async function sendEmail() {
    if (!to.trim()) { setStatus('Enter a recipient email.'); return; }
    setStatus('Sending…');
    try {
      await emailReport({ to: to.trim(), subject: title, body });
      setStatus(`Report emailed to ${to.trim()}.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Failed to email report.');
    }
  }

  return (
    <>
      <button
        onClick={generate}
        className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm px-3 py-1.5 rounded-lg transition-colors"
      >
        <FileBarChart size={15} className="text-cyan-400" /> Generate Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-[640px] max-w-[92vw] max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="font-semibold flex items-center gap-2"><FileBarChart size={16} className="text-cyan-400" /> {title}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs text-gray-300 whitespace-pre-wrap font-mono">{body}</pre>
            <div className="border-t border-gray-800 p-3 space-y-2">
              {status && <div className="text-xs text-cyan-400">{status}</div>}
              <div className="flex items-center gap-2">
                <input
                  value={to} onChange={e => setTo(e.target.value)} placeholder="recipient@example.com"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:border-cyan-500/50 outline-none"
                />
                <button onClick={sendEmail} className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-3 py-1.5 rounded-lg">
                  <Mail size={14} /> Email Report
                </button>
                <button onClick={downloadPdf} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm px-3 py-1.5 rounded-lg">
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
