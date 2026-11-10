import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { CommandCenter } from './components/CommandCenter';
import { DependencyIntelligenceStudio } from './components/DependencyIntelligenceStudio';
import { AssetInspector } from './components/AssetInspector';
import { BlastRadiusSimulator } from './components/BlastRadiusSimulator';
import { MultimodalInspectionView } from './components/MultimodalInspectionView';
import { CampaignIntelligenceView } from './components/CampaignIntelligenceView';
import { RiskIntelligenceView } from './components/RiskIntelligenceView';
import { ApprovalCenterView } from './components/ApprovalCenterView';
import { BrandKnowledgeBaseView } from './components/BrandKnowledgeBaseView';
import { GovernanceAnalyticsView } from './components/GovernanceAnalyticsView';
import { AuditTrustCenterView } from './components/AuditTrustCenterView';
import { SettingsView } from './components/SettingsView';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { BrandProfile, DatabaseStatus, VerificationResult } from './types';
import { ExternalLink, Database, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'landing' | 'app'>('app');
  const [currentTab, setCurrentTab] = useState<NavigationTab>('command-center');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('apex-dynamics');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isReseeding, setIsReseeding] = useState<boolean>(false);

  // Load brands and DB telemetry
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

  // If user requests Public Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        brandName={currentBrand?.brand_name}
        onEnterApp={(targetTab) => {
          if (targetTab) setCurrentTab(targetTab as NavigationTab);
          setViewMode('app');
        }}
      />
    );
  }

  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'command-center': return 'Executive Command Center';
      case 'bdig': return 'Brand Dependency Intelligence Graph';
      case 'content-studio': return 'Content Studio & Multi-Agent Inspection';
      case 'impact-simulator': return 'Cascading Blast Radius Simulator';
      case 'multimodal': return 'Multimodal & Creative Inspection';
      case 'campaigns': return 'Campaign Intelligence Portfolio';
      case 'risks': return 'Enterprise Risk Intelligence & Taxonomy';
      case 'approvals': return 'Governance Approval Center';
      case 'knowledge-base': return 'Brand Knowledge Base & Truth-Set';
      case 'analytics': return 'Governance Velocity & Analytics';
      case 'audit-trust': return 'Audit & Trust Center (Ledger)';
      case 'settings': return 'Control Plane Enterprise Settings';
      default: return 'BrandTrace AI';
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-black">
      {/* Enterprise Sidebar Navigation (12 Sections) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        brands={brands}
        selectedBrandId={selectedBrandId}
        setSelectedBrandId={setSelectedBrandId}
        dbStatus={dbStatus}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenLanding={() => setViewMode('landing')}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Control Bar */}
        <header className="border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-xl px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-white tracking-tight">
              {getTabTitle(currentTab)}
            </h1>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-600" />
            <span className="hidden sm:inline-block text-xs text-slate-400 font-mono">
              {currentBrand ? currentBrand.brand_name : 'Apex Dynamics'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Public Landing Page Button */}
            <button
              onClick={() => setViewMode('landing')}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="View Public Overview Landing Page"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Public Landing Page</span>
            </button>

            {/* Quick Re-seed */}
            <button
              onClick={handleReseed}
              disabled={isReseeding}
              title="Re-seed MongoDB and Graph Data"
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* DB Status Button */}
            <button
              onClick={() => setIsDbModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-slate-950 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
            >
              <Database className={`w-3.5 h-3.5 ${dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-slate-300 font-mono text-[11px] hidden sm:inline">
                {dbStatus?.connected ? 'MongoDB' : 'Memory'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>
          </div>
        </header>

        {/* Viewport Canvas with Framer Motion */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {currentTab === 'command-center' && (
                <CommandCenter brandId={selectedBrandId} onNavigate={setCurrentTab} />
              )}

              {currentTab === 'bdig' && (
                <DependencyIntelligenceStudio brandId={selectedBrandId} />
              )}

              {currentTab === 'content-studio' && (
                <AssetInspector brandId={selectedBrandId} onSignRelease={handleSignRelease} />
              )}

              {currentTab === 'impact-simulator' && (
                <BlastRadiusSimulator brandId={selectedBrandId} />
              )}

              {currentTab === 'multimodal' && (
                <MultimodalInspectionView brandId={selectedBrandId} />
              )}

              {currentTab === 'campaigns' && (
                <CampaignIntelligenceView brandId={selectedBrandId} />
              )}

              {currentTab === 'risks' && (
                <RiskIntelligenceView brandId={selectedBrandId} />
              )}

              {currentTab === 'approvals' && (
                <ApprovalCenterView brandId={selectedBrandId} />
              )}

              {currentTab === 'knowledge-base' && (
                <BrandKnowledgeBaseView brandId={selectedBrandId} />
              )}

              {currentTab === 'analytics' && (
                <GovernanceAnalyticsView brandId={selectedBrandId} />
              )}

              {currentTab === 'audit-trust' && (
                <AuditTrustCenterView brandId={selectedBrandId} />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  brand={currentBrand}
                  dbStatus={dbStatus}
                  onReseed={handleReseed}
                  isReseeding={isReseeding}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Database Status Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
      />
    </div>
  );
};

export default App;
