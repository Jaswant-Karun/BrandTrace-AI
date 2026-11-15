import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Search } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface RuleItem {
  code: string;
  title: string;
  citation: string;
  type: 'BRAND' | 'MANDATORY';
  engine: 'A - code' | 'B - AI judgement' | 'C - not run';
  pattern: string;
  severity: 'ADVISORY' | 'BLOCKING';
  owner: 'brand' | 'compliance';
  linterWarning?: string;
}

interface CreatorRulebookProps {
  brandName?: string;
}

export const CreatorRulebook: React.FC<CreatorRulebookProps> = ({
  brandName = 'Aurelle Skin',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [allRules, setAllRules] = useState<RuleItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  React.useEffect(() => {
    apiClient.request<any[]>('/api/guidelines?brand_id=aurelle-tech', { skipCache: true })
      .then((data) => {
        setAllRules(data.map((g) => ({
            code: g.guideline_id || 'GL-LIVE',
            title: g.title || g.rule_statement || 'Brand Guideline',
            citation: g.source_citation || `Brand Guidelines - ${g.category || 'POLICY'}`,
            type: g.severity === 'CRITICAL' || g.severity === 'HIGH' ? 'MANDATORY' : 'BRAND',
            engine: 'C - not run',
            pattern: g.rule_statement || 'policy',
            severity: g.severity === 'CRITICAL' || g.severity === 'HIGH' ? 'BLOCKING' : 'ADVISORY',
            owner: g.category === 'REGULATORY' ? 'compliance' : 'brand',
            linterWarning: g.status ? `Status: ${g.status}` : undefined,
          })));
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load guidelines.'));
  }, []);

  const filteredRules = allRules.filter((r) => {
    const matchesSearch =
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.citation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });
  const mandatoryCount = allRules.filter((rule) => rule.type === 'MANDATORY').length;
  const brandCount = allRules.filter((rule) => rule.type === 'BRAND').length;
  const warningCount = allRules.filter((rule) => rule.engine === 'C - not run').length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          BRANDTRACE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          RULEBOOK
        </h1>
        <p className="text-xs sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
            Authoritative brand guidelines currently available to the checker.
        </p>
      </div>

        {loadError && (
          <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/30 text-sm text-rose-200">
            {loadError}
          </div>
        )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-1">
          <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">{allRules.length}</div>
          <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">RULES</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-1">
          <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">{mandatoryCount}</div>
          <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">MANDATORY</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-1">
          <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">{brandCount}</div>
          <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">BRAND</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-1">
          <div className="text-2xl sm:text-4xl font-extrabold text-amber-400 font-mono">{warningCount}</div>
          <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">LINTER WARNINGS</div>
        </div>
      </div>

      <p className="text-xs font-mono text-neutral-400 leading-relaxed">
        Live guideline records. Mandatory rules are determined by their persisted severity; unavailable guideline data is not replaced with seed content.
      </p>

      {/* Rules Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rule or citation..."
              className="w-full pl-9 pr-3.5 py-2.5 sm:py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs font-mono text-neutral-500">
            Showing {filteredRules.length} rules
          </span>
        </div>

        <div className="bg-neutral-950 border border-neutral-800/90 rounded-2xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-neutral-800/80">
            {filteredRules.length === 0 && !loadError && (
              <div className="p-6 text-sm text-neutral-400">No persisted guidelines are available for this brand.</div>
            )}
            {filteredRules.map((rule, idx) => (
              <motion.div
                key={rule.code}
                initial={shouldReduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18, delay: shouldReduceMotion ? 0 : Math.min(idx * 0.02, 0.2) }}
                className="p-4 sm:p-5 hover:bg-neutral-900/60 hover:border-l-2 hover:border-blue-500 transition-all duration-150 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className="font-mono font-bold text-xs text-neutral-300 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 shrink-0">
                      {rule.code}
                    </span>
                    <span className="text-sm font-sans font-semibold text-white break-words">
                      {rule.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                        rule.type === 'MANDATORY'
                          ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                          : 'bg-neutral-900 border border-neutral-700 text-neutral-300'
                      }`}
                    >
                      {rule.type}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">
                      ● {rule.engine}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400">
                      {rule.pattern}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        rule.severity === 'BLOCKING'
                          ? 'bg-rose-900/80 text-rose-200 border border-rose-700'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      {rule.severity}
                    </span>

                    <span className="text-[10px] font-mono text-neutral-500">
                      {rule.owner}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-sans text-neutral-500">
                  {rule.citation}
                </div>

                {rule.linterWarning && (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[11px] font-mono flex items-center gap-2 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{rule.linterWarning}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
