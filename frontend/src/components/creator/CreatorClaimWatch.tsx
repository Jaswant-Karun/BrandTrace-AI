import React from 'react';
import { Search, X, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ClaimRecord {
  claim_id: string;
  claim_text: string;
  status: string;
  severity: string;
  verification_id: string;
  submission_id?: string | null;
  related_fact_ids: string[];
  evidence_references: string[];
  explanation: string;
  created_at: number;
}

interface CreatorClaimWatchProps {
  brandName?: string;
}

export const CreatorClaimWatch: React.FC<CreatorClaimWatchProps> = ({ brandName = 'Aurelle Skin' }) => {
  const [claims, setClaims] = React.useState<ClaimRecord[]>([]);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [selectedClaim, setSelectedClaim] = React.useState<ClaimRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadClaims = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      setClaims(await apiClient.request<ClaimRecord[]>(`/api/claims?${params.toString()}`, { skipCache: true }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load persisted claims.');
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  React.useEffect(() => {
    const timer = window.setTimeout(loadClaims, 250);
    return () => window.clearTimeout(timer);
  }, [loadClaims]);

  const countByStatus = (value: string) => claims.filter((claim) => claim.status === value).length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">BRANDTRACE · {brandName.toUpperCase()}</div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">CLAIM WATCH</h1>
        <p className="text-xs sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          Claims extracted from persisted content analyses, with source verification and evidence traceability.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['CLAIMS', claims.length, 'text-white'],
          ['UNSUPPORTED', countByStatus('UNSUPPORTED'), 'text-rose-400'],
          ['CONTRADICTED', countByStatus('CONTRADICTED'), 'text-amber-400'],
          ['HUMAN REVIEW', countByStatus('NEEDS_HUMAN_REVIEW'), 'text-indigo-300'],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
            <div className={`text-2xl sm:text-4xl font-extrabold font-mono ${color}`}>{value}</div>
            <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl border border-indigo-900/70 bg-indigo-950/20 text-xs text-indigo-200">
        AI analysis does not create verified claims. Claims remain human-reviewable unless a supported evidence path establishes a stronger status.
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search extracted claims..." className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white">
          <option value="">All statuses</option>
          <option value="UNSUPPORTED">Unsupported</option>
          <option value="CONTRADICTED">Contradicted</option>
          <option value="NEEDS_HUMAN_REVIEW">Needs human review</option>
        </select>
      </div>

      {error && <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/30 text-sm text-rose-200">{error}</div>}
      {loading ? (
        <div className="p-8 text-center text-sm text-neutral-400">Loading persisted claims...</div>
      ) : claims.length === 0 ? (
        <div className="p-8 text-center bg-neutral-950 border border-neutral-800 rounded-2xl text-sm text-neutral-400">No claims have been extracted from analyses available to this workspace.</div>
      ) : (
        <div className="grid gap-3">
          {claims.map((claim) => (
            <button key={claim.claim_id} onClick={() => setSelectedClaim(claim)} className="text-left p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs font-bold text-indigo-300">{claim.claim_id}</span>
                </div>
                <span className="text-[10px] font-mono uppercase text-amber-300">{claim.status.replace(/_/g, ' ')}</span>
              </div>
              <p className="mt-3 text-sm text-white">{claim.claim_text}</p>
              <p className="mt-2 text-xs text-neutral-400">{claim.explanation}</p>
              <div className="mt-3 text-[10px] font-mono text-neutral-500">Verification: {claim.verification_id}{claim.submission_id ? ` · Submission: ${claim.submission_id}` : ''}</div>
            </button>
          ))}
        </div>
      )}

      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedClaim(null)}>
          <div className="w-full max-w-xl rounded-2xl bg-neutral-950 border border-neutral-700 p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-xs font-mono text-indigo-300">{selectedClaim.claim_id}</div><h2 className="text-xl font-bold text-white mt-1">{selectedClaim.claim_text}</h2></div>
              <button onClick={() => setSelectedClaim(null)} aria-label="Close claim details"><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <div className="text-sm text-neutral-300">{selectedClaim.explanation}</div>
            <div className="grid grid-cols-2 gap-3 text-xs text-neutral-400">
              <div>Status: <span className="text-white">{selectedClaim.status}</span></div>
              <div>Severity: <span className="text-white">{selectedClaim.severity}</span></div>
              <div>Verification: <span className="text-white">{selectedClaim.verification_id}</span></div>
              <div>Submission: <span className="text-white">{selectedClaim.submission_id || 'Not linked'}</span></div>
            </div>
            <div className="text-xs text-neutral-400">Related facts: {selectedClaim.related_fact_ids.length ? selectedClaim.related_fact_ids.join(', ') : 'None recorded'}</div>
            <div className="text-xs text-neutral-400">Evidence references: {selectedClaim.evidence_references.length ? selectedClaim.evidence_references.join(', ') : 'None recorded'}</div>
          </div>
        </div>
      )}
    </div>
  );
};
