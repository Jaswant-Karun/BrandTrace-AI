import React, { useState } from 'react';

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
  { code: 'FACT-029', status: 'expired', label: 'ended 30 Sept 2026', width: 45, start: 20 },
  { code: 'FACT-032', status: 'active', label: 'ends 30 Nov 2026', width: 12, start: 50 },
  { code: 'FACT-006', status: 'active', label: 'ends 31 Dec 2026', width: 25, start: 35 },
  { code: 'FACT-013', status: 'active', label: 'ends 31 Dec 2026', width: 45, start: 15 },
  { code: 'FACT-025', status: 'active', label: 'ends 31 Dec 2026', width: 25, start: 35 },
  { code: 'FACT-028', status: 'active', label: 'ends 31 Dec 2026', width: 20, start: 40 },
  { code: 'FACT-030', status: 'active', label: 'ends 31 Dec 2026', width: 25, start: 35 },
  { code: 'FACT-014', status: 'active', label: 'ends 31 Mar 2027', width: 32, start: 36 },
  { code: 'FACT-005', status: 'active', label: 'ends 30 Jun 2027', width: 50, start: 20 },
  { code: 'FACT-010', status: 'active', label: 'ends 30 Sept 2027', width: 52, start: 26 },
  { code: 'FACT-026', status: 'active', label: 'ends 30 Sept 2027', width: 50, start: 28 },
  { code: 'FACT-015', status: 'active', label: 'ends 31 Oct 2027', width: 48, start: 30 },
  { code: 'FACT-009', status: 'active', label: 'ends 31 Dec 2027', width: 62, start: 20 },
  { code: 'FACT-018', status: 'active', label: 'ends 31 Dec 2027', width: 45, start: 37 },
  { code: 'FACT-017', status: 'active', label: 'ends 31 Jan 2028', width: 46, start: 37 },
  { code: 'FACT-019', status: 'active', label: 'ends 31 Jan 2028', width: 46, start: 37 },
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
}

export const CreatorFactsLedger: React.FC<CreatorFactsLedgerProps> = ({
  brandName = 'Aurelle Skin',
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('All 35 facts');

  const filteredFacts = FACTS_DATA.filter((f) => {
    if (selectedProduct === 'All 35 facts') return true;
    return f.product === selectedProduct;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          PLUMBLINE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          FACT LEDGER
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
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
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 sm:p-7 space-y-4 shadow-xl">
        <div>
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            WHEN FACTS STOP BEING TRUE
          </h3>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Each bar runs from the date a fact became valid to the date it ends. Past the line, a post can't use it.
          </p>
        </div>

        {/* Timeline Chart Container */}
        <div className="relative pt-6 pb-2">
          {/* Vertical TODAY line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white z-20 pointer-events-none flex flex-col items-center">
            <span className="text-[9px] font-mono font-bold text-white bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded -mt-2.5">
              TODAY
            </span>
          </div>

          {/* Timeline Rows */}
          <div className="space-y-2">
            {TIMELINE_FACTS.map((tf) => (
              <div key={tf.code} className="flex items-center text-[10px] font-mono h-6 relative group">
                <span className="w-16 text-neutral-400 shrink-0">{tf.code}</span>
                <div className="flex-1 relative h-4 bg-neutral-900/50 rounded overflow-hidden">
                  <div
                    style={{ left: `${tf.start}%`, width: `${tf.width}%` }}
                    className={`absolute top-0 bottom-0 rounded px-1.5 flex items-center justify-end text-[9px] font-bold text-white whitespace-nowrap transition-all ${
                      tf.status === 'expired'
                        ? 'bg-rose-600/90 shadow-[0_0_8px_rgba(225,29,72,0.6)]'
                        : 'bg-emerald-600/80'
                    }`}
                  >
                    <span className="text-[8.5px] truncate">{tf.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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

        {/* Fact Cards 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFacts.map((fact) => (
            <div
              key={fact.id}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-3 hover:border-neutral-700 transition-colors shadow-lg flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-300">
                    {fact.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-400">
                    PUBLIC
                  </span>
                </div>

                <h4 className="text-sm font-sans font-bold text-white leading-snug">
                  {fact.title}
                </h4>

                <div className="text-[11px] font-mono text-neutral-500 leading-relaxed">
                  {fact.meta}
                </div>
              </div>

              {fact.approvedWording && (
                <div className="pt-2 border-t border-neutral-900 space-y-1">
                  <div className="text-[10px] font-mono text-indigo-400">
                    {fact.approvedWording.code}
                  </div>
                  <div className="text-xs font-mono text-neutral-300 italic">
                    {fact.approvedWording.text}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

