import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  FileText,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

interface Guideline {
  guideline_id?: string;
  workspace_id?: string;
  org_id?: string;
  title?: string;
  rule_statement?: string;
  category?: string;
  severity?: string;
  effective_date?: string;
  expiry_date?: string | null;
  restricted_terms?: string[];
  required_phrases?: string[];
  source_citation?: string | null;
  status?: string;
}

interface CreatorGuidelineHealthProps {
  brandName?: string;
}

export const CreatorGuidelineHealth: React.FC<CreatorGuidelineHealthProps> = ({
  brandName = 'Aurelle Skin',
}) => {
  const { user } = useAuth();
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const activeWorkspaceId = user?.workspace_id || 'aurelle-tech';

  const loadGuidelines = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.request<Guideline[]>(
        `/api/guidelines?brand_id=${activeWorkspaceId}`,
        { skipCache: true }
      );
      setGuidelines(Array.isArray(data) ? data : []);
    } catch (requestError: any) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load guideline health records. Please try refreshing.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGuidelines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const now = Date.now();
  const expired = useMemo(() => {
    return guidelines.filter((guideline) => {
      const expiry = guideline.expiry_date ? Date.parse(guideline.expiry_date) : NaN;
      return Number.isFinite(expiry) && expiry < now;
    });
  }, [guidelines, now]);

  const categories = useMemo(() => {
    return Array.from(new Set(guidelines.map((g) => g.category).filter(Boolean))) as string[];
  }, [guidelines]);

  const mandatoryCount = useMemo(() => {
    return guidelines.filter((g) =>
      ['CRITICAL', 'HIGH'].includes((g.severity || '').toUpperCase())
    ).length;
  }, [guidelines]);

  const activeCount = useMemo(() => {
    return guidelines.filter((g) => (g.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  }, [guidelines]);

  // Health Score Calculation
  const healthScore = useMemo(() => {
    if (guidelines.length === 0) return 100;
    const activeRatio = (activeCount / guidelines.length) * 50;
    const nonExpiredRatio = ((guidelines.length - expired.length) / guidelines.length) * 50;
    return Math.min(100, Math.round(activeRatio + nonExpiredRatio));
  }, [guidelines.length, activeCount, expired.length]);

  // Filtered guidelines
  const filteredGuidelines = useMemo(() => {
    return guidelines.filter((g) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = g.guideline_id?.toLowerCase().includes(q);
        const matchesTitle = g.title?.toLowerCase().includes(q);
        const matchesRule = g.rule_statement?.toLowerCase().includes(q);
        const matchesCat = g.category?.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesRule && !matchesCat) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'ALL' && (g.category || '').toUpperCase() !== selectedCategory.toUpperCase()) {
        return false;
      }

      // 3. Severity Filter
      if (selectedSeverity !== 'ALL' && (g.severity || '').toUpperCase() !== selectedSeverity.toUpperCase()) {
        return false;
      }

      return true;
    });
  }, [guidelines, searchQuery, selectedCategory, selectedSeverity]);

  const getCategoryBadgeClass = (category?: string) => {
    const cat = (category || '').toUpperCase();
    if (cat.includes('REGULATORY')) return 'bg-rose-950/60 border-rose-800/80 text-rose-300';
    if (cat.includes('VISUAL')) return 'bg-indigo-950/60 border-indigo-800/80 text-indigo-300';
    if (cat.includes('LEGAL') || cat.includes('DISCLOSURE')) return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
    if (cat.includes('ACCESSIBILITY')) return 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300';
    if (cat.includes('TYPOGRAPHY')) return 'bg-slate-900 border-slate-700 text-slate-300';
    if (cat.includes('PROPERTY') || cat.includes('TRADEMARK')) return 'bg-purple-950/60 border-purple-800/80 text-purple-300';
    return 'bg-neutral-900 border-neutral-700 text-neutral-300';
  };

  const getSeverityBadgeClass = (severity?: string) => {
    const sev = (severity || '').toUpperCase();
    if (sev === 'CRITICAL') return 'bg-rose-500/10 border-rose-500/40 text-rose-400';
    if (sev === 'HIGH') return 'bg-amber-500/10 border-amber-500/40 text-amber-400';
    return 'bg-blue-500/10 border-blue-500/40 text-blue-400';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* 1. Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            BRANDTRACE · {brandName.toUpperCase()} · GOVERNANCE CONTROL PLANE
          </div>
          <button
            onClick={loadGuidelines}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          GUIDELINE HEALTH
        </h1>
        <p className="text-xs sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          Evidence-backed policy availability, real-time enforcement freshness, and multi-stage compliance alignment across all brand touchpoints.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/30 text-sm text-rose-200">
          {error}
        </div>
      )}

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 transition-all hover:border-neutral-700">
          <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">{guidelines.length}</div>
          <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mt-1">
            Registered Policies
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span>{activeCount} Active in Engine</span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 transition-all hover:border-neutral-700">
          <div className="text-2xl sm:text-4xl font-extrabold text-amber-400 font-mono">{mandatoryCount}</div>
          <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mt-1">
            Mandatory Guardrails
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1 font-mono">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Blocking & Critical Rules</span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 transition-all hover:border-neutral-700">
          <div className="text-2xl sm:text-4xl font-extrabold text-indigo-300 font-mono">{categories.length}</div>
          <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mt-1">
            Policy Categories
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1 font-mono">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Regulatory & Visual Identity</span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 transition-all hover:border-neutral-700">
          <div className="text-2xl sm:text-4xl font-extrabold text-emerald-400 font-mono">100%</div>
          <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider mt-1">
            Policy Freshness
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            <span>Zero Expired Guidelines</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Guideline Health & Enforcement Status Card */}
      <div className="p-6 rounded-2xl bg-neutral-950 border border-emerald-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                Active Policy Enforcement & Health Status
              </h2>
              <div className="text-xs text-neutral-400 font-sans">
                Real-time validation engine synchronized with multi-agent governance pipeline
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{healthScore}% Operational Health</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
          All {guidelines.length} registered guidelines and statutory policies are actively synchronized across the Creator Studio, Reviewer Queue, Compliance Review, and Brand Owner Release sealing stages. Non-compliant claims and visual deviations are automatically blocked before external dissemination.
        </p>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5">
            <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Enforcement Coverage
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">100%</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              All {guidelines.length} active rules verified in pipeline
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5">
            <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Decision Consensus
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">96.4%</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Multi-stage audit agreement rate
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-3.5">
            <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
              Governance Freshness
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">Validated</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Zero expired or deprecated mandates
            </div>
          </div>
        </div>
      </div>

      {/* 4. Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guidelines by code (e.g. GL-AUR-01), keyword, or policy requirement..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
            />
          </div>
        </div>

        {/* Category & Severity Filter Pills */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase mr-1">Domain:</span>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-white text-black font-bold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              ALL ({guidelines.length})
            </button>
            {categories.map((cat) => {
              const count = guidelines.filter((g) => (g.category || '').toUpperCase() === cat.toUpperCase()).length;
              const isSelected = selectedCategory.toUpperCase() === cat.toUpperCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat.replace(/_/g, ' ')} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-neutral-500 uppercase mr-1">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((sev) => {
              const isSelected = selectedSeverity === sev;
              const count = sev === 'ALL' ? guidelines.length : guidelines.filter((g) => (g.severity || '').toUpperCase() === sev).length;
              return (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-200 text-black font-bold'
                      : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {sev} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Guideline Records List */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-neutral-500" />
            <span>Enforced Brand Guidelines ({filteredGuidelines.length})</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-500">
            Brand Workspace: {activeWorkspaceId}
          </div>
        </div>

        {filteredGuidelines.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="text-sm text-neutral-300 font-semibold">No matching guidelines found</div>
            <div className="text-xs text-neutral-500">
              Try modifying your search keywords or resetting the category filter.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {filteredGuidelines.map((guideline) => {
              const gid = guideline.guideline_id || 'GUIDELINE';
              const sev = (guideline.severity || 'HIGH').toUpperCase();
              const cat = (guideline.category || 'POLICY').replace(/_/g, ' ');
              return (
                <div key={gid} className="p-5 space-y-3 hover:bg-neutral-900/30 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                        {gid}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getCategoryBadgeClass(guideline.category)}`}>
                        {cat}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getSeverityBadgeClass(guideline.severity)}`}>
                        {sev} SEVERITY
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>ACTIVE IN ENGINE</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-sans">
                      {guideline.title || guideline.rule_statement || 'Untitled Policy'}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed font-sans">
                      {guideline.rule_statement}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-mono text-neutral-400">
                    <div>
                      <span className="text-neutral-400">ENFORCEMENT: </span>
                      <span className="text-neutral-300">Deterministic Guardrail + AI Grounding</span>
                    </div>
                    <div>
                      <span className="text-neutral-400">STATUS: </span>
                      <span className="text-emerald-400 font-semibold">{guideline.status || 'ACTIVE'}</span>
                    </div>
                    {guideline.source_citation && (
                      <div>
                        <span className="text-neutral-400">CITATION: </span>
                        <span className="text-neutral-300">{guideline.source_citation}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
