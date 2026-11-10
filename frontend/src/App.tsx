import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DependencyIntelligenceStudio } from './components/DependencyIntelligenceStudio';
import { AssetInspector } from './components/AssetInspector';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { BlastRadiusSimulator } from './components/BlastRadiusSimulator';
import { ReleaseLedgerView } from './components/ReleaseLedgerView';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { BrandProfile, DatabaseStatus, VerificationResult } from './types';
import { ShieldCheck, Activity, Layers, GitFork } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('bdig');
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('apex-dynamics');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isReseeding, setIsReseeding] = useState<boolean>(false);

  // Load brands and DB status
  const loadInitialData = async () => {
    try {
      const [brandsRes, statusRes] = await Promise.all([
        fetch('/api/brands'),
        fetch('/api/db/status')
      ]);
      if (brandsRes.ok) {
        const brandData: BrandProfile[] = await brandsRes.json();
        setBrands(brandData);
        if (brandData.length > 0 && !selectedBrandId) {
          setSelectedBrandId(brandData[0].brand_id);
        }
      }
      if (statusRes.ok) {
        const statusData: DatabaseStatus = await statusRes.json();
        setDbStatus(statusData);
      }
    } catch (e) {
      console.error('Failed to load initial metadata:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleReseed = async () => {
    setIsReseeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await loadInitialData();
    } catch (e) {
      console.error('Reseed error:', e);
    } finally {
      setIsReseeding(false);
    }
  };

  const handleSignRelease = async (result: VerificationResult, reviewerName: string) => {
    const payload = {
      verification_id: result.verification_id,
      brand_id: result.brand_id,
      asset_id: result.asset_id || result.verification_id,
      asset_title: result.asset_title || 'Marketing Asset',
      channel: result.channel,
      content: result.raw_content,
      reviewer: reviewerName,
      decision: result.governance_decision === 'APPROVED_FOR_RELEASE' ? 'APPROVED' : 'REVIEWED'
    };

    const res = await fetch('/api/releases/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to sign release');
  };

  const currentBrand = brands.find((b) => b.brand_id === selectedBrandId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      {/* Top Enterprise Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        brands={brands}
        selectedBrandId={selectedBrandId}
        setSelectedBrandId={setSelectedBrandId}
        dbStatus={dbStatus}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onReseed={handleReseed}
        isReseeding={isReseeding}
      />

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Executive Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Brand Profile</span>
              <ShieldCheck className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-base font-bold text-white truncate">
              {currentBrand ? currentBrand.brand_name : 'Apex Dynamics'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {currentBrand ? currentBrand.industry : 'Clean Electric Mobility'}
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Dependency Intelligence</span>
              <GitFork className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-base font-bold text-white">
              {currentBrand?.node_count || 32} Interconnected Nodes
            </div>
            <div className="text-[11px] text-slate-400">Claims, prices, ads, websites & docs</div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Governance Agents</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              4 Agents Active
            </div>
            <div className="text-[11px] text-slate-400">Voice, Claim, Regulatory & Blast Radius</div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Data Persistence</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-base font-bold text-white font-mono text-sm">
              {dbStatus?.connected ? 'MongoDB Motor' : 'In-Memory Fallback'}
            </div>
            <div className="text-[11px] text-slate-400">
              {dbStatus?.connected ? 'Live document store' : 'Offline judging resilience'}
            </div>
          </div>
        </div>

        {/* Tab Views */}
        {currentTab === 'bdig' && (
          <DependencyIntelligenceStudio brandId={selectedBrandId} />
        )}

        {currentTab === 'inspector' && (
          <AssetInspector
            brandId={selectedBrandId}
            onSignRelease={handleSignRelease}
          />
        )}

        {currentTab === 'graph' && (
          <KnowledgeGraphView brandId={selectedBrandId} />
        )}

        {currentTab === 'blast-radius' && (
          <BlastRadiusSimulator brandId={selectedBrandId} />
        )}

        {currentTab === 'ledger' && (
          <ReleaseLedgerView brandId={selectedBrandId} />
        )}
      </main>

      {/* Database Status Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="font-bold text-slate-300">BRANDTRACE AI</span> — The Autonomous Brand Intelligence & Governance Control Plane
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Every brand decision connected. Every risk traceable. Every release accountable.
        </div>
      </footer>
    </div>
  );
};

export default App;
