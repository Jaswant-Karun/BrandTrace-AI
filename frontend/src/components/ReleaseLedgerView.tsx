import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Lock, CheckCircle2, Download, Search, Shield } from 'lucide-react';
import { ReleaseLedgerEntry } from '../types';

interface ReleaseLedgerViewProps {
  brandId: string;
}

export const ReleaseLedgerView: React.FC<ReleaseLedgerViewProps> = ({ brandId }) => {
  const [releases, setReleases] = useState<ReleaseLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const loadReleases = () => {
    setIsLoading(true);
    fetch(`/api/releases?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => {
        setReleases(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load releases:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadReleases();
  }, [brandId]);

  const filteredReleases = releases.filter(
    (r) =>
      r.asset_title.toLowerCase().includes(search.toLowerCase()) ||
      r.release_id.toLowerCase().includes(search.toLowerCase()) ||
      r.channel.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(releases, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `brandtrace_release_ledger_${brandId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Immutable Governance Release Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Cryptographically sealed marketing release approvals persisted in MongoDB with verifiable SHA-256 audit stamps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            disabled={releases.length === 0}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 transition-all disabled:opacity-40 shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Ledger
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search release ledger..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-xs"
          />
        </div>

        <span className="text-xs font-mono text-slate-500">
          {releases.length} Sealed Release Record(s) in Database
        </span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading ledger from MongoDB...</div>
        ) : filteredReleases.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-slate-400" />
            <div className="text-sm font-bold text-slate-900">No Releases Sealed Yet</div>
            <p className="text-xs text-slate-500 max-w-sm">
              Use the <strong>Asset Inspector</strong> tab to verify marketing copy and click <strong>Sign &amp; Seal Release</strong> to append a tamper-evident record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Release ID &amp; Timestamp</th>
                  <th className="py-3 px-4">Asset Title &amp; Channel</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4 font-mono">Cryptographic Audit Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredReleases.map((rel, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{rel.release_id}</div>
                      <div className="text-[10px] text-slate-500">{rel.timestamp_iso}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-800">{rel.asset_title}</div>
                      <div className="text-[11px] text-slate-500">{rel.channel}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">{rel.reviewer}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {rel.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-50 border border-slate-200 text-slate-800 text-[11px]">
                        <Shield className="w-3 h-3 text-slate-700" />
                        {rel.audit_stamp}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
