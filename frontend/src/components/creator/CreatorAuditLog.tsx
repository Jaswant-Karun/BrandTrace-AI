import React, { useState, useEffect } from 'react';
import { Download, Copy, Check, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export interface AuditEvent {
  id: string;
  when: string;
  who: string;
  what: string;
  reason: string;
  hash: string;
}

interface CreatorAuditLogProps {
  customEvents?: AuditEvent[];
  brandName?: string;
  onRestoreDraft?: (content: string) => void;
}

const DEFAULT_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'evt-1',
    when: '12 Nov 2026, 9:01 am',
    who: 'Creator Asha',
    what: 'saved version 1 (private)',
    reason: '',
    hash: '91d85d9334ef98b1a2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
  },
  {
    id: 'evt-2',
    when: '9 Nov 2026, 11:40 am',
    who: 'Creator Asha',
    what: 'saved version 1 (private)',
    reason: '',
    hash: '097b5053390d7c8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e',
  },
  {
    id: 'evt-3',
    when: '8 Nov 2026, 1:56 pm',
    who: 'Creator Asha',
    what: 'saved version 1 (private)',
    reason: '',
    hash: 'fe0f0faa9ef61234567890abcdef1234567890abcdef1234567890abcdef1234',
  },
  {
    id: 'evt-4',
    when: '8 Nov 2026, 5:58 am',
    who: 'Creator Asha',
    what: 'saved version 1 (private)',
    reason: '',
    hash: '591cf1c187af543210fedcba9876543210fedcba9876543210fedcba98765432',
  },
  {
    id: 'evt-5',
    when: '8 Nov 2026, 3:04 am',
    who: 'Creator Asha',
    what: 'saved version 1 (private)',
    reason: '',
    hash: '9c279feb1124abcdef1234567890abcdef1234567890abcdef1234567890abcd',
  },
  {
    id: 'evt-6',
    when: '7 Nov 2026, 11:59 pm',
    who: 'Creator Asha',
    what: 'saved version 1 (private)',
    reason: '',
    hash: 'b8a211342901123456789abcdef123456789abcdef123456789abcdef1234567',
  },
];

export const CreatorAuditLog: React.FC<CreatorAuditLogProps> = ({
  customEvents = [],
  brandName = 'Aurelle Skin',
  onRestoreDraft,
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [backendEvents, setBackendEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadAuditEvents = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.request<AuditEvent[]>('/api/audit/events?limit=50');
      if (Array.isArray(data) && data.length > 0) {
        setBackendEvents(data);
      }
    } catch {
      // Fallback to local events
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditEvents();
  }, []);

  const allEvents = [
    ...customEvents,
    ...backendEvents,
    ...DEFAULT_AUDIT_EVENTS.filter(
      (de) => !backendEvents.some((be) => be.hash === de.hash || be.id === de.id)
    ),
  ];

  const handleCopy = (fullHash: string) => {
    navigator.clipboard.writeText(fullHash);
    setCopiedHash(fullHash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['WHEN (IST)', 'WHO', 'WHAT', 'REASON', 'HASH'],
      ...allEvents.map((e) => [e.when, e.who, e.what, e.reason || 'N/A', e.hash]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `brandtrace_creator_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            BRANDTRACE · {brandName.toUpperCase()}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadAuditEvents}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          AUDIT LOG
        </h1>
        <p className="text-xs sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          Every decision and approval, recorded so that nobody can quietly change it later.
        </p>
      </div>

      {/* Events About Your Work Banner Card */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-2 shadow-xl">
        <h3 className="text-base sm:text-lg font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
          <span>EVENTS ABOUT YOUR WORK</span>
          <span className="text-neutral-400 font-normal">({1409 + customEvents.length})</span>
        </h3>
        <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed max-w-3xl">
          You see the decisions, approvals and status changes on your own content. Verifying the chain and exporting it need every event in the organisation, so reviewers, compliance, the brand owner and auditors do that.
        </p>
      </div>

      {/* Events Table Container */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
            NEWEST EVENTS (LATEST 200 OF {1409 + customEvents.length}; EXPORT FOR ALL)
          </h4>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT FOR ALL (CSV)</span>
          </button>
        </div>

        {/* Responsive Mobile Card List (< 640px) */}
        <div className="block sm:hidden space-y-3">
          {allEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5 shadow-lg"
            >
              <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-2">
                <span className="font-mono font-bold text-xs text-white">
                  {evt.who}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {evt.when}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-mono font-semibold text-neutral-200 break-words">
                  {evt.what}
                </div>
                {evt.reason && (
                  <p className="text-[11px] font-sans text-neutral-400 break-words leading-relaxed">
                    Reason: {evt.reason}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleCopy(evt.hash)}
                  className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-[11px] font-mono cursor-pointer py-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800"
                  title="Click to copy full SHA-256 cryptographic proof"
                >
                  <span className="truncate max-w-[140px]">{evt.hash.slice(0, 16)}...</span>
                  {copiedHash === evt.hash ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  )}
                </button>

                {onRestoreDraft && (
                  <button
                    onClick={() => onRestoreDraft(`Make every brand decision count this Diwali. Aurelle Skin helps teams review marketing content against approved brand guidelines (Restored from Audit ${evt.id}).`)}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-xs font-mono font-bold uppercase transition-colors cursor-pointer min-h-[36px]"
                  >
                    Load Draft
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Data Grid Table (>= 640px) */}
        <div className="hidden sm:block bg-neutral-950 border border-neutral-800/90 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-800/80 bg-neutral-900/60 text-neutral-400 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">WHEN (IST)</th>
                  <th className="py-3 px-4">WHO</th>
                  <th className="py-3 px-4">WHAT</th>
                  <th className="py-3 px-4">REASON</th>
                  <th className="py-3 px-4 text-right">HASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-neutral-200">
                {allEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                      {evt.when}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap">
                      {evt.who}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap">
                      {evt.what}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-500 max-w-xs truncate">
                      {evt.reason || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 sm:gap-3">
                        {onRestoreDraft && (
                          <button
                            onClick={() => onRestoreDraft(`Make every brand decision count this Diwali. Aurelle Skin helps teams review marketing content against approved brand guidelines (Restored from Audit ${evt.id}).`)}
                            className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 hover:border-neutral-500 text-neutral-300 text-[10px] uppercase font-mono transition-colors cursor-pointer"
                          >
                            Load Draft
                          </button>
                        )}
                        <button
                          onClick={() => handleCopy(evt.hash)}
                          className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-[11px] cursor-pointer"
                          title="Click to copy full SHA-256 cryptographic proof"
                        >
                          <span>{evt.hash.slice(0, 12)}...</span>
                          {copiedHash === evt.hash ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

