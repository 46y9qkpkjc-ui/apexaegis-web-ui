'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Loader,
  BarChart3,
} from 'lucide-react';
import {
  getLogs,
  getLogsSummary,
  type IdPConfigLog,
  type LogsSummary,
  formatTimestamp,
  getProviderTypeName,
  getEventTypeInfo,
} from '@/lib/idp-logs-api';

const PROVIDER_TYPES = ['okta', 'azure_ad', 'google', 'saml', 'ldap', 'ping'];
const EVENT_TYPES = ['create', 'update', 'test', 'enable', 'disable', 'delete'];

export default function IdPLogsPage() {
  const [logs, setLogs] = useState<IdPConfigLog[]>([]);
  const [summary, setSummary] = useState<LogsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  // UI State
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Load logs and summary
  useEffect(() => {
    loadData();
  }, [providerFilter, eventTypeFilter, limit, offset]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = { limit, offset };
      if (providerFilter) filters.provider_type = providerFilter;
      if (eventTypeFilter) filters.event_type = eventTypeFilter;

      const [logsData, summaryData] = await Promise.all([
        getLogs(filters),
        getLogsSummary(),
      ]);

      setLogs(logsData);
      setSummary(summaryData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load logs';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setProviderFilter('');
    setEventTypeFilter('');
    setOffset(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 size={24} className="text-blue-400" />
          <h1 className="text-2xl font-bold text-white">IdP Configuration Logs</h1>
        </div>
      </div>

      {/* Summary Panel */}
      {summary && summary.by_provider && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.by_provider.map((provider) => (
            <div
              key={provider.provider_type}
              className="bg-gray-900 border border-gray-700 rounded-lg p-4"
            >
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                {getProviderTypeName(provider.provider_type)}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Total Events</span>
                  <span className="text-lg font-bold text-white">
                    {provider.total_events}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Successful</span>
                  <span className="text-sm font-semibold text-green-400">
                    {provider.successful_events}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Failed</span>
                  <span className="text-sm font-semibold text-red-400">
                    {provider.failed_events}
                  </span>
                </div>
                {provider.last_event && (
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-xs text-gray-500">
                      Last: {formatTimestamp(provider.last_event)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Provider Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provider Type
            </label>
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Providers</option>
              {PROVIDER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getProviderTypeName(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Event Type
            </label>
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Events</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getEventTypeInfo(type).name}
                </option>
              ))}
            </select>
          </div>

          {/* Limit Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Results Per Page
            </label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value));
                setOffset(0);
              }}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10 entries</option>
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
            </select>
          </div>
        </div>

        {(providerFilter || eventTypeFilter) && (
          <button
            onClick={handleResetFilters}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size={32} className="animate-spin text-blue-500" />
          <span className="ml-3 text-gray-300">Loading logs...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-400">Error loading logs</p>
              <p className="text-sm text-red-300 mt-1">{error}</p>
              <button
                onClick={loadData}
                className="text-sm text-red-400 hover:text-red-300 mt-2 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-400">No logs found</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const eventInfo = getEventTypeInfo(log.event_type);
                const isSuccess = log.status === 'success';

                return (
                  <tr
                    key={log.id}
                    className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-white">
                        {getProviderTypeName(log.provider_type)}
                      </div>
                      <div className="text-xs text-gray-400">{log.provider_name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded border text-xs font-medium ${eventInfo.color}`}
                      >
                        {eventInfo.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : (
                          <AlertCircle size={16} className="text-red-500" />
                        )}
                        <span
                          className={`capitalize ${
                            isSuccess ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {formatTimestamp(log.action_timestamp)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() =>
                          setExpandedLogId(isExpanded ? null : log.id)
                        }
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Expanded Log Details */}
          {expandedLogId && logs.find((l) => l.id === expandedLogId) && (
            <div className="bg-gray-800/50 border-t border-gray-700 p-4">
              {(() => {
                const log = logs.find((l) => l.id === expandedLogId);
                if (!log) return null;

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400">IdP ID</p>
                        <p className="text-sm font-mono text-gray-300 break-all">
                          {log.idp_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Action By</p>
                        <p className="text-sm text-gray-300">{log.action_by}</p>
                      </div>
                    </div>

                    {log.test_result && (
                      <div className="bg-gray-900 rounded p-3 border border-gray-700">
                        <p className="text-xs text-gray-400 mb-2">Test Result</p>
                        <p className="text-sm font-medium text-blue-400">
                          {log.test_result}
                        </p>
                      </div>
                    )}

                    {log.error_message && (
                      <div className="bg-red-900/20 rounded p-3 border border-red-800">
                        <p className="text-xs text-gray-400 mb-2">Error Message</p>
                        <p className="text-sm text-red-300 break-words">
                          {log.error_message}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">
                        Log ID: {log.id}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {offset + 1} to {Math.min(offset + limit, offset + logs.length)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={logs.length < limit}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
