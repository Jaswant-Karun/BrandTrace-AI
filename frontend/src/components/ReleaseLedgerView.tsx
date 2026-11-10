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
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Immutable Governance Release Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Cryptographically sealed marketing release approvals persisted in MongoDB with verifiable SHA-256 audit stamps.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportJson}
            disabled={releases.length === 0}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all disabled:opacity-40"
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">
          {releases.length} Sealed Release Record(s) in Database
        </span>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading ledger from MongoDB...</div>
        ) : filteredReleases.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <FileSpreadsheet className="w-8 h-8 text-slate-400" />
            <div className="text-sm font-bold text-white">No Releases Sealed Yet</div>
            <p className="text-xs text-slate-400 max-w-sm">
              Use the <strong>Asset Inspector</strong> tab to verify marketing copy and click <strong>Sign & Seal Release</strong> to append a tamper-evident record.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Release ID & Timestamp</th>
                  <th className="py-3 px-4">Asset Title & Channel</th>
                  <th className="py-3 px-4">Reviewer</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4 font-mono">Cryptographic Audit Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredReleases.map((rel, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{rel.release_id}</div>
                      <div className="text-[10px] text-slate-400">{rel.timestamp_iso}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-200">{rel.asset_title}</div>
                      <div className="text-[11px] text-brand-400">{rel.channel}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">{rel.reviewer}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {rel.decision}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-brand-300 text-[11px]">
                        <Shield className="w-3 h-3 text-brand-400" />
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
