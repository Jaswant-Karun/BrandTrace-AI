import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  RefreshCw, 
  X
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export interface GuidelineHealthItem {
  rule_id: string;
  rule_title: string;
  rule_description: string;
  category: string;
  flags: number;
  upheld: number;
  overruled: number;
  dismissed: number;
  agreement_rate: number;
  lower_bound: number;
  upper_bound: number;
  status: string;
  ready_to_block: boolean;
  unclear: boolean;
}

export interface GuidelineHealthResponse {
  brand_id: string;
  summary_status: string;
  summary_description: string;
  ready_threshold: number;
  confidence_level: number;
  total_flags: number;
  total_upheld: number;
  total_overruled: number;
  rules_with_decisions: number;
  items: GuidelineHealthItem[];
}

interface CreatorGuidelineHealthProps {
  brandName?: string;
}

export const CreatorGuidelineHealth: React.FC<CreatorGuidelineHealthProps> = ({
  brandName = 'Aurelle Skin',
}) => {
  const [healthData, setHealthData] = useState<GuidelineHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<GuidelineHealthItem | null>(null);
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);

  // Load guideline health from live backend API
  const loadGuidelineHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.request<GuidelineHealthResponse>(
        '/api/guidelines/health?brand_id=aurelle-skin',
        { skipCache: true }
      );
      setHealthData(data);
    } catch (err: any) {
      console.error('Failed to load guideline health:', err);
      setError(err?.message || 'Unable to load guideline health records.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGuidelineHealth();
  }, [loadGuidelineHealth]);

  const items = healthData?.items || [];

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-4 px-3 sm:px-6 lg:px-8 text-neutral-100 selection:bg-indigo-600 selection:text-white">
      
      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER SECTION WITH SUSPENDED PURPLE PLUMB BOB */}
      {/* ---------------------------------------------------- */}
      <div className="relative pt-2">
        {/* Suspended Plumb Bob Diamond Icon from top right */}
        <div className="absolute right-4 -top-8 hidden md:flex flex-col items-center pointer-events-none select-none">
          <div className="w-[1px] h-14 bg-neutral-700/80" />
          <div className="w-3.5 h-3.5 rotate-45 bg-[#7064e9] shadow-[0_0_14px_rgba(112,100,233,0.7)] -mt-0.5" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              PLUMBLINE · {brandName.toUpperCase()}
            </div>
            <button
              onClick={loadGuidelineHealth}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-sans uppercase">
            GUIDELINE HEALTH
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
            How often reviewers agree with each rule. A rule they keep overruling is probably worded unclearly.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/30 text-sm text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. STATUS BANNER: "NO RULE LOOKS UNCLEAR YET"         */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-[#34d399]">
          {healthData?.summary_status || 'NO RULE LOOKS UNCLEAR YET'}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed max-w-4xl">
          {healthData?.summary_description || 
            'Your submitted drafts only. Private pre-checks never count. Accepted fixes and upholds count as agreeing; overrules and dismissals as disagreeing. The lower bound is a 95% Wilson bound: we are 95% sure agreement is at least that high. A brand rule is ready to block once its lower bound reaches 80%; a rule may be unclear once we are 95% sure reviewers disagree at least a quarter of the time. Under 10 decisions is too few to say either.'}
        </p>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. CHART: "HOW OFTEN REVIEWERS AGREE WITH EACH RULE" */}
      {/* ---------------------------------------------------- */}
      <section className="rounded-2xl bg-[#0d0d10] border border-neutral-800/90 p-5 sm:p-7 shadow-2xl space-y-6">
        <div>
          <h2 className="text-sm sm:text-base font-bold font-mono tracking-wider text-white uppercase">
            HOW OFTEN REVIEWERS AGREE WITH EACH RULE
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans">
            Dot: share of decisions that agreed. Line: the range we are 95% sure it lies in. A brand rule is ready to block once the whole range is right of the plumb line.
          </p>
        </div>

        {/* Chart Canvas */}
        <div className="relative pt-6 pb-2 overflow-x-auto">
          <div className="min-w-[620px] relative">

            {/* Header: READY TO BLOCK · 80% plumb line indicator */}
            <div className="relative h-6 mb-2">
              <div 
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center select-none"
                style={{ left: '80%' }}
              >
                <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
                  READY TO BLOCK · 80%
                </span>
              </div>
            </div>

            {/* Rules Rows */}
            <div className="relative space-y-3">
              {/* Vertical Plumb Line at 80% extending through all rows */}
              <div 
                className="absolute top-0 bottom-6 w-[1.5px] bg-white/70 z-20 pointer-events-none"
                style={{ left: '80%' }}
              />
              {/* Plumb Bob Diamond at bottom of plumb line */}
              <div 
                className="absolute bottom-5 w-2 h-2 rotate-45 bg-neutral-300 -translate-x-1/2 z-20 pointer-events-none"
                style={{ left: '80%' }}
              />

              {isLoading ? (
                <div className="py-12 text-center text-xs font-mono text-neutral-500 animate-pulse">
                  Computing Wilson score intervals and reviewer agreement...
                </div>
              ) : items.map((rule, index) => {
                const agreementPct = Math.round(rule.agreement_rate * 100);
                const lowerBoundPct = Math.round(rule.lower_bound * 100);
                const upperBoundPct = Math.round(rule.upper_bound * 100);
                const lineWidthPct = Math.max(2, upperBoundPct - lowerBoundPct);
                const isHovered = hoveredRuleId === rule.rule_id;

                return (
                  <div
                    key={rule.rule_id}
                    className={`group relative flex items-center h-10 sm:h-11 rounded transition-colors duration-150 px-2 -mx-2 cursor-pointer ${
                      isHovered ? 'bg-white/[0.03]' : ''
                    }`}
                    onMouseEnter={() => setHoveredRuleId(rule.rule_id)}
                    onMouseLeave={() => setHoveredRuleId(null)}
                    onClick={() => setSelectedRule(rule)}
                  >
                    {/* Left Column: Rule ID & short description */}
                    <div className="w-56 sm:w-72 shrink-0 pr-4 select-none">
                      <div className="font-mono text-xs font-bold text-neutral-300 group-hover:text-white transition-colors">
                        {rule.rule_id}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-sans truncate">
                        {rule.rule_description}
                      </div>
                    </div>

                    {/* Center Column: Interactive Interval Chart Track */}
                    <div className="flex-1 relative h-full flex items-center pr-4">
                      
                      {/* Wilson 95% Confidence Interval Line */}
                      <motion.div
                        className="h-[2px] sm:h-[2.5px] bg-[#6366f1]/90 rounded-full z-10"
                        style={{
                          position: 'absolute',
                          left: `${lowerBoundPct}%`,
                          width: `${lineWidthPct}%`,
                        }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        whileInView={{ scaleX: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.06,
                          ease: 'easeOut',
                        }}
                      />

                      {/* Agreement Dot: Share of decisions that agreed */}
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-[#818cf8] border-2 border-[#0d0d10] -translate-x-1/2 z-10 shadow-[0_0_8px_rgba(129,140,248,0.9)]"
                        style={{
                          position: 'absolute',
                          left: `${agreementPct}%`,
                        }}
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.35,
                          delay: index * 0.06 + 0.3,
                        }}
                      />
                    </div>

                    {/* Right Column: Percentage Agreement Value */}
                    <div className="w-12 sm:w-14 shrink-0 text-right font-mono text-xs font-bold text-neutral-300 select-none">
                      {agreementPct}%
                    </div>
                  </div>
                );
              })}

              {/* Bottom Horizontal Axis Labels: 0%, 50%, 100% */}
              <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-mono text-neutral-400 select-none px-2">
                <span className="w-56 sm:w-72 shrink-0"></span>
                <div className="flex-1 relative flex items-center justify-between pr-4">
                  <span>0%</span>
                  <span className="absolute left-1/2 -translate-x-1/2">50%</span>
                  <span>100%</span>
                </div>
                <span className="w-12 sm:w-14 shrink-0"></span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-neutral-400 pt-1">
          Rules with at least one decision. The table below has the same numbers.
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. TABLE: RULES WITH DECISIONS                       */}
      {/* ---------------------------------------------------- */}
      <section className="rounded-2xl bg-[#0d0d10] border border-neutral-800/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-[#0e0e12] text-[10px] sm:text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">RULE</th>
                <th className="py-3 px-3 font-semibold text-center">FLAGS</th>
                <th className="py-3 px-3 font-semibold text-center">UPHELD</th>
                <th className="py-3 px-3 font-semibold text-center">OVERRULED</th>
                <th className="py-3 px-3 font-semibold text-center">DISMISSED</th>
                <th className="py-3 px-3 font-semibold text-center">AGREEMENT</th>
                <th className="py-3 px-3 font-semibold text-center">LOWER BOUND</th>
                <th className="py-3 px-4 font-semibold text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-xs font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    Loading guideline metrics...
                  </td>
                </tr>
              ) : items.map((rule) => {
                const agreementPct = Math.round(rule.agreement_rate * 100);
                const lowerBoundPct = Math.round(rule.lower_bound * 100);

                return (
                  <tr 
                    key={rule.rule_id}
                    onClick={() => setSelectedRule(rule)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    {/* RULE Column */}
                    <td className="py-3.5 px-4 font-sans text-neutral-200">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-400 shrink-0">
                          {rule.rule_id}
                        </span>
                        <span className="text-xs text-neutral-300 group-hover:text-white transition-colors">
                          {rule.rule_description}
                        </span>
                      </div>
                    </td>

                    {/* FLAGS Column */}
                    <td className="py-3.5 px-3 text-center text-neutral-300">
                      {rule.flags}
                    </td>

                    {/* UPHELD Column */}
                    <td className="py-3.5 px-3 text-center text-emerald-400 font-bold">
                      {rule.upheld}
                    </td>

                    {/* OVERRULED Column */}
                    <td className={`py-3.5 px-3 text-center ${rule.overruled > 0 ? 'text-[#c85a54] font-bold' : 'text-neutral-500'}`}>
                      {rule.overruled}
                    </td>

                    {/* DISMISSED Column */}
                    <td className="py-3.5 px-3 text-center text-neutral-500">
                      {rule.dismissed}
                    </td>

                    {/* AGREEMENT Column */}
                    <td className="py-3.5 px-3 text-center font-bold text-neutral-200">
                      {agreementPct}%
                    </td>

                    {/* LOWER BOUND Column */}
                    <td className="py-3.5 px-3 text-center text-neutral-400">
                      {lowerBoundPct}%
                    </td>

                    {/* STATUS Column */}
                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                        rule.status === 'READY TO BLOCK'
                          ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                          : rule.status === 'UNCLEAR'
                          ? 'bg-rose-950/70 border-rose-800 text-rose-300'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}>
                        {rule.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 5. RULE HEALTH DETAIL MODAL                          */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {selectedRule && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setSelectedRule(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl rounded-2xl bg-[#0f0f13] border border-neutral-700 p-6 sm:p-7 space-y-6 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedRule(null)}
                className="absolute right-5 top-5 text-neutral-400 hover:text-white p-1 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors"
                aria-label="Close rule health details"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="space-y-1.5 pr-8">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {selectedRule.rule_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {selectedRule.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-900 border border-neutral-800 text-neutral-300">
                    {selectedRule.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white font-sans">
                  {selectedRule.rule_title}
                </h3>
              </div>

              {/* Full Rule Statement */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
                {selectedRule.rule_description}
              </div>

              {/* Decision Counts Grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xl font-black text-white font-mono">{selectedRule.flags}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase mt-0.5">FLAGS</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xl font-black text-emerald-400 font-mono">{selectedRule.upheld}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase mt-0.5">UPHELD</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xl font-black text-[#c85a54] font-mono">{selectedRule.overruled}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase mt-0.5">OVERRULED</div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xl font-black text-neutral-400 font-mono">{selectedRule.dismissed}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase mt-0.5">DISMISSED</div>
                </div>
              </div>

              {/* Statistical Metrics */}
              <div className="space-y-2 p-4 rounded-xl bg-[#141419] border border-neutral-800 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">REVIEWER AGREEMENT:</span>
                  <span className="font-bold text-white">{Math.round(selectedRule.agreement_rate * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">95% WILSON LOWER BOUND:</span>
                  <span className="text-indigo-300 font-bold">{Math.round(selectedRule.lower_bound * 100)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">READY TO BLOCK THRESHOLD:</span>
                  <span className="text-neutral-300">80% (requires ≥ 10 decisions)</span>
                </div>
              </div>

              <div className="text-[11px] font-mono text-neutral-500 text-center">
                Governed by BrandTrace AI Statistical Policy Health Engine
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
