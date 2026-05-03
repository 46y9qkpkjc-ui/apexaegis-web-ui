'use client';
import { useState } from 'react';
import { X, ExternalLink, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ItsmTicketModalProps {
  open: boolean;
  onClose: () => void;
  prefill?: {
    title?: string;
    description?: string;
    severity?: string;
    logIds?: string[];
  };
}

type Platform = 'jira' | 'servicenow';

interface TicketForm {
  platform: Platform;
  project: string;
  issueType: string;
  summary: string;
  description: string;
  priority: string;
  assignee: string;
  labels: string;
}

/* ── Demo config (would come from /settings in production) ── */
const JIRA_PROJECTS = ['SEC', 'OPS', 'INFRA', 'NET'];
const SNOW_CATEGORIES = ['Incident', 'Problem', 'Change Request', 'Service Request'];
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export function ItsmTicketModal({ open, onClose, prefill }: ItsmTicketModalProps) {
  const [form, setForm] = useState<TicketForm>({
    platform: 'jira',
    project: JIRA_PROJECTS[0],
    issueType: 'Bug',
    summary: prefill?.title ?? '',
    description: prefill?.description ?? '',
    priority: prefill?.severity
      ? prefill.severity.charAt(0).toUpperCase() + prefill.severity.slice(1)
      : 'Medium',
    assignee: '',
    labels: 'security,auto-generated',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleChange = (field: keyof TicketForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    /* Simulate API call */
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      toast.success(
        form.platform === 'jira'
          ? `Jira ticket ${form.project}-${Math.floor(1000 + Math.random() * 9000)} created`
          : `ServiceNow INC${Math.floor(100000 + Math.random() * 900000)} created`,
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold">Create Ticket</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 size={48} className="mx-auto text-green-400" />
            <p className="text-lg font-medium text-green-300">Ticket Created Successfully</p>
            <p className="text-sm text-gray-400">
              {form.platform === 'jira'
                ? 'View in Jira to assign and track progress.'
                : 'View in ServiceNow to manage the incident lifecycle.'}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => toast.info('Would open external ITSM URL')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition-colors"
              >
                <ExternalLink size={14} />
                Open in {form.platform === 'jira' ? 'Jira' : 'ServiceNow'}
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Platform selector */}
            <div className="flex gap-2">
              {(['jira', 'servicenow'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleChange('platform', p)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.platform === p
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {p === 'jira' ? 'Jira' : 'ServiceNow'}
                </button>
              ))}
            </div>

            {/* Project / Category */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {form.platform === 'jira' ? 'Project' : 'Category'}
              </label>
              <select
                value={form.project}
                onChange={e => handleChange('project', e.target.value)}
                className="input-field"
              >
                {(form.platform === 'jira' ? JIRA_PROJECTS : SNOW_CATEGORIES).map(v => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Summary</label>
              <input
                type="text"
                value={form.summary}
                onChange={e => handleChange('summary', e.target.value)}
                className="input-field"
                placeholder="Brief summary of the issue"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                className="input-field min-h-[80px] resize-y"
                placeholder="Detail the issue, affected users, timestamps…"
                rows={3}
              />
            </div>

            {/* Priority + Assignee row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => handleChange('priority', e.target.value)}
                  className="input-field"
                >
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Assignee</label>
                <input
                  type="text"
                  value={form.assignee}
                  onChange={e => handleChange('assignee', e.target.value)}
                  className="input-field"
                  placeholder="e.g. soc-team"
                />
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Labels / Tags</label>
              <input
                type="text"
                value={form.labels}
                onChange={e => handleChange('labels', e.target.value)}
                className="input-field"
                placeholder="comma-separated"
              />
            </div>

            {/* Attached log IDs */}
            {prefill?.logIds && prefill.logIds.length > 0 && (
              <div className="flex items-start gap-2 p-2.5 bg-yellow-900/20 border border-yellow-800/40 rounded-lg text-xs text-yellow-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{prefill.logIds.length} log event(s) will be attached to this ticket.</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !form.summary.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {submitting && <Loader2 size={14} className="animate-spin" />}
                {submitting ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
