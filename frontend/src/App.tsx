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
import { OfflineBanner } from './components/OfflineBanner';
import { InstallAppModal } from './components/InstallAppModal';
import { usePWA } from './hooks/usePWA';
import { useAuth } from './context/AuthContext';
import { BrandProfile, DatabaseStatus, VerificationResult } from './types';
import { ExternalLink, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './components/ui/ThemeToggle';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

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
const PublicVerificationView = lazy(() => import('./components/PublicVerificationView').then(m => ({ default: m.PublicVerificationView })));

const ViewLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white dark:bg-slate-950 transition-colors duration-200">
    <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-indigo-500 animate-spin" />
    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-wide">Loading module workspace...</span>
  </div>
);

export const App: React.FC = () => {
  const { currentWorkspace, setWorkspace, isAuthenticated } = useAuth();
  
  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'app' | 'verify'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'verify' || window.location.hash === '#verify') return 'verify';
      if (params.get('view') === 'landing') return 'landing';
      if (params.get('view') === 'login') return 'login';
      if ((params.get('view') === 'app' || params.get('demo') === 'true' || params.get('token')) && localStorage.getItem('brandtrace_jwt_token')) {
        return 'app';
      }
    }
    // Main requirement: First page for visitors is always Sign In / Register
    return 'login';
  });

  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavigationTab;
      if (tabParam) return tabParam;
    }
    return 'command-center';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(currentWorkspace || 'aurelle-tech');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  // Progressive Web App (PWA) & Offline Hook
  const { isOnline, isInstallable, isInstalled, promptInstall } = usePWA();
  
  // Mobile Navigation Drawer & Install Modal State
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  
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

  // If user requests Public Verification Portal (Zero authentication required)
  if (viewMode === 'verify') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <PublicVerificationView
          initialBrand={currentBrand?.brand_name || 'Velora Money'}
          onBack={() => setViewMode(isAuthenticated ? 'landing' : 'login')}
        />
      </Suspense>
    );
  }

  // If user requests Public Landing Page (Second page in flow after sign in or explicit click)
  if (viewMode === 'landing') {
    return (
      <LandingPage
        brandName={currentBrand?.brand_name}
        onEnterApp={(targetTab) => {
          if (targetTab) setCurrentTab(targetTab as NavigationTab);
          setViewMode(isAuthenticated ? 'app' : 'login');
        }}
        onVerify={() => setViewMode('verify')}
        onSignIn={() => setViewMode('login')}
      />
    );
  }

  // Protected route guard: unauthenticated attempts to enter dashboard redirect to login
  if (viewMode === 'app' && !isAuthenticated) {
    return (
      <LoginPage
        onSuccess={() => {
          setViewMode('landing');
        }}
        onOpenLanding={() => setViewMode('landing')}
      />
    );
  }

  // If not authenticated or in login mode, render dedicated LoginPage (Page 1)
  if (viewMode === 'login' || !isAuthenticated) {
    return (
      <LoginPage
        onSuccess={() => {
          setViewMode('landing');
        }}
        onOpenLanding={() => setViewMode('landing')}
      />
    );
  }

  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'command-center': return 'Overview';
      case 'knowledge-base': return 'Brand Knowledge';
      case 'bdig': return 'Knowledge Graph';
      case 'content-studio': return 'Content Intelligence';
      case 'multimodal': return 'Multimodal Inspection';
      case 'campaigns': return 'Campaign Intelligence';
      case 'risks': return 'Risk Intelligence';
      case 'impact-simulator': return 'Change Impact Simulator';
      case 'approvals': return 'Approval Center';
      case 'audit-trust': return 'Trust & Audit Ledger';
      case 'analytics': return 'Analytics';
      case 'settings': return 'Settings';
      default: return 'BrandTrace AI';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-900 selection:text-white dark:selection:bg-indigo-600 dark:selection:text-white overflow-x-hidden transition-colors duration-200">
      {/* Offline Status Security Guardrail Banner */}
      <OfflineBanner isOnline={isOnline} />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Enterprise Sidebar Navigation (Responsive Desktop & Mobile Drawer) */}
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
          isMobileOpen={isMobileNavOpen}
          setIsMobileOpen={setIsMobileNavOpen}
        />

        {/* Main App Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-200">
          {/* Enterprise Tenant & Auth Header */}
          <AuthHeader
            onOpenDbStatus={() => setIsDbModalOpen(true)}
            onOpenDemoWalkthrough={() => setIsDemoModalOpen(true)}
            onStartTour={handleStartTour}
            onLogout={() => setViewMode('login')}
            onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
            onOpenPublicVerification={() => setViewMode('verify')}
            isInstallable={isInstallable}
            isInstalled={isInstalled}
          />

          {/* Top Control Bar */}
          <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              <span className="hidden xs:inline">BrandTrace</span>
              <span className="text-slate-300 dark:text-slate-700 hidden xs:inline">/</span>
              <span className="text-slate-900 dark:text-white font-semibold truncate">{getTabTitle(currentTab)}</span>
            </div>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="hidden md:inline-block text-[11px] text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded truncate max-w-[180px]">
              {currentBrand ? currentBrand.brand_name : 'Aurelle Technologies'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Global Search Bar */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search facts, rules, assets... (Ctrl+K)"
                className="w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
                readOnly
              />
            </div>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle variant="pill" />

            {/* View Public Verification Portal Button */}
            <button
              onClick={() => setViewMode('verify')}
              className="text-xs text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 px-2 sm:px-2.5 py-1.5 rounded-lg border border-indigo-200/80 dark:border-indigo-800/80 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open Public Verification Portal (Zero Authentication)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
              <span className="hidden sm:inline">Verify Release</span>
            </button>

            {/* View Public Landing Page Button */}
            <button
              onClick={() => setViewMode('landing')}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="View Public Overview Landing Page"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Landing Page</span>
            </button>

            {/* Quick Re-seed */}
            <button
              onClick={handleReseed}
              disabled={isReseeding}
              title="Re-seed MongoDB and Graph Data"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-slate-900 dark:text-white' : ''}`} />
            </button>
          </div>
        </header>

        {/* Viewport Canvas with Framer Motion */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto bg-white dark:bg-slate-950 transition-colors duration-200">
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
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-200 gap-1.5">
                      <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                        <button
                          onClick={() => setBdigSubTab('canvas')}
                          className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                            bdigSubTab === 'canvas'
                              ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Interactive Knowledge Graph
                        </button>
                        <button
                          onClick={() => setBdigSubTab('workflow')}
                          className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                            bdigSubTab === 'workflow'
                              ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Mutation Workflow
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 pr-3 hidden md:inline">
                        Live MongoDB Graph Ontology
                      </span>
                    </div>

                    {bdigSubTab === 'canvas' ? (
                      <KnowledgeGraphView brandId={selectedBrandId} onNavigate={setCurrentTab} />
                    ) : (
                      <DependencyIntelligenceStudio brandId={selectedBrandId} />
                    )}
                  </div>
                )}

                {currentTab === 'content-studio' && (
                  <AssetInspector brandId={selectedBrandId} onSignRelease={handleSignRelease} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'impact-simulator' && (
                  <BlastRadiusSimulator brandId={selectedBrandId} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'multimodal' && (
                  <MultimodalInspectionView brandId={selectedBrandId} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'campaigns' && (
                  <CampaignIntelligenceView brandId={selectedBrandId} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'risks' && (
                  <RiskIntelligenceView brandId={selectedBrandId} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'approvals' && (
                  <ApprovalCenterView brandId={selectedBrandId} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'knowledge-base' && (
                  <BrandKnowledgeBaseView brandId={selectedBrandId} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'analytics' && (
                  <GovernanceAnalyticsView brandId={selectedBrandId} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'audit-trust' && (
                  <AuditTrustCenterView brandId={selectedBrandId} onNavigate={setCurrentTab} />
                )}

                {currentTab === 'public-verification' && (
                  <PublicVerificationView
                    initialBrand={currentBrand?.brand_name || 'Velora Money'}
                    onBack={() => setCurrentTab('command-center')}
                  />
                )}

                {currentTab === 'settings' && (
                  <SettingsView
                    brand={currentBrand}
                    dbStatus={dbStatus}
                    onReseed={handleReseed}
                    isReseeding={isReseeding}
                    onNavigate={setCurrentTab}
                  />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      </div>

      {/* Progressive Web App Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onPromptInstall={promptInstall}
      />

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
