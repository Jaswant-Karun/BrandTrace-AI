import React from 'react';
import { ShieldCheck, Network, Flame, FileSpreadsheet, Database, RefreshCw, GitFork } from 'lucide-react';
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
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between sticky top-0 z-50 gap-4">
      {/* Brand & Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-brand-500 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">BRANDTRACE</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded">
                BDIG Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Brand Dependency Intelligence & Governance</p>
          </div>
        </div>

        {/* Brand Selector */}
        <div className="h-6 w-px bg-slate-800 hidden sm:block" />
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 font-medium hidden sm:inline">Active Brand:</label>
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500 transition-colors font-medium cursor-pointer"
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
      <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
        <button
          onClick={() => setCurrentTab('bdig')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'bdig'
              ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          Dependency Intelligence
        </button>

        <button
          onClick={() => setCurrentTab('inspector')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'inspector'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Asset Inspector
        </button>

        <button
          onClick={() => setCurrentTab('graph')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'graph'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Knowledge Graph
        </button>

        <button
          onClick={() => setCurrentTab('blast-radius')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'blast-radius'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          Blast Radius
        </button>

        <button
          onClick={() => setCurrentTab('ledger')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            currentTab === 'ledger'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-brand-400' : ''}`} />
        </button>

        <button
          onClick={onOpenDbModal}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border bg-slate-950 transition-colors border-slate-800 hover:border-slate-700 cursor-pointer"
        >
          <Database className={`w-3.5 h-3.5 ${dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-slate-300 font-mono text-[11px]">
            {dbStatus?.connected ? 'MongoDB Live' : 'Memory Store'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
        </button>
      </div>
    </header>
  );
};

