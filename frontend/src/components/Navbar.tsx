import React from 'react';
import { ShieldCheck, Network, Flame, FileSpreadsheet, RefreshCw, GitFork } from 'lucide-react';
import { BrandProfile, DatabaseStatus } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  brands: BrandProfile[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  dbStatus: DatabaseStatus | null;
  onOpenDbModal: () => void;
  onReseed: () => void;
  isReseeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  brands,
  selectedBrandId,
  setSelectedBrandId,
  dbStatus,
  onOpenDbModal,
  onReseed,
  isReseeding,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between sticky top-0 z-50 gap-4 shadow-xs">
      {/* Brand & Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-base">BRANDTRACE</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                BDIG Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Brand Dependency Intelligence &amp; Governance</p>
          </div>
        </div>

        {/* Brand Selector */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-medium hidden sm:inline">Active Brand:</label>
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="bg-white border border-slate-200 text-xs text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:border-slate-400 transition-colors font-medium cursor-pointer shadow-xs"
          >
            {brands.map((b) => (
              <option key={b.brand_id} value={b.brand_id}>
                {b.brand_name} ({b.industry})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <button
          onClick={() => setCurrentTab('bdig')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'bdig'
              ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          Dependency Intelligence
        </button>

        <button
          onClick={() => setCurrentTab('inspector')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'inspector'
              ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Asset Inspector
        </button>

        <button
          onClick={() => setCurrentTab('graph')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'graph'
              ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Knowledge Graph
        </button>

        <button
          onClick={() => setCurrentTab('blast-radius')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'blast-radius'
              ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Blast Radius
        </button>

        <button
          onClick={() => setCurrentTab('ledger')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            currentTab === 'ledger'
              ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Release Ledger
        </button>
      </nav>

      {/* MongoDB Status & Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReseed}
          disabled={isReseeding}
          title="Re-seed MongoDB & Knowledge Graph"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-slate-900' : ''}`} />
        </button>

        <button
          onClick={onOpenDbModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-white transition-colors border-slate-200 hover:border-slate-300 cursor-pointer shadow-xs text-slate-700"
        >
          <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>{dbStatus?.connected ? 'Atlas Connected' : 'Memory DB'}</span>
        </button>
      </div>
    </header>
  );
};
