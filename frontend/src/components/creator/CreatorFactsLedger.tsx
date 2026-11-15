import React from 'react';
import { Search, ShieldCheck, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface FactRecord {
  fact_id: string;
  brand_id: string;
  name: string;
  category: string;
  current_value: string;
  unit?: string;
  description?: string;
  source_citation?: string;
  department_owner?: string;
  last_verified?: string;
  source_date?: string;
  expiry_date?: string;
  evidence_reference?: string;
  status: string;
}

interface CreatorFactsLedgerProps {
  brandName?: string;
  role?: string;
}

export const CreatorFactsLedger: React.FC<CreatorFactsLedgerProps> = ({ brandName = 'Aurelle Skin' }) => {
  const [facts, setFacts] = React.useState<FactRecord[]>([]);
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [selectedFact, setSelectedFact] = React.useState<FactRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadFacts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search.trim()) params.set('search', search.trim());
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      setFacts(await apiClient.request<FactRecord[]>(`/api/facts?${params.toString()}`, { skipCache: true }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load facts.');
    } finally {
      setLoading(false);
    }
  }, [category, search, status]);

  React.useEffect(() => {
    const timer = window.setTimeout(loadFacts, 250);
    return () => window.clearTimeout(timer);
  }, [loadFacts]);

  const categories = [...new Set(facts.map((fact) => fact.category))].sort();
  const activeCount = facts.filter((fact) => fact.status === 'ACTIVE').length;
  const outdatedCount = facts.filter((fact) => fact.status === 'OUTDATED').length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">BRANDTRACE · {brandName.toUpperCase()}</div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">FACTS</h1>
        <p className="text-xs sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          Approved brand facts and their evidence-backed source references.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          ['VISIBLE FACTS', facts.length],
          ['ACTIVE', activeCount],
          ['OUTDATED', outdatedCount],
        ].map(([label, value]) => (
          <div key={label} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
            <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">{value}</div>
            <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fact, value, or description..." className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white">
          <option value="">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OUTDATED">Outdated</option>
          <option value="UNVERIFIED">Unverified</option>
        </select>
      </div>

      {error && <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/30 text-sm text-rose-200">{error}</div>}
      {loading ? (
        <div className="p-8 text-center text-sm text-neutral-400">Loading persisted facts...</div>
      ) : facts.length === 0 ? (
        <div className="p-8 text-center bg-neutral-950 border border-neutral-800 rounded-2xl text-sm text-neutral-400">No facts match the selected filters.</div>
      ) : (
        <div className="grid gap-3">
          {facts.map((fact) => (
            <button key={fact.fact_id} onClick={() => setSelectedFact(fact)} className="text-left p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-indigo-500 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono text-xs font-bold text-indigo-300">{fact.fact_id}</span>
                  <span className="text-[10px] uppercase text-neutral-500">{fact.category}</span>
                </div>
                <span className={`text-[10px] font-mono uppercase ${fact.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>{fact.status}</span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-white">{fact.name}</h2>
              <p className="mt-1 text-sm text-neutral-300">{fact.current_value} {fact.unit || ''}</p>
              <p className="mt-2 text-xs text-neutral-500">{fact.description || 'No description supplied.'}</p>
            </button>
          ))}
        </div>
      )}

      {selectedFact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedFact(null)}>
          <div className="w-full max-w-xl rounded-2xl bg-neutral-950 border border-neutral-700 p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-indigo-300">{selectedFact.fact_id}</div>
                <h2 className="text-xl font-bold text-white mt-1">{selectedFact.name}</h2>
              </div>
              <button onClick={() => setSelectedFact(null)} aria-label="Close fact details"><X className="w-5 h-5 text-neutral-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs text-neutral-500">VALUE</div><div className="text-white">{selectedFact.current_value} {selectedFact.unit || ''}</div></div>
              <div><div className="text-xs text-neutral-500">STATUS</div><div className="text-white">{selectedFact.status}</div></div>
              <div><div className="text-xs text-neutral-500">CATEGORY</div><div className="text-white">{selectedFact.category}</div></div>
              <div><div className="text-xs text-neutral-500">OWNER</div><div className="text-white">{selectedFact.department_owner || 'Not specified'}</div></div>
            </div>
            <p className="text-sm text-neutral-300">{selectedFact.description || 'No description supplied.'}</p>
            <div className="text-xs text-neutral-400 space-y-1">
              <div>Source: {selectedFact.source_citation || 'Not specified'}</div>
              <div>Evidence: {selectedFact.evidence_reference || 'Not specified'}</div>
              <div>Effective: {selectedFact.source_date || 'Not specified'} · Expires: {selectedFact.expiry_date || 'No expiry recorded'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
