import React, { useState, useEffect, lazy, Suspense } from 'react';
import { OfflineBanner } from './components/OfflineBanner';
import { InstallRecommendationBanner } from './components/InstallRecommendationBanner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { usePWA } from './hooks/usePWA';
import { useAuth, UserPersona } from './context/AuthContext';
import { BrandProfile, DatabaseStatus, VerificationResult } from './types';

// Lazy-load Login Page so users on landing or dashboards don't pay any bundle penalty
const LoginPage = lazy(() =>
  import('./components/LoginPage').then((m) => ({ default: m.LoginPage }))
);

// Lazy-load Landing Page so login view does not bundle 1,300+ lines of marketing UI
const LandingPage = lazy(() =>
  import('./components/LandingPage').then((m) => ({ default: m.LandingPage }))
);

// Lazy-load Public Verification View for zero-bundle penalty
const PublicVerificationView = lazy(() =>
  import('./components/PublicVerificationView').then((m) => ({ default: m.PublicVerificationView }))
);

// Lazy-load dedicated Creator Dashboard
const CreatorDashboard = lazy(() =>
  import('./components/creator/CreatorDashboard').then((m) => ({ default: m.CreatorDashboard }))
);

// Lazy-load dedicated Role Dashboard Stage (Agency, Reviewer, Compliance, Brand Owner)
const RoleDashboardStage = lazy(() =>
  import('./components/creator/RoleDashboardStage').then((m) => ({ default: m.RoleDashboardStage }))
);

// Lazy-load On-Demand Modals (only loaded when triggered by user interaction)
const DatabaseStatusModal = lazy(() =>
  import('./components/DatabaseStatusModal').then((m) => ({ default: m.DatabaseStatusModal }))
);
const DemoWalkthroughModal = lazy(() =>
  import('./components/DemoWalkthroughModal').then((m) => ({ default: m.DemoWalkthroughModal }))
);
const WelcomeModal = lazy(() =>
  import('./components/WelcomeModal').then((m) => ({ default: m.WelcomeModal }))
);
const GuidedTourOverlay = lazy(() =>
  import('./components/GuidedTourOverlay').then((m) => ({ default: m.GuidedTourOverlay }))
);
const InstallAppModal = lazy(() =>
  import('./components/InstallAppModal').then((m) => ({ default: m.InstallAppModal }))
);

const ViewLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-black transition-colors duration-200 min-h-screen">
    <div className="w-8 h-8 rounded-full border-2 border-neutral-800 border-t-indigo-500 animate-spin" />
    <span className="text-xs font-mono text-neutral-400 tracking-wide">
      Loading BrandTrace Workspace...
    </span>
  </div>
);

export const App: React.FC = () => {
  const { currentWorkspace, setWorkspace, user, isAuthenticated } = useAuth();

  const [viewMode, setViewMode] = useState<
    | 'landing'
    | 'login'
    | 'verify'
    | 'creator-dashboard'
    | 'agency-dashboard'
    | 'reviewer-dashboard'
    | 'compliance-dashboard'
    | 'brand-owner-dashboard'
  >(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname === '/login') return 'login';
      if (pathname === '/creator/check' || pathname.startsWith('/creator') || pathname === '/dashboard/creator' || pathname.startsWith('/dashboard/creator')) return 'creator-dashboard';
      if (pathname === '/dashboard/agency' || pathname.startsWith('/dashboard/agency')) return 'agency-dashboard';
      if (pathname === '/dashboard/reviewer' || pathname.startsWith('/dashboard/reviewer')) return 'reviewer-dashboard';
      if (pathname === '/dashboard/compliance' || pathname.startsWith('/dashboard/compliance')) return 'compliance-dashboard';
      if (pathname === '/dashboard/brand-owner' || pathname.startsWith('/dashboard/brand-owner')) return 'brand-owner-dashboard';
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'login') return 'login';
      if (params.get('view') === 'creator' || params.get('view') === 'creator-dashboard') return 'creator-dashboard';
      if (params.get('view') === 'agency' || params.get('view') === 'agency-dashboard') return 'agency-dashboard';
      if (params.get('view') === 'reviewer' || params.get('view') === 'reviewer-dashboard') return 'reviewer-dashboard';
      if (params.get('view') === 'compliance' || params.get('view') === 'compliance-dashboard') return 'compliance-dashboard';
      if (params.get('view') === 'brand-owner' || params.get('view') === 'brand-owner-dashboard') return 'brand-owner-dashboard';
      if (params.get('view') === 'verify' || window.location.hash === '#verify') return 'verify';
      return 'landing';
    }
    return 'landing';
  });

  // Track if user just transitioned from the sign-in page to play entrance motion once
  const [justLoggedIn, setJustLoggedIn] = useState<boolean>(false);

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
      if (pathname === '/login') {
        setViewMode('login');
      } else if (pathname === '/creator/check' || pathname.startsWith('/creator') || pathname === '/dashboard/creator' || pathname.startsWith('/dashboard/creator')) {
        setViewMode('creator-dashboard');
      } else if (pathname === '/dashboard/agency' || pathname.startsWith('/dashboard/agency')) {
        setViewMode('agency-dashboard');
      } else if (pathname === '/dashboard/reviewer' || pathname.startsWith('/dashboard/reviewer')) {
        setViewMode('reviewer-dashboard');
      } else if (pathname === '/dashboard/compliance' || pathname.startsWith('/dashboard/compliance')) {
        setViewMode('compliance-dashboard');
      } else if (pathname === '/dashboard/brand-owner' || pathname.startsWith('/dashboard/brand-owner')) {
        setViewMode('brand-owner-dashboard');
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
      window.history.pushState({ view: 'creator-dashboard' }, '', '/creator/check');
    }
  };

  const handleNavigateRole = (role: 'creator' | 'agency' | 'reviewer' | 'compliance' | 'brand-owner') => {
    const routeMap = {
      creator: 'creator-dashboard' as const,
      agency: 'agency-dashboard' as const,
      reviewer: 'reviewer-dashboard' as const,
      compliance: 'compliance-dashboard' as const,
      'brand-owner': 'brand-owner-dashboard' as const,
    };
    const targetMode = routeMap[role];
    setViewMode(targetMode);
    if (typeof window !== 'undefined') {
      const targetPath = role === 'creator' ? '/creator/check' : `/dashboard/${role}`;
      window.history.pushState({ view: targetMode }, '', targetPath);
    }
  };

  // User Requirement: When user logs in, the next view MUST go to the Landing Page only
  const handleLoginSuccess = (_authenticatedUser?: UserPersona) => {
    setJustLoggedIn(true);
    setViewMode('landing');
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'landing' }, '', '/');
    }
  };

  useEffect(() => {
    if (currentWorkspace && currentWorkspace !== selectedBrandId) {
      setSelectedBrandId(currentWorkspace);
    }
  }, [currentWorkspace, selectedBrandId]);

  // Load brands and DB telemetry ONLY when not on the login or verification page
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
    // Critical performance optimization: Never delay login screen by loading unrelated metadata
    if (viewMode === 'login' || viewMode === 'verify') return;
    loadInitialData();
  }, [viewMode]);

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

  const currentBrand = brands.find((b) => b.brand_id === selectedBrandId);
  const requestedRole =
    viewMode === 'creator-dashboard' ? 'creator' :
    viewMode === 'agency-dashboard' ? 'agency' :
    viewMode === 'reviewer-dashboard' ? 'reviewer' :
    viewMode === 'compliance-dashboard' ? 'compliance' :
    viewMode === 'brand-owner-dashboard' ? 'brand-owner' : null;
  const canAccessRequestedRole = !requestedRole || (
    isAuthenticated && !!user && (
      requestedRole === 'creator' && user.role === 'CREATOR' ||
      requestedRole === 'agency' && user.role === 'CREATOR' ||
      requestedRole === 'reviewer' && user.role === 'REVIEWER' ||
      requestedRole === 'compliance' && user.role === 'COMPLIANCE_REVIEWER' ||
      requestedRole === 'brand-owner' && (user.role === 'BRAND_MANAGER' || user.role === 'ADMIN')
    )
  );

  if (requestedRole && !canAccessRequestedRole) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 text-center">
          <h1 className="text-xl font-bold">Workspace access required</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Sign in with an authorized account for the {requestedRole} workspace.
          </p>
          <button
            type="button"
            onClick={() => {
              setViewMode('login');
              window.history.pushState({ view: 'login' }, '', '/login');
            }}
            className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold hover:bg-indigo-500"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  // 1. PUBLIC ZERO-AUTHENTICATION VERIFICATION VIEW
  if (viewMode === 'verify') {
    return (
      <ErrorBoundary onReset={() => setViewMode('landing')} fallbackTitle="Public Verification View Error">
        <Suspense fallback={<ViewLoadingFallback />}>
          <PublicVerificationView
            initialBrand={currentBrand?.brand_name || 'Aurelle Technologies'}
            onBack={() => {
              setViewMode('landing');
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 2. ULTRA-FAST LOGIN & REGISTRATION VIEW
  if (viewMode === 'login') {
    return (
      <ErrorBoundary onReset={() => setViewMode('landing')} fallbackTitle="Login Experience Error">
        <Suspense fallback={<ViewLoadingFallback />}>
          <LoginPage
            onSuccess={handleLoginSuccess}
            onOpenLanding={() => {
              setJustLoggedIn(false);
              setViewMode('landing');
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 3. DEDICATED INDEPENDENT CREATOR DASHBOARD VIEW
  if (viewMode === 'creator-dashboard') {
    return (
      <ErrorBoundary onReset={() => setViewMode('landing')} fallbackTitle="Creator Dashboard Error">
        <Suspense fallback={<ViewLoadingFallback />}>
          <CreatorDashboard
            brandName={currentBrand?.brand_name || 'Aurelle Skin'}
            onBackToLanding={() => {
              setViewMode('landing');
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 4. DEDICATED INDEPENDENT AGENCY DASHBOARD VIEW
  if (viewMode === 'agency-dashboard') {
    return (
      <ErrorBoundary onReset={() => setViewMode('landing')} fallbackTitle="Agency Dashboard Error">
        <Suspense fallback={<ViewLoadingFallback />}>
          <RoleDashboardStage
            role="agency"
            brandName={currentBrand?.brand_name || 'Aurelle Skin'}
            onBackToLanding={() => {
              setViewMode('landing');
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 5. DEDICATED INDEPENDENT REVIEWER DASHBOARD VIEW
  if (viewMode === 'reviewer-dashboard') {
    return (
      <ErrorBoundary onReset={() => setViewMode('landing')} fallbackTitle="Reviewer Dashboard Error">
        <Suspense fallback={<ViewLoadingFallback />}>
          <RoleDashboardStage
            role="reviewer"
            brandName={currentBrand?.brand_name || 'Aurelle Skin'}
            onBackToLanding={() => {
              setViewMode('landing');
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 6. DEDICATED INDEPENDENT COMPLIANCE DASHBOARD VIEW
  if (viewMode === 'compliance-dashboard') {
    return (
      <ErrorBoundary onReset={() => setViewMode('landing')} fallbackTitle="Compliance Dashboard Error">
        <Suspense fallback={<ViewLoadingFallback />}>
          <RoleDashboardStage
            role="compliance"
            brandName={currentBrand?.brand_name || 'Aurelle Skin'}
            onBackToLanding={() => {
              setViewMode('landing');
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // 7. DEDICATED INDEPENDENT BRAND OWNER DASHBOARD VIEW
  if (viewMode === 'brand-owner-dashboard') {
    return (
      <ErrorBoundary onReset={() => setViewMode('landing')} fallbackTitle="Brand Owner Dashboard Error">
        <Suspense fallback={<ViewLoadingFallback />}>
          <RoleDashboardStage
            role="brand-owner"
            brandName={currentBrand?.brand_name || 'Aurelle Skin'}
            onBackToLanding={() => {
              setViewMode('landing');
              if (typeof window !== 'undefined') window.history.pushState({}, '', '/');
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // PRIMARY VIEW: Unified Product-First Website (Lazy Loaded)
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-900 selection:text-white dark:selection:bg-blue-600 dark:selection:text-white overflow-x-hidden transition-colors duration-200">
      {/* Offline Status Guardrail Banner */}
      <OfflineBanner isOnline={isOnline} />

      {/* Main Unified Product-First Landing Page Experience */}
      <ErrorBoundary fallbackTitle="Landing Experience Error">
        <Suspense fallback={<ViewLoadingFallback />}>
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
            onVerify={() => {
              setViewMode('verify');
              if (typeof window !== 'undefined') window.history.pushState({ view: 'verify' }, '', '/verify');
            }}
            onSignIn={() => {
              setViewMode('login');
              if (typeof window !== 'undefined') window.history.pushState({ view: 'login' }, '', '/login');
            }}
            onOpenCreatorDashboard={handleOpenCreatorDashboard}
            onNavigateRole={handleNavigateRole}
            onSignRelease={handleSignRelease}
            onReseed={handleReseed}
            isReseeding={isReseeding}
            onOpenInstall={() => setIsInstallModalOpen(true)}
            isInstalled={isInstalled}
            onEnterApp={(targetTab) => {
              if (targetTab === 'public-verification') {
                setViewMode('verify');
                if (typeof window !== 'undefined') window.history.pushState({ view: 'verify' }, '', '/verify');
                return;
              }
              handleOpenCreatorDashboard();
            }}
          />
        </Suspense>
      </ErrorBoundary>

      {/* Progressive Web App Install Modal (Lazy) */}
      <Suspense fallback={null}>
        {isInstallModalOpen && (
          <InstallAppModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
            isInstallable={isInstallable}
            isInstalled={isInstalled}
            onPromptInstall={promptInstall}
          />
        )}
      </Suspense>

      {/* Progressive Web App Non-Intrusive Floating Recommendation Banner */}
      <InstallRecommendationBanner
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onPromptInstall={promptInstall}
        onOpenModal={() => setIsInstallModalOpen(true)}
      />

      {/* Database Telemetry Modal (Lazy) */}
      <Suspense fallback={null}>
        {isDbModalOpen && (
          <DatabaseStatusModal
            isOpen={isDbModalOpen}
            onClose={() => setIsDbModalOpen(false)}
            status={dbStatus}
          />
        )}
      </Suspense>

      {/* AURELLE Demo Walkthrough Modal (Lazy) */}
      <Suspense fallback={null}>
        {isDemoModalOpen && (
          <DemoWalkthroughModal
            isOpen={isDemoModalOpen}
            onClose={() => setIsDemoModalOpen(false)}
            onNavigateToView={() => {
              setIsDemoModalOpen(false);
              handleOpenCreatorDashboard();
            }}
          />
        )}
      </Suspense>

      {/* Welcome Onboarding Modal (Lazy) */}
      <Suspense fallback={null}>
        {isWelcomeModalOpen && (
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
              handleOpenCreatorDashboard();
            }}
          />
        )}
      </Suspense>

      {/* Interactive Guided Tour Overlay (Lazy) */}
      <Suspense fallback={null}>
        {isTourOpen && (
          <GuidedTourOverlay
            isOpen={isTourOpen}
            currentStepIndex={tourStepIndex}
            onStepChange={(idx, _tab) => {
              setTourStepIndex(idx);
            }}
            onClose={() => setIsTourOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;
