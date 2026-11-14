import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { CommandCenter } from './components/CommandCenter';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { DemoWalkthroughModal } from './components/DemoWalkthroughModal';
import { WelcomeModal } from './components/WelcomeModal';
import { GuidedTourOverlay } from './components/GuidedTourOverlay';
import { AuthHeader } from './components/AuthHeader';
import { useAuth } from './context/AuthContext';
import { BrandProfile, DatabaseStatus, VerificationResult } from './types';
import { ExternalLink, RefreshCw, Search } from 'lucide-react';

// Code-split heavy views via React.lazy for optimized initial bundle loading
const KnowledgeGraphView = lazy(() => import('./components/KnowledgeGraphView').then(m => ({ default: m.KnowledgeGraphView })));
const DependencyIntelligenceStudio = lazy(() => import('./components/DependencyIntelligenceStudio').then(m => ({ default: m.DependencyIntelligenceStudio })));
const AssetInspector = lazy(() => import('./components/AssetInspector').then(m => ({ default: m.AssetInspector })));
const BlastRadiusSimulator = lazy(() => import('./components/BlastRadiusSimulator').then(m => ({ default: m.BlastRadiusSimulator })));
const MultimodalInspectionView = lazy(() => import('./components/MultimodalInspectionView').then(m => ({ default: m.MultimodalInspectionView })));
const CampaignIntelligenceView = lazy(() => import('./components/CampaignIntelligenceView').then(m => ({ default: m.CampaignIntelligenceView })));
const RiskIntelligenceView = lazy(() => import('./components/RiskIntelligenceView').then(m => ({ default: m.RiskIntelligenceView })));
const ApprovalCenterView = lazy(() => import('./components/ApprovalCenterView').then(m => ({ default: m.ApprovalCenterView })));
const BrandKnowledgeBaseView = lazy(() => import('./components/BrandKnowledgeBaseView').then(m => ({ default: m.BrandKnowledgeBaseView })));
const GovernanceAnalyticsView = lazy(() => import('./components/GovernanceAnalyticsView').then(m => ({ default: m.GovernanceAnalyticsView })));
const AuditTrustCenterView = lazy(() => import('./components/AuditTrustCenterView').then(m => ({ default: m.AuditTrustCenterView })));
const SettingsView = lazy(() => import('./components/SettingsView').then(m => ({ default: m.SettingsView })));

const ViewLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white">
    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
    <span className="text-xs font-mono text-slate-500 tracking-wide">Loading module workspace...</span>
  </div>
);

export const App: React.FC = () => {
  const { currentWorkspace, setWorkspace, isAuthenticated } = useAuth();
  
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'app'>(() => {
    // If token exists, enter app directly; otherwise show login
    return localStorage.getItem('brandtrace_jwt_token') ? 'app' : 'login';
  });

  const [currentTab, setCurrentTab] = useState<NavigationTab>('command-center');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(currentWorkspace || 'aurelle-tech');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  
  // Modals & Interactive Tour State
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);

  const [isReseeding, setIsReseeding] = useState<boolean>(false);
  const [bdigSubTab, setBdigSubTab] = useState<'canvas' | 'workflow'>('canvas');

  useEffect(() => {
    if (currentWorkspace && currentWorkspace !== selectedBrandId) {
      setSelectedBrandId(currentWorkspace);
    }
  }, [currentWorkspace]);

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
          // Default to aurelle-tech if available
          const aurelleBrand = brandData.find(b => b.brand_id === 'aurelle-tech');
          setSelectedBrandId(aurelleBrand ? aurelleBrand.brand_id : brandData[0].brand_id);
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

    const token = localStorage.getItem('brandtrace_jwt_token');
    const res = await fetch('/api/releases/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to sign release');
  };

  const handleStartTour = () => {
    setIsTourOpen(true);
    setTourStepIndex(0);
    setCurrentTab('command-center');
  };

  const currentBrand = brands.find((b) => b.brand_id === selectedBrandId);

  // If user requests Public Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        brandName={currentBrand?.brand_name}
        onEnterApp={(targetTab) => {
          if (targetTab) setCurrentTab(targetTab as NavigationTab);
          setViewMode(isAuthenticated ? 'app' : 'login');
        }}
      />
    );
  }

  // If not authenticated or in login mode, render dedicated LoginPage
  if (viewMode === 'login' || !isAuthenticated) {
    return (
      <LoginPage
        onSuccess={() => {
          setViewMode('app');
          setIsWelcomeModalOpen(true);
        }}
        onOpenLanding={() => setViewMode('landing')}
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
    <div className="min-h-screen bg-white text-slate-900 flex font-sans selection:bg-slate-900 selection:text-white">
      {/* Enterprise Sidebar Navigation (12 Sections) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        brands={brands}
        selectedBrandId={selectedBrandId}
        setSelectedBrandId={(id) => {
          setSelectedBrandId(id);
          setWorkspace(id);
        }}
        dbStatus={dbStatus}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenLanding={() => setViewMode('landing')}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
        {/* Enterprise Tenant & Auth Header */}
        <AuthHeader
          onOpenDbStatus={() => setIsDbModalOpen(true)}
          onOpenDemoWalkthrough={() => setIsDemoModalOpen(true)}
          onStartTour={handleStartTour}
          onLogout={() => setViewMode('login')}
        />

        {/* Top Control Bar */}
        <header className="border-b border-slate-200 bg-white px-6 py-2.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>BrandTrace</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-semibold">{getTabTitle(currentTab)}</span>
            </div>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300" />
            <span className="hidden sm:inline-block text-[11px] text-slate-600 font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
              {currentBrand ? currentBrand.brand_name : 'Aurelle Technologies'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Global Search Bar */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search facts, rules, assets... (Ctrl+K)"
                className="w-64 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all shadow-2xs"
                readOnly
              />
            </div>

            {/* View Public Landing Page Button */}
            <button
              onClick={() => setViewMode('landing')}
              className="text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="View Public Overview Landing Page"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>

            {/* Quick Re-seed */}
            <button
              onClick={handleReseed}
              disabled={isReseeding}
              title="Re-seed MongoDB and Graph Data"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-slate-900' : ''}`} />
            </button>
          </div>
        </header>

        {/* Viewport Canvas with Framer Motion */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto bg-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Suspense fallback={<ViewLoadingFallback />}>
                {currentTab === 'command-center' && (
                  <CommandCenter
                    brandId={selectedBrandId}
                    onNavigate={setCurrentTab}
                    onStartTour={handleStartTour}
                  />
                )}

                {currentTab === 'bdig' && (
                  <div className="space-y-4">
                    {/* BDIG Sub-Navigation */}
                    <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setBdigSubTab('canvas')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                            bdigSubTab === 'canvas'
                              ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Interactive Knowledge Graph Canvas
                        </button>
                        <button
                          onClick={() => setBdigSubTab('workflow')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                            bdigSubTab === 'workflow'
                              ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Fact Mutation &amp; Revision Workflow
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 pr-3 hidden sm:inline">
                        Live MongoDB Graph Ontology
                      </span>
                    </div>

                    {bdigSubTab === 'canvas' ? (
                      <KnowledgeGraphView brandId={selectedBrandId} />
                    ) : (
                      <DependencyIntelligenceStudio brandId={selectedBrandId} />
                    )}
                  </div>
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
              </Suspense>
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

      {/* Phase 6 AURELLE Demo Walkthrough Modal */}
      <DemoWalkthroughModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigateToView={(viewName) => {
          if (viewName.includes('Graph')) setCurrentTab('bdig');
          else if (viewName.includes('Simulator')) setCurrentTab('impact-simulator');
          else if (viewName.includes('Approval')) setCurrentTab('approvals');
          else if (viewName.includes('Audit')) setCurrentTab('audit-trust');
          else if (viewName.includes('Knowledge')) setCurrentTab('knowledge-base');
          else if (viewName.includes('Studio') || viewName.includes('Content')) setCurrentTab('content-studio');
          else setCurrentTab('command-center');
        }}
      />

      {/* Welcome Onboarding Modal */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        onStartTour={handleStartTour}
        onLaunchDemoScenario={() => {
          setIsWelcomeModalOpen(false);
          setCurrentTab('impact-simulator');
        }}
      />

      {/* Interactive Guided Tour Overlay */}
      <GuidedTourOverlay
        isOpen={isTourOpen}
        currentStepIndex={tourStepIndex}
        onStepChange={(idx, tab) => {
          setTourStepIndex(idx);
          setCurrentTab(tab);
        }}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
};

export default App;
