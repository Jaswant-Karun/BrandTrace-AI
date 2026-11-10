import React from 'react';
import { ShieldCheck, Activity, Network, FileCheck, Layers } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-base">BRANDTRACE</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest bg-brand-500/10 text-brand-400 border border-brand-500/30 px-1.5 py-0.5 rounded">Control Plane</span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous Brand Intelligence & Governance</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Graph Engine Active
          </span>
        </div>
      </header>

      {/* Main Content Placeholder */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Entities</span>
              <Network className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-bold text-white">128</div>
            <div className="text-xs text-slate-400 mt-1">Interconnected nodes in BKG</div>
          </div>
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Governance Agents</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">4 Online</div>
            <div className="text-xs text-slate-400 mt-1">Voice, Claim, Legal, Blast Radius</div>
          </div>
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Release Gates</span>
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">100% Gated</div>
            <div className="text-xs text-slate-400 mt-1">Tamper-evident audit chain</div>
          </div>
          <div className="bg-slate-900/70 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Blast Radius Calc</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">Live DAG</div>
            <div className="text-xs text-slate-400 mt-1">Sub-second policy mutation scan</div>
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">BRANDTRACE AI Control Plane Ready</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Phase 0 Discovery complete. Proceeding to Milestone 1: Brand Knowledge Graph (BKG) Engine & Multi-Agent Verification Architecture.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;

