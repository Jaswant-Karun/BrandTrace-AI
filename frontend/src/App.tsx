import React, { useState, useEffect, lazy, Suspense } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { DemoWalkthroughModal } from './components/DemoWalkthroughModal';
import { WelcomeModal } from './components/WelcomeModal';
import { GuidedTourOverlay } from './components/GuidedTourOverlay';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallAppModal } from './components/InstallAppModal';
import { usePWA } from './hooks/usePWA';
import { useAuth } from './context/AuthContext';
import { BrandProfile, DatabaseStatus, VerificationResult } from './types';
import { WorkspaceCategory } from './components/ContextualWorkspace';

// Lazy-load Public Verification View for zero-bundle penalty
const PublicVerificationView = lazy(() =>
  import('./components/PublicVerificationView').then((m) => ({ default: m.PublicVerificationView }))
);

// Lazy-load dedicated Creator Dashboard
const CreatorDashboard = lazy(() =>
  import('./components/creator/CreatorDashboard').then((m) => ({ default: m.CreatorDashboard }))
);

const ViewLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-white dark:bg-slate-950 transition-colors duration-200 min-h-screen">
    <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-wide">
      Loading Verification Portal...
    </span>
  </div>
);

export const App: React.FC = () => {
  const { currentWorkspace, setWorkspace } = useAuth();

  const [viewMode, setViewMode] = useState<'landing' | 'login' | 'verify' | 'creator-dashboard'>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname === '/dashboard/creator' || pathname.startsWith('/dashboard/creator')) return 'creator-dashboard';
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'creator' || params.get('view') === 'creator-dashboard') return 'creator-dashboard';
      if (params.get('view') === 'verify' || window.location.hash === '#verify') return 'verify';
      if (params.get('view') === 'login') return 'login';
      return 'landing';
    }
    return 'landing';
  });

  // Track if user just transitioned from the sign-in page to play entrance motion once
  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);

  // Active Contextual Workspace Category in Section 5
  const [activeWorkspaceCategory, setActiveWorkspaceCategory] = useState<WorkspaceCategory | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('category') as WorkspaceCategory;
      if (catParam) return catParam;
      const tabParam = params.get('tab');
      if (tabParam === 'bdig' || tabParam === 'knowledge-base' || tabParam === 'knowledge-graph') return 'brand-knowledge';
      if (tabParam === 'content-studio' || tabParam === 'multimodal' || tabParam === 'inspector') return 'content-intelligence';
      if (tabParam === 'risks' || tabParam === 'campaigns') return 'risk-intelligence';
      if (tabParam === 'impact-simulator' || tabParam === 'blast-radius') return 'impact-simulation';
      if (tabParam === 'approvals' || tabParam === 'analytics') return 'governance-approval';
      if (tabParam === 'audit-trust' || tabParam === 'ledger') return 'trust-verification';
    }
    return null;
  });

  const [activeSubTab, setActiveSubTab] = useState<string | undefined>(undefined);

  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(currentWorkspace || 'aurelle-tech');
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  // Progressive Web App (PWA) & Offline Hook
  const { isOnline, isInstallable, isInstalled, promptInstall } = usePWA();

  // Modals & Tour State
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [tourStepIndex, setTourStepIndex] = useState<number>(0);
  const [isReseeding, setIsReseeding] = useState<boolean>(false);

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      if (pathname === '/dashboard/creator' || pathname.startsWith('/dashboard/creator')) {
        setViewMode('creator-dashboard');
      } else if (pathname === '/login') {
        setViewMode('login');
      } else if (pathname === '/verify' || window.location.hash === '#verify') {
        setViewMode('verify');
      } else {
        setViewMode('landing');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenCreatorDashboard = () => {
    setViewMode('creator-dashboard');
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'creator-dashboard' }, '', '/dashboard/creator');
    }
  };

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

  const handleSelectWorkspaceCategory = (category: WorkspaceCategory, subTab?: string) => {
    setActiveWorkspaceCategory(category);
    if (subTab) setActiveSubTab(subTab);
  };

  const handleCloseWorkspace = () => {
    setActiveWorkspaceCategory(null);
    setActiveSubTab(undefined);
  };

  const currentBrand = brands.find((b) => b.brand_id === selectedBrandId);

  // If user requests Public Verification Portal (Zero authentication required)
  if (viewMode === 'verify') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <PublicVerificationView
          initialBrand={currentBrand?.brand_name || 'Aurelle Technologies'}
          onBack={() => setViewMode('landing')}
        />
      </Suspense>
    );
  }

  // If user requests Sign In / Register Page
  if (viewMode === 'login') {
    return (
      <LoginPage
        onSuccess={() => {
          setJustLoggedIn(true);
          setViewMode('landing');
        }}
        onOpenLanding={() => {
          setJustLoggedIn(false);
          setViewMode('landing');
        }}
      />
    );
  }

  // DEDICATED INDEPENDENT CREATOR DASHBOARD VIEW
  if (viewMode === 'creator-dashboard') {
    return (
      <Suspense fallback={<ViewLoadingFallback />}>
        <CreatorDashboard
          brandName={currentBrand?.brand_name || 'Aurelle Skin'}
          onBackToLanding={() => {
            setViewMode('landing');
            if (typeof window !== 'undefined') {
              window.history.pushState({}, '', '/');
            }
          }}
        />
      </Suspense>
    );
  }

  // PRIMARY VIEW: Unified Product-First Website
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-900 selection:text-white dark:selection:bg-blue-600 dark:selection:text-white overflow-x-hidden transition-colors duration-200">
      {/* Offline Status Guardrail Banner */}
      <OfflineBanner isOnline={isOnline} />

      {/* Main Unified Product-First Landing Page Experience */}
      <LandingPage
        brandName={currentBrand?.brand_name || 'Aurelle Technologies'}
        animateEntrance={justLoggedIn}
        brands={brands}
        selectedBrandId={selectedBrandId}
        setSelectedBrandId={(id) => {
          setSelectedBrandId(id);
          setWorkspace(id);
        }}
        dbStatus={dbStatus}
        activeWorkspaceCategory={activeWorkspaceCategory}
        onSelectWorkspaceCategory={handleSelectWorkspaceCategory}
        onCloseWorkspace={handleCloseWorkspace}
        initialSubTab={activeSubTab}
        onVerify={() => setViewMode('verify')}
        onSignIn={() => setViewMode('login')}
        onOpenCreatorDashboard={handleOpenCreatorDashboard}
        onSignRelease={handleSignRelease}
        onReseed={handleReseed}
        isReseeding={isReseeding}
        onEnterApp={(targetTab) => {
          if (targetTab === 'public-verification') {
            setViewMode('verify');
            return;
          }
          if (targetTab === 'impact-simulator') {
            handleSelectWorkspaceCategory('impact-simulation', 'simulator');
          } else if (targetTab === 'approvals') {
            handleSelectWorkspaceCategory('governance-approval', 'approvals');
          } else if (targetTab === 'brand-knowledge' || targetTab === 'knowledge-base') {
            handleSelectWorkspaceCategory('brand-knowledge', 'guidelines');
          } else if (targetTab === 'ai-content-studio' || targetTab === 'content-studio') {
            handleSelectWorkspaceCategory('content-intelligence', 'inspector');
          } else if (targetTab === 'trust-ledger' || targetTab === 'audit-trust') {
            handleSelectWorkspaceCategory('trust-verification', 'ledger');
          } else {
            handleSelectWorkspaceCategory('content-intelligence', 'inspector');
          }
          setTimeout(() => {
            const el = document.getElementById('workspace');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
      />

      {/* Progressive Web App Install Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onPromptInstall={promptInstall}
      />

      {/* Database Telemetry Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
      />

      {/* AURELLE Demo Walkthrough Modal */}
      <DemoWalkthroughModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigateToView={(viewName) => {
          setIsDemoModalOpen(false);
          if (viewName.includes('Graph')) {
            handleSelectWorkspaceCategory('brand-knowledge', 'graph');
          } else if (viewName.includes('Simulator')) {
            handleSelectWorkspaceCategory('impact-simulation', 'simulator');
          } else if (viewName.includes('Approval')) {
            handleSelectWorkspaceCategory('governance-approval', 'approvals');
          } else if (viewName.includes('Audit')) {
            handleSelectWorkspaceCategory('trust-verification', 'ledger');
          } else if (viewName.includes('Knowledge')) {
            handleSelectWorkspaceCategory('brand-knowledge', 'guidelines');
          } else {
            handleSelectWorkspaceCategory('content-intelligence', 'inspector');
          }
          setTimeout(() => {
            const el = document.getElementById('workspace');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
      />

      {/* Welcome Onboarding Modal */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        onStartTour={() => {
          setIsWelcomeModalOpen(false);
          setIsTourOpen(true);
          setTourStepIndex(0);
        }}
        onLaunchDemoScenario={() => {
          setIsWelcomeModalOpen(false);
          handleSelectWorkspaceCategory('impact-simulation', 'simulator');
          setTimeout(() => {
            const el = document.getElementById('workspace');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
      />

      {/* Interactive Guided Tour Overlay */}
      <GuidedTourOverlay
        isOpen={isTourOpen}
        currentStepIndex={tourStepIndex}
        onStepChange={(idx, _tab) => {
          setTourStepIndex(idx);
        }}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
};

export default App;
