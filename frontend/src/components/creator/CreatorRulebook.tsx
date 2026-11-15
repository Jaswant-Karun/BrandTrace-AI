import React, { useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';

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

const RULES_DATA: RuleItem[] = [
  {
    code: 'CIA-02',
    title: 'Calls to action name the product, not "click here"',
    citation: 'Aurelle Brand Book v1.3 §5.1 Calls to action',
    type: 'BRAND',
    engine: 'A - code',
    pattern: 'pattern',
    severity: 'ADVISORY',
    owner: 'brand',
  },
  {
    code: 'DL-01',
    title: "Offers and discounts need \"T&Cs apply\"",
    citation: 'Aurelle Brand Book v1.3 §7.3 Promotions',
    type: 'MANDATORY',
    engine: 'A - code',
    pattern: 'required',
    severity: 'ADVISORY',
    owner: 'compliance',
  },
  {
    code: 'DL-REQ',
    title: 'A study or percentage claim needs its study footnote',
    citation: 'Aurelle Brand Book v1.3 §7.2 Disclaimers (DL-02)',
    type: 'MANDATORY',
    engine: 'A - code',
    pattern: 'required',
    severity: 'ADVISORY',
    owner: 'compliance',
  },
  {
    code: 'GM06',
    title: 'Email addresses and URIs in lowercase',
    citation: 'Aurelle Brand Book v1.3 §8 Style (GM06)',
    type: 'BRAND',
    engine: 'A - code',
    pattern: 'pattern',
    severity: 'ADVISORY',
    owner: 'brand',
  },
  {
    code: 'GM07',
    title: "Don't capitalise website, internet, online or email mid-sentence",
    citation: 'Aurelle Brand Book v1.3 §8 Style (GM07)',
    type: 'BRAND',
    engine: 'A - code',
    pattern: 'pattern',
    severity: 'ADVISORY',
    owner: 'brand',
  },
  {
    code: 'GM08',
    title: 'Use emoji sparingly: infrequently and deliberately',
    citation: 'Aurelle Brand Book v1.3 §8 Style (GM08)',
    type: 'BRAND',
    engine: 'C - not run',
    pattern: 'pattern',
    severity: 'ADVISORY',
    owner: 'brand',
    linterWarning: "Linter: Vague quantifier 'sparingly' with no params; classified C, will not run",
  },
  {
    code: 'GM10',
    title: 'Numbers over three digits get commas',
    citation: 'Aurelle Brand Book v1.3 §8 Style (GM10)',
    type: 'BRAND',
    engine: 'A - code',
    pattern: 'pattern',
    severity: 'ADVISORY',
    owner: 'brand',
  },
  {
    code: 'GM14',
    title: 'Use the % symbol, not the word percent',
    citation: 'Aurelle Brand Book v1.3 §8 Style (GM14)',
    type: 'BRAND',
    engine: 'A - code',
    pattern: 'word list',
    severity: 'BLOCKING',
    owner: 'brand',
  },
  {
    code: 'GM28',
    title: 'Em dashes without spaces',
    citation: 'Aurelle Brand Book v1.3 §8 Style (GM28)',
    type: 'BRAND',
    engine: 'A - code',
    pattern: 'pattern',
    severity: 'ADVISORY',
    owner: 'brand',
  },
  {
    code: 'GM29',
    title: 'Use ellipses sparingly; not for drama',
    citation: 'Aurelle Brand Book v1.3 §8 Style (GM29)',
    type: 'BRAND',
    engine: 'C - not run',
    pattern: 'pattern',
    severity: 'ADVISORY',
    owner: 'brand',
    linterWarning: "Linter: Vague quantifier 'sparingly' with no params; classified C, will not run",
  },
];

interface CreatorRulebookProps {
  brandName?: string;
}

export const CreatorRulebook: React.FC<CreatorRulebookProps> = ({
  brandName = 'Aurelle Skin',
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dynamicRules, setDynamicRules] = useState<RuleItem[]>([]);

  React.useEffect(() => {
    fetch('/api/guidelines?brand_id=aurelle-tech')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const liveRules: RuleItem[] = data.map((g) => ({
            code: g.guideline_id || 'GL-LIVE',
            title: g.title || g.rule_statement || 'Brand Guideline',
            citation: g.source_citation || `Aurelle Master Guidelines §${g.category || 'POLICY'}`,
            type: g.severity === 'CRITICAL' || g.severity === 'HIGH' ? 'MANDATORY' : 'BRAND',
            engine: 'A - code',
            pattern: 'policy',
            severity: g.severity === 'CRITICAL' || g.severity === 'HIGH' ? 'BLOCKING' : 'ADVISORY',
            owner: g.category === 'REGULATORY' ? 'compliance' : 'brand',
          }));
          setDynamicRules(liveRules);
        }
      })
      .catch(() => {});
  }, []);

  const allRules = [...RULES_DATA, ...dynamicRules.filter((dr) => !RULES_DATA.some((r) => r.code === dr.code))];

  const filteredRules = allRules.filter((r) => {
    const matchesSearch =
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.citation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
          Everything the checker looks for, where each rule comes from, and which rules are too vague to check.
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-1">
          <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">32</div>
          <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">RULES</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-1">
          <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">12</div>
          <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">MANDATORY</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-1">
          <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">20</div>
          <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">BRAND</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 space-y-1">
          <div className="text-2xl sm:text-4xl font-extrabold text-amber-400 font-mono">4</div>
          <div className="text-[10px] sm:text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">LINTER WARNINGS</div>
        </div>
      </div>

      <p className="text-xs font-mono text-neutral-400 leading-relaxed">
        Version <code className="text-indigo-400">rb-222d152cf5</code>. Mandatory rules block publishing; brand rules start as advisory and block only once they graduate.
      </p>

      {/* Category Breakdown Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-bold uppercase tracking-wider text-neutral-300">BY CATEGORY</span>
          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> A - code</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> B - AI judgement</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> C - not run</span>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase">STYLE</span>
              <span className="text-base font-bold font-mono text-white">12</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 flex overflow-hidden">
              <div className="w-[66%] bg-indigo-500" />
              <div className="w-[17%] bg-cyan-400" />
              <div className="w-[17%] bg-amber-400" />
            </div>
            <div className="text-[10px] font-mono text-neutral-500">A 8 · B 2 · C 2 · 0 mandatory</div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase">CLAIM</span>
              <span className="text-base font-bold font-mono text-white">6</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 flex overflow-hidden">
              <div className="w-[83%] bg-indigo-500" />
              <div className="w-[17%] bg-cyan-400" />
            </div>
            <div className="text-[10px] font-mono text-neutral-500">A 5 · 6 mandatory</div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase">TONE</span>
              <span className="text-base font-bold font-mono text-white">6</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 flex overflow-hidden">
              <div className="w-[33%] bg-indigo-500" />
              <div className="w-[33%] bg-cyan-400" />
              <div className="w-[34%] bg-amber-400" />
            </div>
            <div className="text-[10px] font-mono text-neutral-500">A 2 · B 2 · C 2 · 0 mandatory</div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-neutral-300 uppercase">ACCESSIBILITY</span>
              <span className="text-base font-bold font-mono text-white">3</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-800 flex overflow-hidden">
              <div className="w-full bg-indigo-500" />
            </div>
            <div className="text-[10px] font-mono text-neutral-500">A 3 · 2 mandatory</div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono flex items-center justify-between">
            <span className="text-neutral-400 uppercase">REQUIRED</span>
            <span className="font-bold text-white">3</span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono flex items-center justify-between">
            <span className="text-neutral-400 uppercase">CONFIDENTIAL</span>
            <span className="font-bold text-white">1</span>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono flex items-center justify-between">
            <span className="text-neutral-400 uppercase">TERMINOLOGY</span>
            <span className="font-bold text-white">1</span>
          </div>

        </div>
      </div>

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
            {filteredRules.map((rule) => (
              <div key={rule.code} className="p-4 sm:p-5 hover:bg-neutral-900/30 transition-colors space-y-2.5">
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
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

