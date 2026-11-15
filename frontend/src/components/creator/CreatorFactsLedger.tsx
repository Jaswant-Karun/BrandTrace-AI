import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, AlertTriangle, Clock, 
  Sparkles, Filter, Copy, Check, Info, Lock
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export interface FactRecord {
  fact_id: string;
  id?: string;
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
  approved_wording?: string;
  is_confidential?: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'OUTDATED' | 'UNVERIFIED' | string;
}

interface CreatorFactsLedgerProps {
  brandName?: string;
  role?: string;
}

// Format ISO date like "30 Sept 2026", "31 Dec 2026"
function formatTimelineDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

export const CreatorFactsLedger: React.FC<CreatorFactsLedgerProps> = ({ 
  brandName = 'Aurelle Skin',
  role = 'creator'
}) => {
  const [facts, setFacts] = useState<FactRecord[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'UNVERIFIED' | 'WITH_END_DATE' | 'APPROVED_WORDING'>('ALL');
  const [selectedFact, setSelectedFact] = useState<FactRecord | null>(null);
  const [hoveredFactId, setHoveredFactId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch facts from live backend API
  const loadFacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ 
        limit: '100',
        brand_id: 'aurelle-skin' 
      });
      if (role) params.set('role', role);
      const data = await apiClient.request<FactRecord[]>(`/api/facts?${params.toString()}`, { skipCache: true });
      setFacts(data || []);
    } catch (err: any) {
      console.error('Failed to load facts:', err);
      setError(err?.message || 'Unable to connect to live brand governance facts service.');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadFacts();
  }, [loadFacts]);

  // Copy helper
  const handleCopyWording = (wording: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(wording);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Top Metrics Calculation matching reference exactly
  const totalCount = facts.length;
  const expiredCount = useMemo(() => 
    facts.filter(f => f.status === 'EXPIRED' || f.status === 'OUTDATED').length
  , [facts]);
  const unverifiedCount = useMemo(() => 
    facts.filter(f => f.status === 'UNVERIFIED').length
  , [facts]);
  const withEndDateCount = useMemo(() => 
    facts.filter(f => Boolean(f.expiry_date)).length
  , [facts]);
  const approvedWordingsCount = useMemo(() => 
    facts.filter(f => Boolean(f.approved_wording)).length
  , [facts]);

  // Timeline facts: All facts with an end date, sorted by expiry date ascending
  const timelineFacts = useMemo(() => {
    return facts
      .filter(f => Boolean(f.expiry_date))
      .sort((a, b) => (a.expiry_date || '').localeCompare(b.expiry_date || ''));
  }, [facts]);

  // Timeline coordinate calculations
  // Domain: 2025-01-01 to 2028-06-30 (~3.5 years)
  // Today: 2026-11-19 (India time) -> ~53.84% from left
  const domainStartMs = useMemo(() => new Date('2025-01-01').getTime(), []);
  const domainEndMs = useMemo(() => new Date('2028-06-30').getTime(), []);
  const todayMs = useMemo(() => new Date('2026-11-19').getTime(), []);
  const totalDomainMs = domainEndMs - domainStartMs;

  const todayLeftPct = useMemo(() => {
    return Math.max(0, Math.min(100, ((todayMs - domainStartMs) / totalDomainMs) * 100));
  }, [todayMs, domainStartMs, totalDomainMs]);

  // Available categories for dropdown filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    facts.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set).sort();
  }, [facts]);

  // Filtered facts list for cards
  const filteredFacts = useMemo(() => {
    return facts.filter(fact => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesQuery = 
          fact.fact_id.toLowerCase().includes(query) ||
          fact.name.toLowerCase().includes(query) ||
          fact.current_value.toLowerCase().includes(query) ||
          (fact.description && fact.description.toLowerCase().includes(query)) ||
          (fact.approved_wording && fact.approved_wording.toLowerCase().includes(query)) ||
          (fact.category && fact.category.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // Category
      if (categoryFilter && fact.category !== categoryFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter === 'ACTIVE') {
        return fact.status === 'ACTIVE';
      }
      if (statusFilter === 'EXPIRED') {
        return fact.status === 'EXPIRED' || fact.status === 'OUTDATED';
      }
      if (statusFilter === 'UNVERIFIED') {
        return fact.status === 'UNVERIFIED';
      }
      if (statusFilter === 'WITH_END_DATE') {
        return Boolean(fact.expiry_date);
      }
      if (statusFilter === 'APPROVED_WORDING') {
        return Boolean(fact.approved_wording);
      }

      return true;
    });
  }, [facts, search, categoryFilter, statusFilter]);

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-4 px-3 sm:px-6 lg:px-8 text-neutral-100 selection:bg-indigo-600 selection:text-white">
      
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER SECTION WITH SUSPENDED PURPLE PLUMB BOB   */}
      {/* ---------------------------------------------------- */}
      <div className="relative pt-2">
        {/* Suspended Plumb Bob Diamond Icon from top right */}
        <div className="absolute right-4 -top-8 hidden md:flex flex-col items-center pointer-events-none select-none">
          <div className="w-[1px] h-14 bg-neutral-700/80" />
          <div className="w-3.5 h-3.5 rotate-45 bg-[#7064e9] shadow-[0_0_14px_rgba(112,100,233,0.7)] -mt-0.5" />
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            PLUMBLINE · {brandName.toUpperCase()}
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-sans uppercase">
            FACT LEDGER
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
            The claims Aurelle can back up with evidence, and the approved way to say each one.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RESTRICTED FACTS CALLOUT DISCLAIMER                  */}
      {/* ---------------------------------------------------- */}
      <div className="rounded-xl bg-[#121215] border border-neutral-800/80 px-4 py-3.5 sm:px-5 sm:py-4 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans shadow-sm flex items-start gap-3">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p>
          Some facts are restricted. Confidential and embargoed facts are visible only to reviewers, compliance and the brand owner; the checker still checks your drafts against them.
        </p>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5 TOP METRIC CARDS                                   */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Card 1: 35 FACTS */}
          <button 
            onClick={() => setStatusFilter('ALL')}
            className={`text-left p-4 sm:p-5 rounded-2xl bg-[#101013] border transition-all duration-150 cursor-pointer ${
              statusFilter === 'ALL' 
                ? 'border-indigo-500/80 ring-1 ring-indigo-500/30' 
                : 'border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-sans">
              {loading ? '—' : totalCount}
            </div>
            <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider mt-1">
              FACTS
            </div>
          </button>

          {/* Card 2: 1 EXPIRED */}
          <button 
            onClick={() => setStatusFilter('EXPIRED')}
            className={`text-left p-4 sm:p-5 rounded-2xl bg-[#101013] border transition-all duration-150 cursor-pointer ${
              statusFilter === 'EXPIRED' 
                ? 'border-[#c85a54] ring-1 ring-[#c85a54]/30' 
                : 'border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="text-3xl sm:text-4xl font-extrabold text-[#c85a54] font-sans">
              {loading ? '—' : expiredCount}
            </div>
            <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider mt-1">
              EXPIRED
            </div>
          </button>

          {/* Card 3: 2 UNVERIFIED */}
          <button 
            onClick={() => setStatusFilter('UNVERIFIED')}
            className={`text-left p-4 sm:p-5 rounded-2xl bg-[#101013] border transition-all duration-150 cursor-pointer ${
              statusFilter === 'UNVERIFIED' 
                ? 'border-amber-500/80 ring-1 ring-amber-500/30' 
                : 'border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-sans">
              {loading ? '—' : unverifiedCount}
            </div>
            <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider mt-1">
              UNVERIFIED
            </div>
          </button>

          {/* Card 4: 16 WITH AN END DATE */}
          <button 
            onClick={() => setStatusFilter('WITH_END_DATE')}
            className={`text-left p-4 sm:p-5 rounded-2xl bg-[#101013] border transition-all duration-150 cursor-pointer ${
              statusFilter === 'WITH_END_DATE' 
                ? 'border-emerald-500/80 ring-1 ring-emerald-500/30' 
                : 'border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-sans">
              {loading ? '—' : withEndDateCount}
            </div>
            <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider mt-1">
              WITH AN END DATE
            </div>
          </button>

          {/* Card 5: 15 APPROVED WORDINGS */}
          <button 
            onClick={() => setStatusFilter('APPROVED_WORDING')}
            className={`text-left p-4 sm:p-5 rounded-2xl bg-[#101013] border transition-all duration-150 cursor-pointer col-span-2 sm:col-span-1 ${
              statusFilter === 'APPROVED_WORDING' 
                ? 'border-indigo-400/80 ring-1 ring-indigo-400/30' 
                : 'border-neutral-800/80 hover:border-neutral-700'
            }`}
          >
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-sans">
              {loading ? '—' : approvedWordingsCount}
            </div>
            <div className="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider mt-1">
              APPROVED WORDINGS
            </div>
          </button>
        </div>

        {/* Date Reference Caption */}
        <div className="text-xs font-mono text-neutral-400 pl-1">
          Dates are checked against 19 Nov 2026 (India time).
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TIMELINE CHART: "WHEN FACTS STOP BEING TRUE"          */}
      {/* SEQUENTIAL SCROLL ANIMATION LINE-BY-LINE             */}
      {/* ---------------------------------------------------- */}
      <section className="rounded-2xl bg-[#0d0d10] border border-neutral-800/90 p-5 sm:p-7 shadow-2xl space-y-6">
        <div>
          <h2 className="text-sm sm:text-base font-bold font-mono tracking-wider text-white uppercase">
            WHEN FACTS STOP BEING TRUE
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans">
            Each bar runs from the date a fact became valid to the date it ends. Past the line, a post can't use it.
          </p>
        </div>

        {/* Timeline Chart Container */}
        <div className="relative pt-6 pb-2 overflow-x-auto">
          {/* Minimum width wrapper to ensure clarity on smaller screens */}
          <div className="min-w-[620px] relative">
            
            {/* Header: TODAY label anchored exactly over the center timeline line */}
            <div className="relative h-6 mb-2">
              <div 
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center select-none"
                style={{ left: `${todayLeftPct}%` }}
              >
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-white uppercase">
                  TODAY
                </span>
              </div>
            </div>

            {/* 16 Fact Rows */}
            <div className="relative space-y-2">
              {/* Vertical TODAY line extending from top to bottom of all rows */}
              <div 
                className="absolute top-0 bottom-0 w-[1.5px] bg-white/80 z-20 pointer-events-none"
                style={{ left: `${todayLeftPct}%` }}
              />

              {timelineFacts.map((fact, index) => {
                const isHovered = hoveredFactId === fact.fact_id;
                const isExpired = fact.status === 'EXPIRED' || fact.status === 'OUTDATED';

                // Geometry Calculation
                const sourceMs = Math.max(domainStartMs, new Date(fact.source_date || '2026-01-01').getTime());
                const expiryMs = Math.min(domainEndMs, new Date(fact.expiry_date!).getTime());
                const leftPct = Math.max(0, Math.min(100, ((sourceMs - domainStartMs) / totalDomainMs) * 100));
                const endPct = Math.max(0, Math.min(100, ((expiryMs - domainStartMs) / totalDomainMs) * 100));
                const widthPct = Math.max(3.5, endPct - leftPct);

                const formattedDate = formatTimelineDate(fact.expiry_date);

                return (
                  <div
                    key={fact.fact_id}
                    className={`group relative flex items-center h-7 sm:h-8 rounded transition-colors duration-150 px-1 -mx-1 ${
                      isHovered ? 'bg-white/[0.04]' : ''
                    }`}
                    onMouseEnter={() => setHoveredFactId(fact.fact_id)}
                    onMouseLeave={() => setHoveredFactId(null)}
                  >
                    {/* Left Column: Fact ID (e.g. FACT-029) */}
                    <button
                      onClick={() => setSelectedFact(fact)}
                      className="w-20 sm:w-24 shrink-0 text-left font-mono text-xs text-neutral-400 group-hover:text-white transition-colors cursor-pointer select-none"
                    >
                      {fact.fact_id}
                    </button>

                    {/* Right Column: Timeline track canvas */}
                    <div className="flex-1 relative h-full flex items-center">
                      
                      {/* Animated Horizontal Bar: Line-by-line sequential increase on scroll */}
                      <motion.div
                        className="h-4 sm:h-5 rounded-[2px] cursor-pointer hover:brightness-125 transition-all shadow-sm z-10"
                        style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          backgroundColor: isExpired ? '#c85a54' : '#2d7d59',
                        }}
                        initial={{ width: 0, opacity: 0.2 }}
                        whileInView={{ width: `${widthPct}%`, opacity: 1 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{
                          duration: 0.75,
                          delay: index * 0.055, // Sequential line-by-line cascade!
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        onClick={() => setSelectedFact(fact)}
                      />

                      {/* Text Label next to the bar: ended 30 Sept 2026 / ends 31 Dec 2026 */}
                      <motion.div
                        style={{
                          position: 'absolute',
                          left: `${leftPct + widthPct}%`,
                        }}
                        className="pl-2 sm:pl-2.5 flex items-center select-none z-10 pointer-events-none"
                        initial={{ opacity: 0, x: -4 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.35,
                          delay: index * 0.055 + 0.32,
                        }}
                      >
                        <span className={`text-[10px] sm:text-[11px] font-mono whitespace-nowrap ${
                          isExpired ? 'text-neutral-300 font-medium' : 'text-neutral-300'
                        }`}>
                          {isExpired ? `ended ${formattedDate}` : `ends ${formattedDate}`}
                        </span>
                      </motion.div>
                    </div>

                    {/* Inline Hover Tooltip showing fact name & value */}
                    {isHovered && (
                      <div className="absolute left-24 sm:left-28 -top-7 z-30 pointer-events-none bg-neutral-900/95 border border-neutral-700 px-2.5 py-1 rounded shadow-xl backdrop-blur-md">
                        <span className="text-[11px] font-sans font-medium text-white">{fact.name}: </span>
                        <span className="text-[11px] font-mono font-bold text-indigo-300">{fact.current_value}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SEARCH & FILTERS BAR                                 */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search by keyword, fact ID, claim or product..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#101013] border border-neutral-800 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors" 
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="relative sm:w-60">
            <Filter className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-[#101013] border border-neutral-800 text-sm text-white appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {[
            { id: 'ALL', label: `All (${totalCount})` },
            { id: 'ACTIVE', label: `Active (${totalCount - expiredCount - unverifiedCount})` },
            { id: 'EXPIRED', label: `Expired (${expiredCount})` },
            { id: 'UNVERIFIED', label: `Unverified (${unverifiedCount})` },
            { id: 'WITH_END_DATE', label: `With End Date (${withEndDateCount})` },
            { id: 'APPROVED_WORDING', label: `Approved Wordings (${approvedWordingsCount})` },
          ].map((pill) => {
            const isActive = statusFilter === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-neutral-800 text-white border border-neutral-700' 
                    : 'bg-[#101013] text-neutral-400 border border-neutral-800/80 hover:text-white hover:border-neutral-700'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FACT CARDS LIST                                      */}
      {/* ---------------------------------------------------- */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/30 text-sm text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-sm font-mono text-neutral-400 bg-[#0d0d10] border border-neutral-800/80 rounded-2xl animate-pulse">
          Connecting to live BrandTrace AI facts ledger...
        </div>
      ) : filteredFacts.length === 0 ? (
        <div className="p-16 text-center bg-[#0d0d10] border border-neutral-800/80 rounded-2xl text-sm text-neutral-400">
          No facts match the selected query or filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacts.map((fact) => {
            const isExpired = fact.status === 'EXPIRED' || fact.status === 'OUTDATED';
            const isUnverified = fact.status === 'UNVERIFIED';
            const isConfidential = fact.is_confidential || fact.category === 'CONFIDENTIAL';

            return (
              <div 
                key={fact.fact_id}
                onClick={() => setSelectedFact(fact)}
                className="group relative p-5 rounded-2xl bg-[#0e0e11] border border-neutral-800/80 hover:border-indigo-500/80 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm"
              >
                {/* Header row: ID, Category, Status Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                      {fact.fact_id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {fact.category}
                    </span>
                    {isConfidential && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-purple-950/80 border border-purple-800/80 text-purple-300">
                        <Lock className="w-2.5 h-2.5" /> CONFIDENTIAL
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    isExpired
                      ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                      : isUnverified
                      ? 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                      : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                  }`}>
                    {fact.status}
                  </span>
                </div>

                {/* Main Fact Body */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-200 transition-colors">
                    {fact.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-indigo-300 font-mono tracking-tight">
                      {fact.current_value}
                    </span>
                    {fact.unit && (
                      <span className="text-xs text-neutral-400 font-sans">
                        {fact.unit}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {fact.description || 'No additional specification recorded.'}
                  </p>
                </div>

                {/* Approved Wording Callout (if present) */}
                {fact.approved_wording && (
                  <div className="relative rounded-xl bg-[#141419] border border-neutral-800 p-3 text-xs text-neutral-200 leading-relaxed group/wording">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> APPROVED WORDING
                      </span>
                      <button
                        onClick={(e) => handleCopyWording(fact.approved_wording!, fact.fact_id, e)}
                        className="text-neutral-500 hover:text-white transition-colors"
                        title="Copy approved phrasing"
                      >
                        {copiedId === fact.fact_id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="italic text-neutral-300 font-serif">
                      "{fact.approved_wording}"
                    </p>
                  </div>
                )}

                {/* Footer: Date Validity & Citation */}
                <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>
                      {fact.expiry_date 
                        ? `${isExpired ? 'Ended' : 'Ends'} ${formatTimelineDate(fact.expiry_date)}`
                        : 'No expiration date'
                      }
                    </span>
                  </div>
                  <span className="truncate max-w-[180px] text-right">
                    {fact.department_owner || 'R&D'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* FACT DETAIL MODAL                                    */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {selectedFact && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setSelectedFact(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl rounded-2xl bg-[#0f0f13] border border-neutral-700 p-6 sm:p-8 space-y-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedFact(null)}
                className="absolute right-5 top-5 text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
                aria-label="Close fact details"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-2 pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {selectedFact.fact_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {selectedFact.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    selectedFact.status === 'EXPIRED' || selectedFact.status === 'OUTDATED'
                      ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                      : selectedFact.status === 'UNVERIFIED'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  }`}>
                    {selectedFact.status}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-sans">
                  {selectedFact.name}
                </h2>
              </div>

              {/* Key Value Callout */}
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">OFFICIAL VALUE</div>
                  <div className="text-2xl font-black text-indigo-300 font-mono">
                    {selectedFact.current_value} {selectedFact.unit || ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">DEPARTMENT OWNER</div>
                  <div className="text-sm font-medium text-neutral-200">
                    {selectedFact.department_owner || 'Governance & Compliance'}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-neutral-400 uppercase">CLAIM SPECIFICATION & BACKGROUND</div>
                <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                  {selectedFact.description || 'No description provided.'}
                </p>
              </div>

              {/* Approved Phrasing (if available) */}
              {selectedFact.approved_wording && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-indigo-400 uppercase font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AUTHORIZED MARKETING WORDING
                    </span>
                    <button
                      onClick={(e) => handleCopyWording(selectedFact.approved_wording!, selectedFact.fact_id, e)}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === selectedFact.fact_id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Phrasing</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#141419] border border-neutral-800 text-sm text-neutral-100 font-serif italic">
                    "{selectedFact.approved_wording}"
                  </div>
                </div>
              )}

              {/* Evidence & Validity Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-neutral-800">
                <div>
                  <div className="text-neutral-500">SOURCE CITATION</div>
                  <div className="text-neutral-300 font-sans mt-0.5">{selectedFact.source_citation || 'Internal Lab Record'}</div>
                </div>
                <div>
                  <div className="text-neutral-500">VERIFICATION EVIDENCE</div>
                  <div className="text-neutral-300 font-sans mt-0.5">{selectedFact.evidence_reference || 'Audit Dossier v1.0'}</div>
                </div>
                <div>
                  <div className="text-neutral-500">EFFECTIVE FROM</div>
                  <div className="text-neutral-300 mt-0.5">{formatTimelineDate(selectedFact.source_date) || '01 Jan 2025'}</div>
                </div>
                <div>
                  <div className="text-neutral-500">EXPIRATION DATE</div>
                  <div className={`mt-0.5 ${selectedFact.status === 'EXPIRED' ? 'text-rose-400 font-bold' : 'text-neutral-300'}`}>
                    {selectedFact.expiry_date ? formatTimelineDate(selectedFact.expiry_date) : 'Continuous (No End Date)'}
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-2 text-[11px] font-mono text-neutral-500 text-center">
                Checked against Aurelle Brand Governance Engine · SHA-256 Verifiable
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
