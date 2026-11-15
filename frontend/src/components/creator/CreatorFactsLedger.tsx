import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Check, ShieldCheck } from 'lucide-react';

interface FactCardItem {
  id: string;
  code: string;
  title: string;
  meta: string;
  category: string;
  product: string;
  approvedWording?: {
    code: string;
    text: string;
  };
}

const FACTS_DATA: FactCardItem[] = [
  {
    id: 'f-001',
    code: 'FACT-001',
    product: 'Brand-wide',
    category: 'Brand-wide',
    title: 'Aurelle products are not tested on animals at any stage',
    meta: 'IN · owner: Compliance · valid from 2025-01-01, no end date',
    approvedWording: {
      code: 'AW-001a (any, IN)',
      text: '"never tested on animals"',
    },
  },
  {
    id: 'f-002',
    code: 'FACT-002',
    product: 'Brand-wide',
    category: 'Brand-wide',
    title: 'Aurelle Skin is made in India',
    meta: 'IN · owner: Brand · valid from 2025-01-01, no end date',
  },
  {
    id: 'f-003',
    code: 'FACT-003',
    product: 'Vitamin C Brightening Serum',
    category: 'Vitamin C Brightening Serum',
    title: 'Vitamin C Brightening Serum contains 10% ethyl ascorbic acid',
    meta: 'Vitamin C Brightening Serum · IN · owner: R&D · valid from 2025-06-01, no end date',
    approvedWording: {
      code: 'AW-003a (any, IN)',
      text: '"with 10% vitamin C (ethyl ascorbic acid)"',
    },
  },
  {
    id: 'f-004',
    code: 'FACT-004',
    product: 'Vitamin C Brightening Serum',
    category: 'Vitamin C Brightening Serum',
    title: 'Vitamin C Brightening Serum is fragrance-free',
    meta: 'Vitamin C Brightening Serum · IN · owner: R&D · valid from 2025-06-01, no end date',
  },
  {
    id: 'f-005',
    code: 'FACT-005',
    product: 'Vitamin C Brightening Serum',
    category: 'Vitamin C Brightening Serum',
    title: 'Vitamin C Brightening Serum is suitable for sensitive skin, dermatologically tested on 50 participants',
    meta: 'Vitamin C Brightening Serum · IN · owner: Compliance · valid from 2025-06-01 until 2027-06-30',
  },
  {
    id: 'f-006',
    code: 'FACT-006',
    product: 'Vitamin C Brightening Serum',
    category: 'Vitamin C Brightening Serum',
    title: 'Vitamin C Brightening Serum costs ₹899 for 30 ml',
    meta: 'Vitamin C Brightening Serum · IN · owner: Brand · valid from 2026-01-01 until 2026-12-31',
  },
];

const TIMELINE_FACTS = [
  { code: 'FACT-029', status: 'expired', label: 'ended 30 Sept 2026', width: 24.5, start: 18 },
  { code: 'FACT-032', status: 'active', label: 'ends 30 Nov 2026', width: 14, start: 43.5 },
  { code: 'FACT-006', status: 'active', label: 'ends 31 Dec 2026', width: 24, start: 31 },
  { code: 'FACT-013', status: 'active', label: 'ends 31 Dec 2026', width: 42, start: 13 },
  { code: 'FACT-025', status: 'active', label: 'ends 31 Dec 2026', width: 24, start: 31 },
  { code: 'FACT-028', status: 'active', label: 'ends 31 Dec 2026', width: 20, start: 35 },
  { code: 'FACT-030', status: 'active', label: 'ends 31 Dec 2026', width: 24, start: 31 },
  { code: 'FACT-014', status: 'active', label: 'ends 31 Mar 2027', width: 30, start: 32 },
  { code: 'FACT-005', status: 'active', label: 'ends 30 Jun 2027', width: 46, start: 18 },
  { code: 'FACT-010', status: 'active', label: 'ends 30 Sept 2027', width: 48, start: 23 },
  { code: 'FACT-026', status: 'active', label: 'ends 30 Sept 2027', width: 46, start: 25 },
  { code: 'FACT-015', status: 'active', label: 'ends 31 Oct 2027', width: 45, start: 27 },
  { code: 'FACT-009', status: 'active', label: 'ends 31 Dec 2027', width: 57, start: 18 },
  { code: 'FACT-018', status: 'active', label: 'ends 31 Dec 2027', width: 42, start: 33 },
  { code: 'FACT-017', status: 'active', label: 'ends 31 Jan 2028', width: 43, start: 33 },
  { code: 'FACT-019', status: 'active', label: 'ends 31 Jan 2028', width: 43, start: 33 },
];

const SHELF_PRODUCTS = [
  'All 35 facts',
  'Brand-wide',
  'Vitamin C Brightening Serum',
  'Hyaluronic Water Gel',
  'Niacinamide 10% Clarifying Serum',
  'Ceramide Barrier Cream',
  'SPF 50 Daily Sunscreen',
  'Gentle Rice Cleanser',
  'Kumkumadi Glow Oil',
];

interface CreatorFactsLedgerProps {
  brandName?: string;
  role?: string;
}

export const CreatorFactsLedger: React.FC<CreatorFactsLedgerProps> = ({
  brandName = 'Aurelle Skin',
  role = 'creator',
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('All 35 facts');
  const [dynamicFacts, setDynamicFacts] = useState<FactCardItem[]>([]);

  React.useEffect(() => {
    fetch('/api/facts?brand_id=aurelle-tech')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: FactCardItem[] = data.map((f) => ({
            id: f.id || `f-${Date.now()}`,
            code: f.id || 'FACT-LIVE',
            title: f.description ? `${f.name}: ${f.description}` : f.name,
            meta: `${f.department_owner || 'Brand'} · valid ${f.last_verified || '2026-01-01'}`,
            category: f.category || 'Specification',
            product: 'Brand-wide',
            approvedWording: {
              code: `${f.id || 'FACT'}-AW`,
              text: `"${f.current_value} ${f.unit || ''}"`,
            },
          }));
          setDynamicFacts(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const [expandedFactId, setExpandedFactId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyWording = (code: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const allFacts = [...FACTS_DATA, ...dynamicFacts.filter((df) => !FACTS_DATA.some((f) => f.code === df.code))];

  const filteredFacts = allFacts.filter((f) => {
    if (selectedProduct === 'All 35 facts') return true;
    return f.product === selectedProduct;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          BRANDTRACE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          FACT LEDGER
        </h1>
        <p className="text-xs sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          The claims Aurelle can back up with evidence, and the approved way to say each one.
        </p>
      </div>

      {/* Restricted Facts Callout Banner */}
      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 font-sans leading-relaxed">
        Some facts are restricted. Confidential and embargoed facts are visible only to reviewers, compliance and the brand owner; the checker still checks your drafts against them.
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <div className="text-3xl font-extrabold text-white font-mono">35</div>
          <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">FACTS</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <div className="text-3xl font-extrabold text-rose-500 font-mono">1</div>
          <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">EXPIRED</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <div className="text-3xl font-extrabold text-amber-400 font-mono">2</div>
          <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">UNVERIFIED</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <div className="text-3xl font-extrabold text-neutral-200 font-mono">16</div>
          <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">WITH AN END DATE</div>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-1">
          <div className="text-3xl font-extrabold text-indigo-400 font-mono">15</div>
          <div className="text-[11px] font-mono font-bold text-neutral-400 uppercase tracking-wider">APPROVED WORDINGS</div>
        </div>
      </div>

      <div className="text-xs font-mono text-neutral-500">
        Dates are checked against 15 Nov 2026 (India time).
      </div>

      {/* Timeline Section: WHEN FACTS STOP BEING TRUE */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.5 }}
        className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              WHEN FACTS STOP BEING TRUE
            </h3>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Each bar runs from the date a fact became valid to the date it ends. Past the line, a post can't use it.
            </p>
          </div>
          {role === 'agency' && (
            <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-neutral-900 border border-neutral-700 text-neutral-400 uppercase">
              CONFIDENTIAL EMBARGOED FACTS HIDDEN
            </span>
          )}
        </div>

        {/* Mobile Swipe Hint */}
        <div className="text-[10px] font-mono text-neutral-500 sm:hidden">
          ← Swipe timeline horizontally →
        </div>

        {/* Timeline Chart Container with Horizontal Pan on Mobile */}
        <div className="overflow-x-auto no-scrollbar pb-2">
          <div className="relative pt-6 pb-2 min-w-[540px]">
            {/* Vertical TODAY line */}
            <div 
              className="absolute top-0 bottom-0 w-[1px] bg-neutral-500/70 z-20 pointer-events-none flex flex-col items-center"
              style={{ left: '43.5%' }}
            >
              <span className="text-[9px] font-mono font-bold text-white bg-[#151518] border border-neutral-700 px-2 py-0.5 rounded -mt-2.5 shadow-sm uppercase tracking-wider">
                TODAY
              </span>
            </div>

            {/* Timeline Rows with Sequential Scroll Motion Increase */}
            <div className="space-y-2">
              {TIMELINE_FACTS.map((tf, idx) => (
                <motion.div
                  key={tf.code}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{
                    duration: 0.45,
                    delay: idx * 0.04,
                    ease: "easeOut"
                  }}
                  className="flex items-center text-[10px] font-mono h-6 relative group"
                >
                  <span className="w-20 text-neutral-400 shrink-0 font-mono text-[11px] font-medium group-hover:text-white transition-colors">
                    {tf.code}
                  </span>
                  <div className="flex-1 relative h-6 bg-[#121214] border border-neutral-800/40 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      whileInView={{ width: `${tf.width}%`, opacity: 1 }}
                      viewport={{ once: false, amount: 0.15 }}
                      transition={{
                        duration: 0.85,
                        delay: idx * 0.075,
                        ease: [0.16, 1, 0.3, 1] // Fluid cubic-bezier expansion one by one
                      }}
                      style={{ left: `${tf.start}%` }}
                      className={`absolute top-0 bottom-0 rounded px-2.5 flex items-center justify-end text-[9.5px] font-mono font-bold text-white whitespace-nowrap transition-all group-hover:brightness-110 ${
                        tf.status === 'expired'
                          ? 'bg-gradient-to-r from-[#dc2643] to-[#e62044] shadow-[0_0_16px_rgba(220,38,67,0.55)]'
                          : 'bg-gradient-to-r from-[#00875a] to-[#009b66] shadow-[0_0_12px_rgba(0,155,102,0.35)]'
                      }`}
                    >
                      {/* Active Leading Expansion Edge Shimmer */}
                      <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/25 rounded-r pointer-events-none blur-[0.5px]" />

                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: false, amount: 0.15 }}
                        transition={{
                          duration: 0.35,
                          delay: idx * 0.075 + 0.32
                        }}
                        className="text-[9px] truncate select-none font-mono tracking-tight"
                      >
                        {tf.label}
                      </motion.span>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* THE SHELF Product Filter */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold font-mono text-neutral-400 uppercase tracking-wider">
          THE SHELF
        </h3>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {SHELF_PRODUCTS.map((prod) => (
            <button
              key={prod}
              onClick={() => setSelectedProduct(prod)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors cursor-pointer border ${
                selectedProduct === prod
                  ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              {prod}
            </button>
          ))}
        </div>

        {/* Fact Cards: Responsive Expandable Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredFacts.map((fact) => {
            const isExpanded = expandedFactId === fact.id;
            return (
              <div
                key={fact.id}
                className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-neutral-700 transition-colors shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-300">
                      {fact.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-400">
                        {fact.category || 'PUBLIC'}
                      </span>
                      <button
                        onClick={() => setExpandedFactId(isExpanded ? null : fact.id)}
                        className="text-neutral-500 hover:text-white p-1 rounded transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse' : 'Expand details'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-sans font-bold text-white leading-snug break-words">
                    {fact.title}
                  </h4>

                  <div className="text-[11px] font-mono text-neutral-500 leading-relaxed break-words">
                    {fact.meta}
                  </div>
                </div>

                {/* Expandable Governance & Evidence Details on Mobile */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2 border-t border-neutral-800/80 space-y-2 text-xs font-mono"
                    >
                      <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[11px] space-y-1">
                        <div className="text-neutral-400 text-[10px] uppercase font-semibold flex items-center gap-1 text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Certified Evidence Reference</span>
                        </div>
                        <div className="text-neutral-200">
                          Evidence protocol certified by Brand & Regulatory Compliance.
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {fact.approvedWording && (
                  <div className="pt-2.5 border-t border-neutral-900 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400">
                      <span>{fact.approvedWording.code}</span>
                      <button
                        onClick={() => handleCopyWording(fact.code, fact.approvedWording!.text)}
                        className="flex items-center gap-1 text-neutral-400 hover:text-white cursor-pointer px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                      >
                        {copiedCode === fact.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400 text-[9px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[9px]">Copy phrase</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-xs font-mono text-neutral-300 italic break-words bg-neutral-900/60 p-2 rounded-lg border border-neutral-800/60">
                      {fact.approvedWording.text}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

