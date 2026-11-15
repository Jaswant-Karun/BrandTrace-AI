import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, GitFork, ArrowRight, Lock,
  CheckCircle2,
  Network, RotateCcw,
  Globe,
  X, Menu,
  Hash, Sliders,
  Heart, MessageCircle, Send, Bookmark,
  PenTool, Building2, ClipboardCheck, Megaphone
} from 'lucide-react';

import { PlumbBob } from './ui/PlumbBob';
import { useAuth } from '../context/AuthContext';
import { ContextualWorkspace, WorkspaceCategory } from './ContextualWorkspace';
import { BrandProfile, VerificationResult, DatabaseStatus } from '../types';

interface LandingPageProps {
  onEnterApp?: (targetTab?: string) => void;
  brandName?: string;
  onVerify?: () => void;
  onSignIn?: () => void;
  animateEntrance?: boolean;
  brands?: BrandProfile[];
  selectedBrandId?: string;
  setSelectedBrandId?: (id: string) => void;
  dbStatus?: DatabaseStatus | null;
  activeWorkspaceCategory?: WorkspaceCategory | null;
  onSelectWorkspaceCategory?: (category: WorkspaceCategory, subTab?: string) => void;
  onCloseWorkspace?: () => void;
  onSignRelease?: (result: VerificationResult, reviewerName: string) => Promise<void>;
  initialSubTab?: string;
  onReseed?: () => void;
  isReseeding?: boolean;
  onOpenCreatorDashboard?: () => void;
  onNavigateRole?: (role: RoleType) => void;
}

export type RoleType = 'creator' | 'agency' | 'reviewer' | 'compliance' | 'brand-owner';

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp = () => { },
  onVerify = () => { },
  onSignIn = () => { },
  brandName: _brandName = 'Apex Dynamics',
  animateEntrance,
  brands = [],
  selectedBrandId = 'aurelle-tech',
  setSelectedBrandId = () => { },
  dbStatus: _dbStatus = null,
  activeWorkspaceCategory = null,
  onSelectWorkspaceCategory,
  onCloseWorkspace,
  onSignRelease,
  initialSubTab,
  onReseed: _onReseed = () => { },
  isReseeding: _isReseeding = false,
  onOpenCreatorDashboard,
  onNavigateRole
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSecurityIndex, setActiveSecurityIndex] = useState<number | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(3);

  // Check if entrance animation was requested (either via prop or URL param ?fromLogin=true)
  const shouldAnimate = typeof animateEntrance === 'boolean'
    ? animateEntrance
    : (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('fromLogin') === 'true');

  // Motion choreography state for hero headline:
  // Default is 3 (text fully shown as permanent).
  // If arriving from sign in page, starts at 0 and runs once to 3, then stays permanent.
  const [motionStep, setMotionStep] = useState<number>(shouldAnimate ? 0 : 3);

  useEffect(() => {
    // If not arriving fresh from sign-in, keep text fully shown as permanent
    if (!shouldAnimate) {
      setMotionStep(3);
      return;
    }

    let t1: any;
    let t2: any;
    let t3: any;

    setMotionStep(0);
    t1 = setTimeout(() => setMotionStep(1), 900);
    t2 = setTimeout(() => setMotionStep(2), 1900);
    t3 = setTimeout(() => setMotionStep(3), 2900);

    // IMPORTANT: No auto-reset or loop! Once step 3 is reached, it remains permanently fully shown.
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [shouldAnimate]);

  const handleSelectCapability = (catId: WorkspaceCategory, targetSubTab?: string) => {
    if (onSelectWorkspaceCategory) {
      onSelectWorkspaceCategory(catId, targetSubTab);
    }
    setTimeout(() => {
      const el = document.getElementById('workspace');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 1 — TOP NAVIGATION                                          */}
      {/* ------------------------------------------------------------------- */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md transition-colors duration-200">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:pl-6 xl:pl-8 lg:pr-6 xl:pr-8 h-16 flex items-center justify-between gap-3 sm:gap-4">

          {/* Left: Brand Identity (Guaranteed single-line with shrink-0 & whitespace-nowrap) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base sm:text-lg whitespace-nowrap select-none">
                  BRANDTRACE<span className="text-indigo-600 dark:text-indigo-400">&nbsp;AI</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap hidden sm:inline-block">
                  Control Plane
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden md:block whitespace-nowrap">
                Autonomous Brand Intelligence &amp; Governance
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop - gap-3.5 on xl, gap-6 on 2xl for generous breathing room) */}
          <div className="hidden xl:flex items-center gap-3.5 2xl:gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <button onClick={() => scrollToSection('overview')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Overview
            </button>
            <button onClick={() => scrollToSection('roles')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Roles
            </button>
            {activeWorkspaceCategory && (
              <button
                onClick={() => scrollToSection('workspace')}
                className="text-blue-600 dark:text-blue-400 font-bold transition-colors cursor-pointer flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 px-2.5 py-1 rounded-full animate-pulse"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span>Active Workspace</span>
              </button>
            )}
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              How It Works
            </button>
            <button onClick={() => scrollToSection('digital-twin')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Digital Twin
            </button>
            <button onClick={() => scrollToSection('security')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Trust &amp; Security
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Public Verification Link (Shown when unauthenticated or on 2xl) */}
            <button
              onClick={onVerify || (() => onEnterApp('public-verification'))}
              className={`${isAuthenticated ? 'hidden 2xl:flex' : 'hidden lg:flex'} items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shadow-2xs shrink-0 whitespace-nowrap`}
              title="Verify Release Seals &amp; Content (Zero Authentication)"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Verify Release</span>
            </button>



            {/* If Authenticated: Show Account Indicator & Sign Out */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shrink-0 whitespace-nowrap">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">
                    {user?.name?.split(',')[0] || 'Alex Mercer'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden 2xl:inline">({user?.role?.replace('_', ' ') || 'MANAGER'})</span>
                </div>

                <button
                  onClick={() => {
                    logout();
                    if (onSignIn) onSignIn();
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 font-medium px-2 py-1 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Sign Out to Login Screen"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onSignIn}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Sign In
                </button>

                <button
                  onClick={onSignIn}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Mobile Menu Toggle Button (shown on screens smaller than xl) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 px-4 pt-3 pb-6 space-y-3"
            >
              <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <button onClick={() => scrollToSection('overview')} className="text-left py-1.5 hover:text-blue-600">Overview</button>
                <button onClick={() => scrollToSection('roles')} className="text-left py-1.5 hover:text-blue-600">Roles</button>
                {activeWorkspaceCategory && (
                  <button onClick={() => scrollToSection('workspace')} className="text-left py-1.5 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>Active Workspace</span>
                  </button>
                )}
                <button onClick={() => scrollToSection('how-it-works')} className="text-left py-1.5 hover:text-blue-600">How It Works</button>
                <button onClick={() => scrollToSection('digital-twin')} className="text-left py-1.5 hover:text-blue-600">Digital Twin</button>
                <button onClick={() => scrollToSection('security')} className="text-left py-1.5 hover:text-blue-600">Trust &amp; Security</button>
                <button onClick={onVerify || (() => onEnterApp && onEnterApp('public-verification'))} className="text-left py-1.5 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Public Verification Portal</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => handleSelectCapability('content-intelligence', 'inspector')}
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-blue-600 text-white text-center shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>Open Product Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        if (onSignIn) onSignIn();
                      }}
                      className="w-full py-1.5 text-xs text-rose-600 dark:text-rose-400 text-center"
                    >
                      Sign Out ({user?.name || 'User'})
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={onSignIn || (() => handleSelectCapability('content-intelligence', 'inspector'))}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-center"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={onSignIn || (() => handleSelectCapability('content-intelligence', 'inspector'))}
                      className="flex-1 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white text-center shadow-xs"
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 2 — HERO SECTION (Matching Reference Visual Design & Motion) */}
      {/* ------------------------------------------------------------------- */}
      <section id="overview" className="relative pt-4 sm:pt-8 pb-16 sm:pb-24 bg-black text-white overflow-hidden">
        {/* Subtle dark ambient glows */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/4 w-[700px] h-[450px] bg-indigo-950/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 right-10 w-[600px] h-[450px] bg-emerald-950/15 rounded-full blur-[140px]" />
        </div>

        {/* Subtle topographic contour wave lines matching reference images */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.22] stroke-neutral-700"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M-50 140 C 250 260, 650 60, 1500 200" strokeWidth="1.2" />
          <path d="M-50 240 C 300 360, 750 140, 1500 300" strokeWidth="1.2" />
          <path d="M-50 340 C 350 460, 850 220, 1500 400" strokeWidth="1.2" />
          <path d="M-50 440 C 400 560, 950 300, 1500 500" strokeWidth="1.2" />
          <path d="M-50 540 C 450 660, 1050 380, 1500 600" strokeWidth="1.2" />
          <path d="M-50 640 C 500 760, 1150 460, 1500 700" strokeWidth="1.2" />
        </svg>

        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:pl-6 xl:pl-8 lg:pr-6 xl:pr-8 relative z-10">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-start pt-1 sm:pt-2">

            {/* Left Column: Bold Editorial Typography & CTA */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6 text-left pl-0">

              <div className="space-y-3 select-none">

                {/* Meta Tag & Brand Context Pill */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-widest text-neutral-400 block">
                    BEFORE IT'S PUBLISHED
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 bg-neutral-900 border border-neutral-700 px-2.5 py-0.5 rounded-full">
                    AURELLE SKIN
                  </span>
                  <button
                    onClick={() => {
                      setMotionStep(0);
                      setTimeout(() => setMotionStep(1), 800);
                      setTimeout(() => setMotionStep(2), 1700);
                      setTimeout(() => setMotionStep(3), 2600);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                    title="Replay Motion Sequence"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Replay Motion</span>
                  </button>
                </div>

                {/* Typography Headline: Animated Motion Sequence */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[70px] 2xl:text-[76px] font-black tracking-tight text-white leading-[0.98] uppercase font-sans">
                  {/* Step 1: EVERY CLAIM (always displayed first) */}
                  <span className="block whitespace-nowrap">EVERY CLAIM</span>

                  {/* Step 2: CLINICALLY and PROVEN appear on separate lines, then struck through */}
                  <AnimatePresence>
                    {motionStep >= 1 && (
                      <motion.div
                        key="clinically-proven-block"
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -8 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden space-y-1 py-0.5"
                      >
                        {/* Line 2: CLINICALLY with coral strikethrough */}
                        <div className="leading-none">
                          <span className="relative inline-block leading-none">
                            <span className="text-[#ff6358] font-black whitespace-nowrap">
                              CLINICALLY
                            </span>
                            <motion.span
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: motionStep >= 2 ? 1 : 0 }}
                              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute top-1/2 left-0 right-0 h-[5px] sm:h-[6px] lg:h-[7px] xl:h-[8px] bg-[#ff6358] -translate-y-1/2 origin-left rounded-full pointer-events-none"
                            />
                          </span>
                        </div>

                        {/* Line 3: PROVEN with coral strikethrough */}
                        <div className="leading-none">
                          <span className="relative inline-block leading-none">
                            <span className="text-[#ff6358] font-black whitespace-nowrap">
                              PROVEN
                            </span>
                            <motion.span
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: motionStep >= 2 ? 1 : 0 }}
                              transition={{ duration: 0.45, delay: motionStep >= 2 ? 0.12 : 0, ease: [0.16, 1, 0.3, 1] }}
                              className="absolute top-1/2 left-0 right-0 h-[5px] sm:h-[6px] lg:h-[7px] xl:h-[8px] bg-[#ff6358] -translate-y-1/2 origin-left rounded-full pointer-events-none"
                            />
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 3: Green color font - lightly smaller & compact, 100% visible with zero clipping */}
                  <AnimatePresence>
                    {motionStep >= 3 && (
                      <motion.div
                        key="shown-to-visibly-reduce-block"
                        initial={{ opacity: 0, height: 0, y: 8 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: 8 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden text-[#10b981] py-1 text-2xl sm:text-4xl lg:text-[42px] xl:text-[48px] 2xl:text-[52px] font-black leading-[1.02] tracking-tight pr-4"
                      >
                        <span className="block whitespace-nowrap">
                          SHOWN TO VISIBLY
                        </span>
                        <span className="block whitespace-nowrap">
                          REDUCE*
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Step 1 & Anchor: CHECKED. (always displayed first with EVERY CLAIM) */}
                  <div className="block text-white pt-1 whitespace-nowrap">
                    CHECKED.
                  </div>
                </h1>
              </div>

              {/* Substantiation Footnote directly matching reference */}
              <motion.p
                animate={{ opacity: motionStep >= 3 ? 1 : 0, y: motionStep >= 3 ? 0 : 4 }}
                transition={{ duration: 0.4 }}
                className="text-xs sm:text-sm font-mono text-neutral-400 pt-2"
              >
                *FACT-014 · 32% fewer visible dark spots in 8 weeks · in-house study, 48 participants
              </motion.p>

              {/* Subtitle Statement */}
              <p className="text-sm sm:text-base font-bold text-white/80 uppercase tracking-tight max-w-xl leading-snug">
                CHECK MARKETING CONTENT AGAINST YOUR BRAND'S OWN RULES AND FACTS, BEFORE IT'S PUBLISHED.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleSelectCapability('content-intelligence', 'inspector')}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer ring-2 ring-blue-500/20"
                >
                  <span>Open Product Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollToSection('roles')}
                  className="px-5 py-3.5 rounded-xl text-sm font-semibold text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Roles</span>
                </button>

                <button
                  onClick={onVerify || (() => onEnterApp && onEnterApp('public-verification'))}
                  className="px-5 py-3.5 rounded-xl text-sm font-semibold text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Public Verification</span>
                </button>
              </div>

            </div>

            {/* Right Column: Visual Book Document & Floating Issues with Animated Seal (Compact Editorial Book Design) */}
            <div className="lg:col-span-5 xl:col-span-5 relative pb-16 sm:pb-20 flex justify-end">
              {/* Plumb Bob Motif hanging along the left edge */}
              <div className="hidden lg:block absolute -top-8 -left-5 pointer-events-none select-none z-20">
                <PlumbBob stringLength={140} />
              </div>

              {/* Composition Container with subtle dark blueprint / glow background */}
              <div className="relative w-full max-w-[560px] lg:max-w-[620px] ml-auto p-2.5 sm:p-3 pb-0 rounded-2xl sm:rounded-3xl bg-neutral-950/80 border border-neutral-800 shadow-2xl backdrop-blur-md overflow-visible">

                {/* Background ambient lighting */}
                <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-2.5 lg:gap-3 items-start">

                  {/* Left Sheet: Main UI Book Document Sheet with Subtle Slanted Layered-Paper Appearance */}
                  <div className="md:col-span-7 relative group">
                    {/* Subtle stacked under-paper edge shadow creating authentic editorial book folio depth */}
                    <div className="absolute inset-0 bg-slate-200/60 dark:bg-slate-800/50 rounded-2xl rotate-[0.85deg] translate-x-1 translate-y-1 shadow-md border border-slate-300/40 dark:border-slate-700/40 pointer-events-none -z-10" />

                    {/* Main White Paper Surface */}
                    <div className="bg-white dark:bg-[#fcfbf9] text-slate-900 rounded-2xl p-3 sm:p-3.5 shadow-xl border border-slate-200/80 relative overflow-hidden -rotate-[0.75deg] sm:-rotate-[0.9deg] transition-transform duration-300">

                      {/* Orange Vertical Accent Margin Line */}
                      <div className="absolute top-3 left-0 w-1 sm:w-1.5 h-7 bg-amber-500 rounded-r" />

                      {/* Top Metadata Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-slate-100 pl-2">
                        <div>
                          <div className="font-sans font-bold text-slate-900 text-[11.5px] sm:text-xs tracking-tight">
                            BrandTrace AI — Diwali Product Awareness Campaign
                          </div>
                          <div className="font-sans font-medium text-slate-500 text-[9px] mt-0.5">
                            Campaign: Diwali Brand Governance Campaign · Platform: Instagram
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-sans font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                            Sample Demonstration
                          </span>
                          <span className="text-[8px] text-slate-400 font-sans mt-0.5">
                            2 sample findings
                          </span>
                        </div>
                      </div>

                      {/* Editorial Body Copy with Numbered Badges & Underlines */}
                      <div className="pt-2 pl-2 font-serif text-[12.5px] sm:text-[13px] text-slate-900 leading-[1.6] selection:bg-amber-100">
                        <p>
                          Make every brand decision count this Diwali. BrandTrace AI helps teams review marketing content against approved brand guidelines,{' '}
                          <span className="relative inline">
                            <span className="underline decoration-[#e11d48] decoration-2 underline-offset-4 font-normal">
                              identify unsupported claims
                            </span>
                            <span className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1 -mt-1 text-[8px] font-sans font-bold text-white bg-[#e11d48] rounded-full shadow-xs">
                              1
                            </span>
                          </span>
                          , assess potential risks, and{' '}
                          <span className="relative inline">
                            <span className="underline decoration-[#e11d48] decoration-2 underline-offset-4 font-normal">
                              trace authorised approvals
                            </span>
                            <span className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1 -mt-1 text-[8px] font-sans font-bold text-white bg-[#e11d48] rounded-full shadow-xs">
                              2
                            </span>
                          </span>
                          . Detect. Predict. Verify. Prevent.
                        </p>
                      </div>

                      {/* Document Footer Meta - Tightly attached right below copy */}
                      <div className="pt-2 pl-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[8.5px] sm:text-[9px] font-mono text-slate-400">
                        <span>DOC-GOV-2026 · BRANDTRACE AUDIT</span>
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          VLM VERIFIED (DEMO)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Stacked Floating Issue Cards with Subtle Contrasting Book Slant */}
                  <div className="md:col-span-5 space-y-1.5 sm:space-y-2 relative flex flex-col justify-start rotate-[0.4deg] sm:rotate-[0.6deg]">

                    {/* Dotted connecting line behind cards */}
                    <div className="hidden md:block absolute -left-2 top-3 bottom-2 border-l border-dashed border-slate-700/50 pointer-events-none" />

                    {/* Issue Card 1 */}
                    <div className="bg-white rounded-xl p-2 sm:p-2.5 shadow-md border border-slate-100/90 relative">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#e11d48] text-white font-bold text-[8.5px] flex items-center justify-center shrink-0">
                            1
                          </span>
                          <h4 className="font-bold text-slate-900 text-[11px] sm:text-[11.5px] font-sans tracking-tight">
                            Unsupported performance claim
                          </h4>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[8px] font-sans font-semibold border border-rose-200/60 shrink-0">
                          Sample Finding
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-sans pl-5 mt-0.5">
                        Approved Brand Claims · Rule Engine
                      </div>
                      <div className="pl-5 flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 line-through text-[9px] font-mono font-medium">
                          identify unsupported claims
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold">
                          link to approved source
                        </span>
                      </div>
                      <div className="text-[8.5px] text-slate-500 font-sans pl-5 mt-1 pt-0.5 border-t border-slate-100">
                        <span className="font-medium text-slate-600">Rec:</span> Link claim to approved evidence or mark for review.
                      </div>
                    </div>

                    {/* Issue Card 2 */}
                    <div className="bg-white rounded-xl p-2 sm:p-2.5 shadow-md border border-slate-100/90 relative -rotate-[0.2deg]">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-full bg-[#e11d48] text-white font-bold text-[8.5px] flex items-center justify-center shrink-0">
                            2
                          </span>
                          <h4 className="font-bold text-slate-900 text-[11px] sm:text-[11.5px] font-sans tracking-tight">
                            Unverified capability claim
                          </h4>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[8px] font-sans font-semibold border border-rose-200/60 shrink-0">
                          Sample Finding
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-sans pl-5 mt-0.5">
                        Product Capability Substantiation · AI Review
                      </div>
                      <div className="pl-5 flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 line-through text-[9px] font-mono font-medium">
                          trace authorised approvals
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold">
                          confirmed in docs
                        </span>
                      </div>
                      <div className="text-[8.5px] text-slate-500 font-sans pl-5 mt-1 pt-0.5 border-t border-slate-100">
                        <span className="font-medium text-slate-600">Rec:</span> Confirm capability against documentation &amp; implementation.
                      </div>
                    </div>

                  </div>

                </div>

                {/* Motion Approved Circular Stamp Seal ("APPROVED VLM-SEALED") */}
                {/* Centered directly on the container's bottom border line: the line passes right through the middle of the logo */}
                <div className="mt-3 -mb-[75px] sm:-mb-[75px] flex justify-center items-center relative z-20 select-none">
                  <motion.div
                    key={`stamp-seal-${motionStep}`}
                    initial={{ scale: 2.3, opacity: 0, rotate: -32 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    transition={{
                      delay: 0.35,
                      duration: 0.45,
                      type: 'spring',
                      damping: 13,
                      stiffness: 250
                    }}
                    className="relative flex items-center justify-center select-none"
                  >
                    {/* Concentric Double Rings */}
                    <div className="w-34 h-34 sm:w-38 sm:h-38 lg:w-[150px] lg:h-[150px] rounded-full border-2 border-emerald-500/90 bg-[#06281e]/95 backdrop-blur-md shadow-[0_0_35px_rgba(16,185,129,0.35)] flex items-center justify-center p-2 hover:scale-105 transition-transform duration-200 cursor-default">
                      <div className="w-full h-full rounded-full border border-dashed border-emerald-400/85 flex flex-col items-center justify-center text-center p-2.5">
                        <span className="text-sm sm:text-[15px] lg:text-[16px] font-black tracking-widest text-emerald-300 uppercase font-sans">
                          APPROVED
                        </span>
                        <div className="w-14 sm:w-16 h-[1.5px] bg-emerald-500/70 my-1" />
                        <span className="text-[10px] sm:text-[11px] lg:text-xs font-mono font-extrabold tracking-widest text-emerald-400">
                          VLM-SEALED
                        </span>
                      </div>
                    </div>

                    {/* Shockwave Impact Ring upon sealing */}
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: [0.85, 1.45], opacity: [0.9, 0] }}
                      transition={{ delay: 0.42, duration: 0.6, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full border-2 border-emerald-400 pointer-events-none"
                    />
                  </motion.div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* LIVE GOVERNANCE RULE TICKER (Prominent & Larger per Image 2)      */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-14 border-y border-slate-700/80 bg-[#070b14] text-slate-100 py-5 sm:py-6 overflow-hidden select-none shadow-xl">
          <div className="animate-ticker text-sm sm:text-base lg:text-lg font-mono tracking-wider uppercase font-bold flex items-center gap-12 sm:gap-16">
            <span className="text-amber-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-amber-500">◆</span>
              "MUMBAI FLEET LAUNCH" EMBARGOED UNTIL DECEMBER (FACT-033)
            </span>
            <span className="text-emerald-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-emerald-500">◆</span>
              800V CHARGING OPERATES STRICTLY BELOW 65°C THERMAL STANDARD
            </span>
            <span className="text-rose-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-rose-500">◆</span>
              FDA 21 CFR §870: NON-DIAGNOSTIC WELLNESS DISCLOSURE REQUIRED
            </span>
            <span className="text-cyan-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-cyan-500">◆</span>
              QUANTUMACOUSTICS MUST CARRY ™ TRADEMARK SYMBOL (LANHAM §43a)
            </span>
            <span className="text-amber-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-amber-500">◆</span>
              CLOUD STUDIO SUBSCRIPTION PRICE IS ₹499/MO (FACT-AUR-PRC-01)
            </span>
            <span className="text-rose-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-rose-500">◆</span>
              BANNED SUPERLATIVE: "WORLD'S FIRST AUTONOMOUS" FLAGGED BY NHTSA GATE
            </span>
            {/* Duplicate for infinite seamless loop */}
            <span className="text-amber-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-amber-500">◆</span>
              "MUMBAI FLEET LAUNCH" EMBARGOED UNTIL DECEMBER (FACT-033)
            </span>
            <span className="text-emerald-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-emerald-500">◆</span>
              800V CHARGING OPERATES STRICTLY BELOW 65°C THERMAL STANDARD
            </span>
            <span className="text-rose-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-rose-500">◆</span>
              FDA 21 CFR §870: NON-DIAGNOSTIC WELLNESS DISCLOSURE REQUIRED
            </span>
            <span className="text-cyan-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-cyan-500">◆</span>
              QUANTUMACOUSTICS MUST CARRY ™ TRADEMARK SYMBOL (LANHAM §43a)
            </span>
            <span className="text-amber-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-amber-500">◆</span>
              CLOUD STUDIO SUBSCRIPTION PRICE IS ₹499/MO (FACT-AUR-PRC-01)
            </span>
            <span className="text-rose-400 flex items-center gap-2">
              <span className="text-base sm:text-xl text-rose-500">◆</span>
              BANNED SUPERLATIVE: "WORLD'S FIRST AUTONOMOUS" FLAGGED BY NHTSA GATE
            </span>
          </div>
        </div>

      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 4 — PROBLEM SECTION (Staggered Editorial Images & Live Scan) */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-20 sm:py-28 bg-black text-white border-b border-neutral-900 transition-colors relative overflow-hidden">
        {/* Subtle background ambient vertical grid guides matching Plumbline */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] stroke-neutral-500">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:pl-6 xl:pl-8 lg:pr-6 xl:pr-8 space-y-16 relative z-10">

          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-500">
              THE PROBLEM
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              CONTENT COMES FROM EVERYONE NOW. <br />
              <span className="text-rose-500">SO DO THE MISTAKES.</span>
            </h2>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
              Writers, agencies, influencers and AI tools all post for the brand. The brand book is a PDF none of them has open.
            </p>
          </div>

          {/* 3 Staggered, Non-Formal Editorial Image Cards with Live AI Scanning Effect */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 lg:gap-8 xl:gap-10">

            {/* Card 1: INSTAGRAM POST (BIG & TALL on Left) */}
            <div className="w-full max-w-[420px] lg:max-w-[440px] shrink-0 bg-[#fbf9f5] text-slate-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header with dots */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/80 text-[11px] font-mono text-neutral-400 bg-white">
                  <span className="font-bold uppercase tracking-wider text-neutral-800">INSTAGRAM POST</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-300" />
                    <span className="w-2 h-2 rounded-full bg-neutral-300" />
                  </div>
                </div>

                {/* Account row */}
                <div className="p-3.5 flex items-center justify-between border-b border-neutral-200/80 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      A
                    </div>
                    <span className="text-xs font-bold text-neutral-900 font-sans">aurelle.skin</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-medium">Sponsored</span>
                </div>

                {/* Visual Body with Real Serum Image & Live Scanning Effect */}
                <div className="relative w-full h-[320px] sm:h-[350px] overflow-hidden bg-stone-100 flex items-center justify-center group cursor-crosshair">
                  <img
                    src="/images/instagram_serum_pedestal.jpg"
                    alt="Aurelle Skin Vitamin C Serum on Pedestal"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Multimodal AI Scanning Laser Line (Smooth top-to-bottom sweep) */}
                  <motion.div
                    animate={{ y: [-10, 320, -10] }}
                    transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.95)] z-20 pointer-events-none"
                  >
                    <div className="h-12 -mt-12 bg-gradient-to-t from-cyan-400/20 to-transparent pointer-events-none" />
                  </motion.div>

                  {/* Red dashed detection bounding box - Appears on Hover */}
                  <div className="absolute bottom-6 left-6 right-6 border-2 border-dashed border-rose-500 rounded p-1.5 pointer-events-none z-10 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-rose-500" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-rose-500" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-rose-500" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-rose-500" />
                  </div>

                  {/* Floating Inspection Chip - Appears only when pointing pointer in that image */}
                  <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-md border border-rose-500/70 shadow-2xl rounded-xl p-2.5 max-w-[210px] text-left z-20 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-300 ease-out">
                    <div className="text-[9.5px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span>BLOCKS · VLM EVIDENCE</span>
                    </div>
                    <p className="text-[10px] text-neutral-200 font-sans mt-0.5 leading-snug">
                      "by 60% in just 2 weeks": clinical evidence says 32% in 8 weeks (FACT-014).
                    </p>
                  </div>
                </div>

                {/* Social interactions & Caption */}
                <div className="p-4 bg-white space-y-2 border-t border-neutral-200/80">
                  <div className="flex items-center justify-between text-neutral-700">
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <MessageCircle className="w-4 h-4" />
                      <Send className="w-4 h-4" />
                    </div>
                    <Bookmark className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-neutral-800 leading-relaxed font-sans pt-1">
                    <strong className="text-neutral-900 mr-1.5">aurelle.skin</strong>
                    Meet the NEW Vitamin C serum! Clinically proven to fade dark spots{' '}
                    <span className="relative inline-block px-1 bg-rose-100 text-rose-700 font-bold rounded">
                      <span className="line-through decoration-rose-600 decoration-2">
                        by 60% in just 2 weeks.
                      </span>
                    </span>
                  </p>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="p-3 bg-neutral-950 text-neutral-100 border-t border-neutral-800 text-xs flex items-start gap-2 select-none">
                <span className="text-rose-400 font-bold text-sm">◆</span>
                <span className="leading-snug text-[11px] font-mono">
                  <strong className="text-rose-300 uppercase">BLOCKS 60% in 2 weeks:</strong> the evidence says 32% in 8 (FACT-014)
                </span>
              </div>
            </div>

            {/* Card 2: WEB BANNER (COMPACT / STAGGERED / MEDIUM - Floating Higher) */}
            <div className="w-full max-w-[340px] lg:max-w-[360px] shrink-0 bg-[#fbf9f5] text-slate-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col justify-between self-start lg:-translate-y-4">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/80 text-[11px] font-mono text-neutral-400 bg-white">
                  <span className="font-bold uppercase tracking-wider text-neutral-800">WEB BANNER</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-300" />
                    <span className="w-2 h-2 rounded-full bg-neutral-300" />
                  </div>
                </div>

                {/* Banner Body with Real Uploaded Serum Image & Live Scanning Effect */}
                <div className="relative w-full h-[280px] sm:h-[300px] overflow-hidden bg-amber-50 group cursor-crosshair">
                  <img
                    src="/images/serum_scan_glow.jpg"
                    alt="Aurelle Glow In 2 Weeks Banner"
                    className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Scanning Laser Beam */}
                  <motion.div
                    animate={{ y: [-10, 270, -10] }}
                    transition={{ duration: 3.2, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-[2px] bg-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.95)] z-20 pointer-events-none"
                  >
                    <div className="h-10 -mt-10 bg-gradient-to-t from-rose-400/20 to-transparent pointer-events-none" />
                  </motion.div>

                  {/* Red dashed detection bounding box around "GLOW IN 2 WEEKS" - Appears on Hover */}
                  <div className="absolute top-3 left-3 w-40 h-16 border-2 border-dashed border-rose-500 rounded p-1 pointer-events-none z-10 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-rose-500" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-rose-500" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-rose-500" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-rose-500" />
                  </div>

                  {/* Floating Inspection Chip - Appears only when pointing pointer in that image */}
                  <div className="absolute top-3 right-3 bg-black/90 backdrop-blur-md border border-rose-500/70 shadow-2xl rounded-xl p-2 max-w-[165px] text-left z-20 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-300 ease-out">
                    <div className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span>BLOCKS · A11Y</span>
                    </div>
                    <p className="text-[9.5px] text-neutral-200 font-sans mt-0.5 leading-snug">
                      "GLOW IN 2 WEEKS" is 1.96:1. Large text needs 3:1.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Alert Pill */}
              <div className="p-3 bg-neutral-950 text-neutral-100 border-t border-neutral-800 text-xs flex items-start gap-2 select-none">
                <span className="text-rose-400 font-bold text-sm">◆</span>
                <span className="leading-snug text-[11px] font-mono">
                  <strong className="text-rose-300 uppercase">BLOCKS "Glow in 2 weeks":</strong> evidence covers 8 weeks, not 2 (FACT-014)
                </span>
              </div>
            </div>

            {/* Card 3: EMAIL (WIDE / STAGGERED on Right - Floating Slightly Lower) */}
            <div className="w-full max-w-[400px] lg:max-w-[420px] shrink-0 bg-[#fbf9f5] text-slate-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col justify-between self-start lg:translate-y-6">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200/80 text-[11px] font-mono text-neutral-400 bg-white">
                  <span className="font-bold uppercase tracking-wider text-neutral-800">EMAIL</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neutral-300" />
                    <span className="w-2 h-2 rounded-full bg-neutral-300" />
                  </div>
                </div>

                {/* Email Metadata */}
                <div className="p-3.5 bg-white border-b border-neutral-200/80 space-y-0.5 text-xs text-neutral-600 font-sans">
                  <div><span className="text-neutral-400 font-medium">From</span> <strong className="text-neutral-900 ml-1">Aurelle Skin</strong></div>
                  <div><span className="text-neutral-400 font-medium">Subject</span> <strong className="text-neutral-900 ml-1">Something big is coming</strong></div>
                </div>

                {/* Email Visual with Live Scanning Effect */}
                <div className="relative w-full h-[180px] sm:h-[195px] overflow-hidden bg-stone-100 flex items-center justify-center group cursor-crosshair">
                  <img
                    src="/images/email_swatches_leaves.jpg"
                    alt="Diwali Campaign Swatches"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Scanning Laser Beam */}
                  <motion.div
                    animate={{ y: [-10, 180, -10] }}
                    transition={{ duration: 3.6, delay: 1.0, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.95)] z-20 pointer-events-none"
                  >
                    <div className="h-8 -mt-8 bg-gradient-to-t from-cyan-400/20 to-transparent pointer-events-none" />
                  </motion.div>

                  {/* Red dashed detection bounding box around swatches - Appears on Hover */}
                  <div className="absolute inset-x-6 top-3 bottom-3 border-2 border-dashed border-rose-500 rounded p-1.5 pointer-events-none z-10 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-rose-500" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-rose-500" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-rose-500" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-rose-500" />
                  </div>

                  {/* Floating Inspection Chip - Appears only when pointing pointer in that image */}
                  <div className="absolute top-3 right-3 bg-black/90 backdrop-blur-md border border-rose-500/70 shadow-2xl rounded-xl p-2 max-w-[190px] text-left z-20 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-300 ease-out">
                    <div className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span>BLOCKS · EMBARGO</span>
                    </div>
                    <p className="text-[9.5px] text-neutral-200 font-sans mt-0.5 leading-snug">
                      Diwali campaign is embargoed until official launch (FACT-033).
                    </p>
                  </div>
                </div>

                {/* Email Content Body */}
                <div className="p-4 bg-white space-y-3">
                  <p className="text-xs sm:text-sm font-extrabold tracking-tight uppercase leading-snug text-neutral-900">
                    <span className="relative inline-block">
                      <span className="underline decoration-rose-500 decoration-wavy decoration-2 text-rose-600">
                        OUR DIWALI SALE IS HERE:
                      </span>
                    </span>{' '}
                    20% OFF EVERYTHING.
                  </p>
                  <button className="px-4 py-1.5 rounded-full bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer">
                    SHOP NOW
                  </button>
                </div>
              </div>

              {/* Bottom Alert Pill */}
              <div className="p-3 bg-neutral-950 text-neutral-100 border-t border-neutral-800 text-xs flex items-start gap-2 select-none">
                <span className="text-rose-400 font-bold text-sm">◆</span>
                <span className="leading-snug text-[11px] font-mono">
                  <strong className="text-rose-300 uppercase">BLOCKS</strong> Announces the Diwali sale while it's still embargoed (FACT-033)
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 5 — ON-DEMAND CONTEXTUAL PRODUCT WORKSPACE                  */}
      {/* ------------------------------------------------------------------- */}
      <AnimatePresence>
        {activeWorkspaceCategory && (
          <motion.div
            key="contextual-workspace-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <ContextualWorkspace
              activeCategory={activeWorkspaceCategory}
              onClose={() => {
                if (onCloseWorkspace) onCloseWorkspace();
              }}
              selectedBrandId={selectedBrandId}
              setSelectedBrandId={setSelectedBrandId}
              brands={brands}
              onSignRelease={onSignRelease}
              initialSubTab={initialSubTab}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 6 — HOW IT WORKS (Homage to reference 6-step cards)         */}
      {/* ------------------------------------------------------------------- */}
      <section id="how-it-works" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Explainable Methodology
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Checked Against Your Rulebook and Your Facts. With the Evidence.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            A transparent six-stage pipeline that guarantees explainable oversight at every step.
          </p>
        </div>

        {/* Continuous 6-Step Bento Grid Matching Reference Image 1 */}
        <div
          className="rounded-2xl sm:rounded-3xl border border-neutral-800 bg-[#0e0e11] overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-3 select-none"
          onMouseLeave={() => setActiveStepIndex(3)}
        >
          {[
            {
              step: 'STEP 1 OF 6',
              title: 'PASTE OR UPLOAD',
              desc: 'A draft, a DOCX, a PDF or an image. Text inside images is read too.',
              borderClasses: 'border-b border-neutral-800/90 md:border-r'
            },
            {
              step: 'STEP 2 OF 6',
              title: 'RULES RUN FIRST',
              desc: 'Your banned phrases, required labels, product names, contrast and alt text, checked by code.',
              borderClasses: 'border-b border-neutral-800/90 md:border-r'
            },
            {
              step: 'STEP 3 OF 6',
              title: 'CLAIMS MEET THE FACTS',
              desc: 'Every claim is matched to your fact ledger: supported, contradicted, expired or unsupported.',
              borderClasses: 'border-b border-neutral-800/90'
            },
            {
              step: 'STEP 4 OF 6',
              title: 'EVIDENCE OR SILENCE',
              desc: 'A finding only shows if it names a real rule or fact and quotes your exact words.',
              borderClasses: 'border-b md:border-b-0 border-neutral-800/90 md:border-r'
            },
            {
              step: 'STEP 5 OF 6',
              title: 'FIXED WITHOUT INVENTING',
              desc: 'Claims are fixed only with approved wording; your call to action and key phrases are kept.',
              borderClasses: 'border-b md:border-b-0 border-neutral-800/90 md:border-r'
            },
            {
              step: 'STEP 6 OF 6',
              title: 'REVIEWED AND RECORDED',
              desc: 'Reviewers decide, approvals are routed, and every step lands in a tamper-evident log.',
              borderClasses: ''
            }
          ].map((item, i) => {
            const isStepActive = activeStepIndex === i;
            return (
              <div
                key={i}
                tabIndex={0}
                role="article"
                aria-label={`${item.step}: ${item.title}`}
                onMouseEnter={() => setActiveStepIndex(i)}
                onFocus={() => setActiveStepIndex(i)}
                className={`p-7 sm:p-9 lg:p-10 flex flex-col justify-start space-y-3.5 transition-all duration-200 ease-out cursor-pointer outline-none ${item.borderClasses} ${isStepActive
                  ? 'bg-[#f4f2ea] text-neutral-900 shadow-inner'
                  : 'bg-[#121215] text-white hover:bg-[#18181c]'
                  }`}
              >
                <span className={`text-[11px] sm:text-xs font-mono font-semibold tracking-wider uppercase block transition-colors duration-200 ${isStepActive ? 'text-neutral-500' : 'text-neutral-400'
                  }`}>
                  {item.step}
                </span>
                <h3 className={`text-lg sm:text-xl font-extrabold tracking-tight uppercase leading-snug transition-colors duration-200 ${isStepActive ? 'text-neutral-950 font-sans' : 'text-white font-sans'
                  }`}>
                  {item.title}
                </h3>
                <p className={`text-xs sm:text-sm leading-relaxed font-sans transition-colors duration-200 ${isStepActive ? 'text-neutral-700' : 'text-neutral-300'
                  }`}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 7 — SIGNATURE INNOVATION (Brand Governance Digital Twin)    */}
      {/* ------------------------------------------------------------------- */}
      <section id="digital-twin" className="py-20 sm:py-28 bg-black text-white overflow-hidden relative border-b border-neutral-900">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:pl-6 xl:pl-8 lg:pr-6 xl:pr-8 space-y-12">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

            {/* Left text */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 border border-indigo-700 text-indigo-300">
                <Network className="w-3.5 h-3.5 text-indigo-400" />
                <span>SIGNATURE INNOVATION</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                The Brand Governance <br />
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Digital Twin
                </span>
              </h2>

              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                Ordinary tools lint the text in front of them in isolation. The BrandTrace Digital Twin simulates the cascading consequences of a proposed fact or policy change <em>before</em> an authorized change is committed.
              </p>

              {/* Realistic Demonstration Comparison */}
              <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400">
                  Illustrative Simulation Scenario (Synthetic Demo Data)
                </span>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-2.5 bg-neutral-900 rounded-lg border border-neutral-800">
                    <span className="text-neutral-400 text-[10px] block">APPROVED PRICE</span>
                    <strong className="text-emerald-400 text-sm">₹499 / month</strong>
                    <span className="text-neutral-500 text-[10px] block mt-0.5">FACT-AUR-PRC-01</span>
                  </div>
                  <div className="p-2.5 bg-neutral-900 rounded-lg border border-indigo-800">
                    <span className="text-neutral-400 text-[10px] block">PROPOSED MUTATION</span>
                    <strong className="text-cyan-400 text-sm">₹599 / month</strong>
                    <span className="text-indigo-400 text-[10px] block mt-0.5">Semi-Annual Revision</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800 text-center font-mono">
                  <div>
                    <span className="text-neutral-400 text-[10px] block">AFFECTED TOUCHPOINTS</span>
                    <strong className="text-white text-xs">4 Assets</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">EXPOSURE AT RISK</span>
                    <strong className="text-rose-400 text-xs">$320,000</strong>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-[10px] block">ESTIMATED WORKLOAD</span>
                    <strong className="text-amber-400 text-xs">12.5 Hours</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSelectCapability('impact-simulation', 'simulator')}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-neutral-900 bg-white hover:bg-neutral-100 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Launch Change Impact Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Right: Graph Canvas Simulation Preview Card */}
            <div className="lg:col-span-6 bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              {/* Realistic Neural Dependency Mesh Header */}
              <div className="h-32 w-full rounded-xl overflow-hidden relative border border-neutral-800">
                <img
                  src="/images/digital_twin_network.jpg"
                  alt="Digital Twin Neural Dependency Mesh"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Live Neural Dependency Mesh
                  </span>
                  <span className="text-neutral-300 text-[10px]">4 Downstream Nodes Flagged</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200">
                    Downstream Blast Radius Map
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Enterprise Graph Engine
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'AST-AUR-AD-02', name: 'Meta Feed Ad: Cloud Studio at ₹499/mo', status: 'REQUIRES REVISION', risk: 'HIGH' },
                  { id: 'AST-AUR-AD-03', name: 'Google PPC Search Campaign', status: 'REQUIRES REVISION', risk: 'HIGH' },
                  { id: 'AST-AUR-WEB-01', name: 'Aurelle Cloud Studio Pricing & Checkout', status: 'REQUIRES REVISION', risk: 'CRITICAL' },
                  { id: 'AST-AUR-DOC-01', name: 'B2B Enterprise Rate Card PDF', status: 'REQUIRES REVISION', risk: 'MEDIUM' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-mono">
                    <div>
                      <span className="text-neutral-400 text-[10px] block">{item.id}</span>
                      <span className="text-neutral-200 font-sans font-medium text-[11px]">{item.name}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] text-neutral-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Non-destructive guarantee: Production database facts remain unchanged until authorized.</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 8 — TRUST AND SECURITY                                      */}
      {/* ------------------------------------------------------------------- */}
      <section id="security" className="py-20 sm:py-28 bg-black text-white border-b border-neutral-900 space-y-12">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:pl-6 xl:pl-8 lg:pr-6 xl:pr-8 space-y-12">

          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
              Enterprise Integrity
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Security, Isolation &amp; Cryptographic Accountability
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Built from the ground up for strict multi-tenancy, immutable auditability, and zero unauthenticated data leaks.
            </p>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            onMouseLeave={() => setActiveSecurityIndex(null)}
          >
            {[
              {
                id: 'multi-tenancy',
                title: 'Strict Multi-Tenancy',
                icon: Lock,
                defaultIconColor: 'bg-indigo-950 text-indigo-400',
                desc: (
                  <>
                    Strict organizational boundary isolation ensures brand facts, guidelines, and assets remain entirely confidential and segregated across enterprise teams.
                  </>
                )
              },
              {
                id: 'ssrf-defense',
                title: 'Secure External Ingestion',
                icon: Globe,
                defaultIconColor: 'bg-purple-950 text-purple-400',
                desc: (
                  <>
                    Automated website and document ingestion operates through secure sandboxed fetchers, isolating internal corporate networks and infrastructure from external exposure.
                  </>
                )
              },
              {
                id: 'sha256-digests',
                title: 'Cryptographic Release Digest Chain',
                icon: Hash,
                defaultIconColor: 'bg-cyan-950 text-cyan-400',
                desc: (
                  <>
                    Every approved release receives an immutable SHA-256 cryptographic release digest chain, permanently linking approved wording, reviewer credentials, and release timestamps into a tamper-evident record.
                  </>
                )
              },
              {
                id: 'identity-sanitized',
                title: 'Identity-Sanitized Public Verification',
                icon: ShieldCheck,
                defaultIconColor: 'bg-emerald-950 text-emerald-400',
                desc: (
                  <>
                    Public verification endpoints validate release status and cryptographic hashes with zero authentication required, without leaking reviewer emails, internal roles, or database identifiers.
                  </>
                )
              },
              {
                id: 'rbac',
                title: 'Role-Based Access (RBAC)',
                icon: Sliders,
                defaultIconColor: 'bg-amber-950 text-amber-400',
                desc: (
                  <>
                    Fine-grained privileges across Brand Manager, Legal Compliance, Creative Director, and External Auditor. Only authorized roles can commit fact updates or sign release seals.
                  </>
                )
              },
              {
                id: 'automated-tests',
                title: '177 Automated Tests Passing',
                icon: CheckCircle2,
                defaultIconColor: 'bg-emerald-950 text-emerald-400',
                desc: (
                  <>
                    100% verified pytest test suite covering multi-agent coordination, graph blast radius traversal, salted SHA-256 authentication, SSRF protection, and cryptographic verification.
                  </>
                )
              }
            ].map((feature, index) => {
              const isActive = activeSecurityIndex === index;
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  tabIndex={0}
                  role="article"
                  aria-label={feature.title}
                  onMouseEnter={() => setActiveSecurityIndex(index)}
                  onMouseLeave={() => {
                    if (activeSecurityIndex === index) {
                      setActiveSecurityIndex(null);
                    }
                  }}
                  onFocus={() => setActiveSecurityIndex(index)}
                  onBlur={() => {
                    if (activeSecurityIndex === index) {
                      setActiveSecurityIndex(null);
                    }
                  }}
                  onTouchStart={() => setActiveSecurityIndex(index)}
                  className={`p-6 rounded-2xl space-y-3 cursor-pointer outline-none transition-all duration-200 ease-out select-none ${isActive
                    ? 'bg-blue-950/20 border-2 border-[#2563EB] shadow-lg shadow-blue-500/15 -translate-y-1 ring-2 ring-[#2563EB]/20'
                    : 'bg-neutral-950 border border-neutral-800 text-white shadow-xs hover:border-neutral-700 translate-y-0'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/30 scale-105'
                      : feature.defaultIconColor
                      }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-full transition-all">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <h3 className={`text-base font-bold transition-colors duration-200 ${isActive ? 'text-blue-400' : 'text-white'
                    }`}>
                    {feature.title}
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 9 — ROLE PERSONAS (Matching Reference Image 5)              */}
      {/* ------------------------------------------------------------------- */}
      <section id="roles" className="py-20 sm:py-28 bg-black text-white relative overflow-hidden border-b border-neutral-900">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:pl-6 xl:pl-8 lg:pr-6 xl:pr-8 space-y-12">

          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[11px] font-mono font-bold tracking-widest text-indigo-400 uppercase">
              TRY IT AS ONE OF THE TEAM
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
              PICK A ROLE. NO SIGN-UP.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-sans">
              Five demo accounts for Aurelle Skin, a fictional brand. Each one opens where its work is.
            </p>
          </div>

          {/* 5 Persona Cards Row (Directly matching Reference Image 1) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

            {/* Card 1: CREATOR */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors space-y-4">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                  <PenTool className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black font-sans text-white uppercase tracking-wider">CREATOR</h3>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">ASHA · IN-HOUSE WRITER</div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans min-h-[50px]">
                  Check a draft privately, accept cited fixes and send it for review.
                </p>
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  OPENS &rarr; CHECK A POST
                </div>
              </div>
              <button
                onClick={() => onNavigateRole ? onNavigateRole('creator') : onOpenCreatorDashboard ? onOpenCreatorDashboard() : null}
                className="w-full py-2.5 px-3 rounded-xl bg-[#544df2] hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-colors"
              >
                TRY AS CREATOR
              </button>
            </div>

            {/* Card 2: AGENCY */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors space-y-4">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black font-sans text-white uppercase tracking-wider">AGENCY</h3>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">SANA · OUTSIDE AGENCY</div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans min-h-[50px]">
                  Check her own drafts. Confidential facts stay hidden from her.
                </p>
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  OPENS &rarr; CHECK A POST
                </div>
              </div>
              <button
                onClick={() => onNavigateRole ? onNavigateRole('agency') : null}
                className="w-full py-2.5 px-3 rounded-xl bg-[#f0ede6] hover:bg-white text-neutral-900 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS AGENCY
              </button>
            </div>

            {/* Card 3: REVIEWER */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors space-y-4">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black font-sans text-white uppercase tracking-wider">REVIEWER</h3>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">MEERA · CONTENT REVIEWER</div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans min-h-[50px]">
                  Work through the queue: agree or disagree with each finding, then approve.
                </p>
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  OPENS &rarr; REVIEW QUEUE
                </div>
              </div>
              <button
                onClick={() => onNavigateRole ? onNavigateRole('reviewer') : null}
                className="w-full py-2.5 px-3 rounded-xl bg-[#f0ede6] hover:bg-white text-neutral-900 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS REVIEWER
              </button>
            </div>

            {/* Card 4: COMPLIANCE */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors space-y-4">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black font-sans text-white uppercase tracking-wider">COMPLIANCE</h3>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">ARJUN · COMPLIANCE</div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans min-h-[50px]">
                  Decide claims and confidential findings, and give the compliance sign-off.
                </p>
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  OPENS &rarr; REVIEW QUEUE
                </div>
              </div>
              <button
                onClick={() => onNavigateRole ? onNavigateRole('compliance') : null}
                className="w-full py-2.5 px-3 rounded-xl bg-[#f0ede6] hover:bg-white text-neutral-900 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS COMPLIANCE
              </button>
            </div>

            {/* Card 5: BRAND OWNER */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors space-y-4">
              <div className="space-y-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black font-sans text-white uppercase tracking-wider">BRAND OWNER</h3>
                  <div className="text-[10px] font-mono text-neutral-400 uppercase">KABIR · BRAND OWNER</div>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed font-sans min-h-[50px]">
                  Own the rulebook and see which rules people find unclear.
                </p>
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  OPENS &rarr; GUIDELINE HEALTH
                </div>
              </div>
              <button
                onClick={() => onNavigateRole ? onNavigateRole('brand-owner') : null}
                className="w-full py-2.5 px-3 rounded-xl bg-[#f0ede6] hover:bg-white text-neutral-900 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS BRAND OWNER
              </button>
            </div>

          </div>

          {/* Hanging Plumb Bob & Grand Statement directly matching Reference Image 1 */}
          <div className="pt-20 pb-12 text-center space-y-6 flex flex-col items-center">

            {/* Hanging Plumb Bob wire with horizontal T-bar and purple diamond */}
            <div className="flex flex-col items-center pointer-events-none select-none">
              <div className="w-8 h-[2px] bg-neutral-600 rounded-full" />
              <div className="w-[1.5px] h-10 bg-indigo-500" />
              <div className="w-4 h-4 rotate-45 bg-[#6366f1] border border-indigo-300 shadow-md shadow-indigo-500/50 mt-[-2px]" />
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase">
              SILENCE IS NEVER CLEARANCE.
            </h2>

            {/* Check Your First Post Underlined Link */}
            <div className="pt-2 flex items-center justify-center">
              <button
                onClick={() => handleSelectCapability('content-intelligence', 'inspector')}
                className="text-lg sm:text-xl font-bold uppercase tracking-wider text-white underline decoration-white decoration-2 underline-offset-8 hover:text-indigo-300 hover:decoration-indigo-300 transition-colors cursor-pointer"
              >
                CHECK YOUR FIRST POST
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 10 — FOOTER (Minimalist Single Line Matching Reference)     */}
      {/* ------------------------------------------------------------------- */}
      <footer id="about" className="border-t border-neutral-900 bg-black py-6 transition-colors text-neutral-400">
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:pl-6 xl:pl-8 lg:pr-6 xl:pr-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-x-6 gap-y-3 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-neutral-400 w-full">

            <div className="flex items-center gap-4 sm:gap-6 shrink-0 whitespace-nowrap">
              <span className="font-bold text-white tracking-wider">
                EVIDENCE OR SILENCE.
              </span>
              <button
                onClick={onVerify || (() => onEnterApp('public-verification'))}
                className="hover:text-indigo-400 font-bold transition-colors cursor-pointer"
              >
                STATUS
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-indigo-400 font-bold transition-colors cursor-pointer"
              >
                HOW I KNOW IT WORKS
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-center md:text-right text-[10px] sm:text-[11px] text-neutral-500 whitespace-nowrap">
              <span>AURELLE SKIN IS A FICTIONAL BRAND; NO REAL DATA IS USED.</span>
              <span className="opacity-40">•</span>
              <span>DEMO RUNS ON FREE MODEL TIERS WITH FICTIONAL DATA ONLY.</span>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
};
