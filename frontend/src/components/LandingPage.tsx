import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, GitFork, ArrowRight, Lock, 
  CheckCircle2, ChevronRight,
  Network,
  FileText, Globe, Cpu,
  Check, AlertCircle, X, Menu,
  Hash, Clock, Sliders
} from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';
import { PlumbBob } from './ui/PlumbBob';
import { useAuth } from '../context/AuthContext';

interface LandingPageProps {
  onEnterApp: (targetTab?: string) => void;
  brandName?: string;
  onVerify?: () => void;
  onSignIn?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onEnterApp, 
  onVerify, 
  onSignIn,
  brandName: _brandName = 'Apex Dynamics' 
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSecurityIndex, setActiveSecurityIndex] = useState<number | null>(null);
  const [activeCapabilityId, setActiveCapabilityId] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-900 selection:text-white dark:selection:bg-indigo-600 dark:selection:text-white transition-colors duration-200">
      
      {/* ------------------------------------------------------------------- */}
      {/* SECTION 1 — TOP NAVIGATION                                          */}
      {/* ------------------------------------------------------------------- */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          
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
            <button onClick={() => scrollToSection('platform')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Platform
            </button>
            <button onClick={() => scrollToSection('features')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Features
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              How It Works
            </button>
            <button onClick={() => scrollToSection('digital-twin')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Digital Twin
            </button>
            <button onClick={() => scrollToSection('security')} className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
              Security
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

            {/* Theme Toggle Button */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>

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
                  onClick={onSignIn || (() => onEnterApp('command-center'))}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Sign In
                </button>

                <button
                  onClick={onSignIn || (() => onEnterApp('command-center'))}
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
                <button onClick={() => scrollToSection('overview')} className="text-left py-1.5 hover:text-indigo-600">Overview</button>
                <button onClick={() => scrollToSection('platform')} className="text-left py-1.5 hover:text-indigo-600">Platform</button>
                <button onClick={() => scrollToSection('features')} className="text-left py-1.5 hover:text-indigo-600">Features</button>
                <button onClick={() => scrollToSection('how-it-works')} className="text-left py-1.5 hover:text-indigo-600">How It Works</button>
                <button onClick={() => scrollToSection('digital-twin')} className="text-left py-1.5 hover:text-indigo-600">Digital Twin</button>
                <button onClick={() => scrollToSection('security')} className="text-left py-1.5 hover:text-indigo-600">Security</button>
                <button onClick={onVerify || (() => onEnterApp('public-verification'))} className="text-left py-1.5 text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Public Verification Portal</span>
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => onEnterApp('command-center')}
                      className="w-full py-2.5 text-xs font-bold rounded-lg bg-indigo-600 text-white text-center shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>Continue to Dashboard</span>
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
                      onClick={onSignIn || (() => onEnterApp('command-center'))}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-center"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={onSignIn || (() => onEnterApp('command-center'))}
                      className="flex-1 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white text-center shadow-xs"
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
      <section id="overview" className="relative pt-3 sm:pt-6 pb-14 sm:pb-20 overflow-hidden">
        {/* Subtle background ambient gradients */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-100/50 via-purple-50/20 to-transparent dark:from-indigo-950/30 dark:via-purple-950/10 dark:to-transparent rounded-full blur-3xl" />
        </div>

        {/* Subtle topographic contour wave lines matching reference images */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.05] dark:opacity-[0.14] stroke-slate-500 dark:stroke-slate-400"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M-50 140 C 250 260, 650 60, 1500 200" strokeWidth="1.5" />
          <path d="M-50 240 C 300 360, 750 140, 1500 300" strokeWidth="1.5" />
          <path d="M-50 340 C 350 460, 850 220, 1500 400" strokeWidth="1.5" />
          <path d="M-50 440 C 400 560, 950 300, 1500 500" strokeWidth="1.5" />
          <path d="M-50 540 C 450 660, 1050 380, 1500 600" strokeWidth="1.5" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-start pt-1 sm:pt-2">
            
            {/* Left Column: Bold Editorial Typography & CTA */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className="space-y-3 select-none">
                
                {/* Meta Tag & Brand Context Pill */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                    BEFORE IT'S PUBLISHED
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                    AURELLE SKIN
                  </span>
                </div>
                
                {/* Typography Headline: Single canonical claim kept permanently alone */}
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.02] uppercase font-sans">
                  <span className="block">EVERY CLAIM</span>

                  {/* CLINICALLY PROVEN with coral strikethrough bounded strictly to each word */}
                  <div className="py-1">
                    <span className="relative inline-block mr-3 sm:mr-4 leading-none">
                      <span className="text-[#ff6358] dark:text-[#ff6b6b] font-black">
                        CLINICALLY
                      </span>
                      <motion.span 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-1/2 left-0 right-0 h-[4px] sm:h-[6px] lg:h-[7px] bg-[#ff6358] dark:bg-[#ff6b6b] -translate-y-1/2 origin-left rounded-full pointer-events-none" 
                      />
                    </span>
                    <span className="relative inline-block leading-none">
                      <span className="text-[#ff6358] dark:text-[#ff6b6b] font-black">
                        PROVEN
                      </span>
                      <motion.span 
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-1/2 left-0 right-0 h-[4px] sm:h-[6px] lg:h-[7px] bg-[#ff6358] dark:bg-[#ff6b6b] -translate-y-1/2 origin-left rounded-full pointer-events-none" 
                      />
                    </span>
                  </div>

                  {/* Approved verified claim permanently visible */}
                  <div className="text-[#10b981] dark:text-[#34d399] py-1">
                    <span className="block font-black leading-none my-1">
                      SHOWN TO VISIBLY
                    </span>
                    <span className="block font-black leading-none my-1">
                      REDUCE*
                    </span>
                  </div>

                  {/* CHECKED. Grounded Anchor Word */}
                  <div className="block text-slate-900 dark:text-white pt-1">
                    CHECKED.
                  </div>
                </h1>
              </div>

              {/* Substantiation Footnote directly matching reference */}
              <p className="text-[11px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
                *FACT-014 · 32% fewer visible dark spots in 8 weeks · in-house study, 48 participants
              </p>

              {/* Subtitle Statement */}
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight max-w-xl leading-snug">
                CHECK MARKETING CONTENT AGAINST YOUR BRAND'S OWN RULES AND FACTS, BEFORE IT'S PUBLISHED.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onEnterApp('command-center')}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer ring-2 ring-indigo-500/20"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollToSection('features')}
                  className="px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore Platform</span>
                </button>

                <button
                  onClick={onVerify || (() => onEnterApp('public-verification'))}
                  className="px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Public Verification</span>
                </button>
              </div>

              {/* Trust Metric Pill */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  <span>163 Automated Tests Passing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>&lt;800ms Concurrent Multi-Agent SLA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>SHA-256 Chained Block Proofs</span>
                </div>
              </div>

            </div>

            {/* Right Column: Visual Product Inspection Mockup Card (Inspired by reference) */}
            <div className="lg:col-span-5 relative">
              {/* Plumb Bob Motif hanging along the left edge of the card, matching Plumbline reference composition */}
              <div className="hidden lg:block absolute -top-8 -left-5 pointer-events-none select-none z-20">
                <PlumbBob stringLength={150} />
              </div>

              <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-5 sm:p-6 space-y-4">
                
                {/* Header bar of visual card */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Live Gate Inspection
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                    Latency: 182ms
                  </span>
                </div>

                {/* Realistic Product Packaging Inspection Header */}
                <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-indigo-50/40 dark:from-emerald-950/30 dark:via-slate-800/60 dark:to-indigo-950/30 rounded-xl border border-slate-200 dark:border-slate-700/80">
                  <img
                    src="/images/product_aurelle_serum.jpg"
                    alt="Aurelle Cellular Renewal Serum Packaging"
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-bold truncate">
                        Aurelle Active SKU · Multimodal Gate
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      Cellular Renewal Serum · 50ml
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      Grounded Claim: FACT-014 (32% reduction / 8 wks)
                    </p>
                  </div>
                </div>

                {/* Simulated Marketing Asset Card with strike-throughs & verified replacements */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>ASSET: AST-AUR-01</span>
                    <span>CHANNEL: SOCIAL &amp; WEB ADS</span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans space-y-2">
                    <p>
                      "Experience the revolutionary{' '}
                      <span className="line-through decoration-rose-500 decoration-2 text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1 rounded">
                        Horizun Watch
                      </span>{' '}
                      with{' '}
                      <span className="underline decoration-indigo-500 font-semibold text-indigo-900 dark:text-indigo-300">
                        QuantumAcoustics™
                      </span>{' '}
                      spatial sound streaming."
                    </p>

                    <p>
                      "Cloud Studio subscription is{' '}
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                        ₹499/mo
                      </span>{' '}
                      with verified{' '}
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                        72-hour battery life
                      </span>."
                    </p>
                  </div>

                  {/* Findings Breakdown Badges */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-start gap-2 text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-lg border border-rose-200 dark:border-rose-900/50">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>VOICE REVISION:</strong> Correct typographical error <code className="font-mono">Horizun</code> &rarr; <code className="font-mono font-bold">Horizon</code>.
                      </span>
                    </div>

                    <div className="flex items-start gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>SUBSTANTIATED:</strong> Price ₹499/mo verified against master fact <code className="font-mono font-bold">FACT-AUR-PRC-01</code>.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Seal Proof Bar */}
                <div className="flex items-center justify-between p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-700 dark:text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-indigo-950 dark:text-indigo-200 text-[11px] block">
                        BT-SEAL-8F3A2B1C
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        SHA-256 Tamper-Evident Chained Seal
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white rounded-full">
                    APPROVED
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* LIVE GOVERNANCE RULE TICKER (Homage to reference ticker)          */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-14 border-y border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 py-3 overflow-hidden select-none">
          <div className="animate-ticker text-xs font-mono tracking-wider uppercase font-semibold flex items-center gap-10">
            <span className="text-amber-400">◆ "MUMBAI FLEET LAUNCH" EMBARGOED UNTIL DECEMBER (FACT-033)</span>
            <span className="text-emerald-400">◆ 800V CHARGING OPERATES STRICTLY BELOW 65°C THERMAL STANDARD</span>
            <span className="text-rose-400">◆ FDA 21 CFR §870: NON-DIAGNOSTIC WELLNESS DISCLOSURE REQUIRED</span>
            <span className="text-cyan-400">◆ QUANTUMACOUSTICS MUST CARRY ™ TRADEMARK SYMBOL (LANHAM §43a)</span>
            <span className="text-amber-400">◆ CLOUD STUDIO SUBSCRIPTION PRICE IS ₹499/MO (FACT-AUR-PRC-01)</span>
            <span className="text-rose-400">◆ BANNED SUPERLATIVE: "WORLD'S FIRST AUTONOMOUS" FLAGGED BY NHTSA GATE</span>
            {/* Duplicate for infinite loop */}
            <span className="text-amber-400">◆ "MUMBAI FLEET LAUNCH" EMBARGOED UNTIL DECEMBER (FACT-033)</span>
            <span className="text-emerald-400">◆ 800V CHARGING OPERATES STRICTLY BELOW 65°C THERMAL STANDARD</span>
            <span className="text-rose-400">◆ FDA 21 CFR §870: NON-DIAGNOSTIC WELLNESS DISCLOSURE REQUIRED</span>
            <span className="text-cyan-400">◆ QUANTUMACOUSTICS MUST CARRY ™ TRADEMARK SYMBOL (LANHAM §43a)</span>
            <span className="text-amber-400">◆ CLOUD STUDIO SUBSCRIPTION PRICE IS ₹499/MO (FACT-AUR-PRC-01)</span>
            <span className="text-rose-400">◆ BANNED SUPERLATIVE: "WORLD'S FIRST AUTONOMOUS" FLAGGED BY NHTSA GATE</span>
          </div>
        </div>

      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 4 — PROBLEM SECTION (Matching Reference Visuals)            */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              THE PROBLEM
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              CONTENT COMES FROM EVERYONE NOW. <br />
              <span className="text-rose-600 dark:text-rose-400">SO DO THE MISTAKES.</span>
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Writers, agencies, influencers and AI tools all post for the brand. The brand book is a PDF none of them has open.
            </p>
          </div>

          {/* 3 Real-World Problem Cards (Directly matching Reference Image 4) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* Card 1: INSTAGRAM POST (Serum bottle on podium) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">INSTAGRAM POST</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                </div>

                {/* Account row */}
                <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">
                      A
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">aurelle.skin</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Sponsored</span>
                </div>

                {/* Visual Body (Serum Product Mockup) */}
                <div className="relative bg-gradient-to-b from-stone-100 to-stone-200 dark:from-slate-800 dark:to-slate-850 p-6 flex flex-col items-center justify-center min-h-[220px]">
                  {/* Cosmetic amber bottle representation */}
                  <div className="relative flex flex-col items-center">
                    {/* Dropper top */}
                    <div className="w-3.5 h-6 bg-slate-800 rounded-t-sm" />
                    <div className="w-5 h-2.5 bg-slate-700 rounded-xs" />
                    {/* Amber bottle */}
                    <div className="w-16 h-28 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 rounded-lg shadow-lg flex flex-col items-center justify-center p-1.5 border border-amber-900/40 relative">
                      {/* Bottle label */}
                      <div className="w-full bg-stone-50 text-[6px] text-slate-900 font-sans py-2 px-1 text-center rounded-xs shadow-xs space-y-0.5">
                        <div className="font-extrabold uppercase tracking-widest text-[7px]">AURELLE</div>
                        <div className="text-[5px] text-slate-600 font-medium leading-none">VITAMIN C SERUM</div>
                        <div className="text-[4px] text-slate-400">30 ML</div>
                      </div>
                    </div>
                    {/* Pedestal shadow */}
                    <div className="w-24 h-3 bg-stone-400/50 dark:bg-black/50 rounded-full blur-[2px] mt-1" />
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Asset ID: AST-AUR-IG-09 · Influencer Draft
              </div>
            </div>

            {/* Card 2: WEB BANNER ("GLOW IN 2 WEEKS" Violation) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">WEB BANNER</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                </div>

                {/* Banner Content Body */}
                <div className="bg-[#f5ebe1] dark:bg-stone-900 p-5 min-h-[220px] flex flex-col justify-between text-slate-900 dark:text-stone-100 relative overflow-hidden">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">
                      GLOW IN <br />
                      <span className="relative inline-block text-rose-700 dark:text-rose-400 underline decoration-rose-500 decoration-wavy decoration-2">
                        2 WEEKS
                      </span>
                    </h3>
                  </div>

                  {/* Serum droplet discs visual */}
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="w-14 h-14 rounded-full bg-amber-400/30 border border-amber-500/40 flex items-center justify-center shadow-inner">
                      <div className="w-8 h-8 rounded-full bg-amber-500/40" />
                    </div>
                    <div className="w-16 h-16 rounded-full bg-amber-300/40 border border-amber-400/50 flex items-center justify-center shadow-inner">
                      <div className="w-10 h-10 rounded-full bg-amber-400/50" />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-stone-300">
                      AURELLE
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Alert Pill matching Reference */}
              <div className="p-3 bg-slate-900 text-slate-100 border-t border-slate-800 text-xs flex items-start gap-2">
                <span className="text-rose-400 font-bold">◆</span>
                <span className="leading-snug text-[11px]">
                  <strong className="text-rose-300">BLOCKS "Glow in 2 weeks":</strong> the clinical evidence covers 8 weeks, not 2 (FACT-014).
                </span>
              </div>
            </div>

            {/* Card 3: EMAIL ("OUR DIWALI SALE IS HERE" Violation) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-mono text-slate-400">
                  <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">EMAIL</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                </div>

                {/* Email Content Body */}
                <div className="bg-[#f8f5f0] dark:bg-stone-900/90 p-5 min-h-[220px] flex flex-col justify-between text-slate-900 dark:text-stone-100">
                  <div className="space-y-1 text-xs text-slate-600 dark:text-stone-400">
                    <div><span className="font-medium text-slate-400">From</span> <strong className="text-slate-800 dark:text-stone-200">Aurelle Skin</strong></div>
                    <div><span className="font-medium text-slate-400">Subject</span> <strong className="text-slate-800 dark:text-stone-200">Something big is coming</strong></div>
                  </div>

                  <div className="py-3 flex items-center justify-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-400/40 border border-amber-500/30" />
                    <div className="w-12 h-12 rounded-full bg-amber-500/30 border border-amber-600/30" />
                    <div className="w-10 h-10 rounded-full bg-amber-300/40 border border-amber-400/30" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-extrabold tracking-tight uppercase leading-snug">
                      <span className="underline decoration-rose-500 decoration-wavy decoration-2 text-rose-700 dark:text-rose-400">
                        OUR DIWALI SALE IS HERE:
                      </span>{' '}
                      20% OFF EVERYTHING.
                    </p>
                    <button className="px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-wider cursor-pointer">
                      SHOP NOW
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Alert Pill matching Reference */}
              <div className="p-3 bg-slate-900 text-slate-100 border-t border-slate-800 text-xs flex items-start gap-2">
                <span className="text-rose-400 font-bold">◆</span>
                <span className="leading-snug text-[11px]">
                  <strong className="text-rose-300">BLOCKS</strong> Announces the Diwali sale while it's still embargoed until November (FACT-033).
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 3 — CORE CAPABILITIES (Unified, Aligned & Realistic Visuals) */}
      {/* ------------------------------------------------------------------- */}
      <section id="platform" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative">
        {/* Anchor for features nav link */}
        <div id="features" className="absolute -top-24 left-0 pointer-events-none" />
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Autonomous Brand Intelligence &amp; Governance</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Six Enterprise Capabilities. Grounded In Real Evidence.
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            From raw packaging inspection and brand fact curation to multi-agent risk gating, Digital Twin simulation, and cryptographic audit proofs.
          </p>
        </div>

        {/* Aligned 6-Card Grid with Realistic Photography Headers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {[
            {
              id: 'brand-knowledge',
              title: 'Brand Knowledge Base',
              subtitle: 'Ground Truth Engine',
              desc: 'Centralized repository for brand guidelines, scientific claims, ingredient dossiers, and statutory constraints. Automatically indexes uploaded PDFs, DOCX, and regulatory rules into immutable, versioned truth nodes.',
              image: '/images/product_truth_bottle.jpg',
              badge: 'GROUND TRUTH REPOSITORY',
              metric: '100% Deterministic Fact Matching',
              icon: FileText,
              tab: 'brand-knowledge'
            },
            {
              id: 'content-intelligence',
              title: 'Content Intelligence Studio',
              subtitle: '<800ms Multi-Agent Scan',
              desc: 'Concurrent 3-agent orchestration (Voice & Lexicon, Claim Verification, Statutory Compliance). Audits pre-release copy, ads, and scripts with exact character-level risk spans in under 800ms.',
              image: '/images/analytics_dashboard.jpg',
              badge: 'CONCURRENT MULTI-AGENT SLA',
              metric: '<800ms Monotonic Response SLA',
              icon: Cpu,
              tab: 'ai-content-studio'
            },
            {
              id: 'vision-packaging',
              title: 'Multimodal Vision & Inspection',
              subtitle: 'Aurelle Packaging & OCR',
              desc: 'Physical cosmetic packaging and digital ad creative inspection. Performs sub-millimeter typography extraction and verifies clinical trial claims against master scientific study facts.',
              image: '/images/product_aurelle_serum.jpg',
              badge: 'PACKAGING OCR & AD VISION',
              metric: 'Sub-millimeter Visual OCR Accuracy',
              icon: ShieldCheck,
              tab: 'ai-content-studio'
            },
            {
              id: 'digital-twin-cap',
              title: 'Brand Governance Digital Twin',
              subtitle: 'Dependency & Blast Radius',
              desc: 'Non-destructive virtual sandbox simulating the cascading impact of commercial fact or price updates before commit. Traverses directed dependency graphs across campaigns, guidelines, and published assets.',
              image: '/images/digital_twin_network.jpg',
              badge: 'ORGANIZATIONAL SIMULATOR',
              metric: 'Directed NetworkX Graph Traversal',
              icon: Network,
              tab: 'impact-simulator'
            },
            {
              id: 'cryptographic-ledger',
              title: 'Cryptographic Trust & Audit Ledger',
              subtitle: 'SHA-256 Tamper-Evident Blocks',
              desc: 'Every authorized release is permanently cryptographically sealed with SHA-256 chained block digest proofs. Binds author identity, reviewer sign-off, timestamp, and content hash into an immutable audit trail.',
              image: '/images/cryptographic_ledger.jpg',
              badge: 'TAMPER-EVIDENT MERKLE BLOCKS',
              metric: 'SHA-256 Chained Block Proofs',
              icon: Hash,
              tab: 'trust-ledger'
            },
            {
              id: 'approval-center',
              title: 'Approval Center & Human Gate',
              subtitle: 'Zero Autonomous Publishing',
              desc: 'Strict human-in-the-loop governance with zero autonomous publishing. Multi-tier review queue with role-based sign-offs, audit trails, and instant status verification (APPROVED, OUTDATED, MODIFIED).',
              image: '/images/campaign_approval.jpg',
              badge: 'HUMAN-IN-THE-LOOP CONTROL',
              metric: 'Zero Autonomous Publishing Gate',
              icon: Lock,
              tab: 'approval-center'
            }
          ].map((cap) => {
            const isCapActive = activeCapabilityId === cap.id;
            return (
              <div 
                key={cap.id}
                tabIndex={0}
                role="article"
                aria-label={cap.title}
                onMouseEnter={() => setActiveCapabilityId(cap.id)}
                onMouseLeave={() => {
                  if (activeCapabilityId === cap.id) setActiveCapabilityId(null);
                }}
                onFocus={() => setActiveCapabilityId(cap.id)}
                onBlur={() => {
                  if (activeCapabilityId === cap.id) setActiveCapabilityId(null);
                }}
                onTouchStart={() => setActiveCapabilityId(cap.id)}
                className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-200 ease-out select-none cursor-pointer outline-none group ${
                  isCapActive
                    ? 'border-2 border-[#2563EB] dark:border-blue-500 ring-2 ring-[#2563EB]/25 dark:ring-blue-500/30 shadow-xl shadow-blue-500/15 dark:shadow-blue-500/25 -translate-y-1'
                    : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 translate-y-0'
                }`}
              >
                <div>
                  {/* Realistic Photographic Header with Aspect Ratio & Badges */}
                  <div className="h-52 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                    <img
                      src={cap.image}
                      alt={cap.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent pointer-events-none" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md px-2 py-0.5 rounded border transition-colors duration-200 ${
                        isCapActive
                          ? 'bg-[#2563EB] text-white border-blue-400'
                          : 'bg-slate-900/80 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {cap.badge}
                      </span>
                      <div className={`w-8 h-8 rounded-lg backdrop-blur-md flex items-center justify-center border shadow-xs transition-colors duration-200 ${
                        isCapActive
                          ? 'bg-[#2563EB] text-white border-blue-400'
                          : 'bg-slate-900/80 text-white border-white/20'
                      }`}>
                        <cap.icon className={`w-4 h-4 ${isCapActive ? 'text-white' : 'text-indigo-400'}`} />
                      </div>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 pointer-events-none">
                      <span className={`text-[11px] font-mono font-semibold block transition-colors duration-200 ${
                        isCapActive ? 'text-blue-200' : 'text-slate-300'
                      }`}>
                        {cap.subtitle}
                      </span>
                      <h3 className={`text-base sm:text-lg font-bold tracking-tight truncate transition-colors duration-200 ${
                        isCapActive ? 'text-blue-100' : 'text-white'
                      }`}>
                        {cap.title}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body Description */}
                  <div className={`p-6 space-y-3 transition-colors duration-200 ${
                    isCapActive ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                  }`}>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[58px]">
                      {cap.desc}
                    </p>
                  </div>
                </div>

                {/* Card Footer with Metrics & Action Button */}
                <div className={`px-6 pb-5 pt-3 border-t flex items-center justify-between mt-auto transition-colors duration-200 ${
                  isCapActive
                    ? 'border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/40'
                    : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50'
                }`}>
                  <span className={`text-[11px] font-mono truncate max-w-[170px] transition-colors duration-200 ${
                    isCapActive ? 'text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-500 dark:text-slate-400'
                  }`} title={cap.metric}>
                    {cap.metric}
                  </span>
                  <button
                    onClick={() => onEnterApp(cap.tab)}
                    className={`inline-flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      isCapActive
                        ? 'text-[#2563EB] dark:text-blue-400'
                        : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                    }`}
                  >
                    <span>Explore</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </section>

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

        {/* 6-Step Grid (Matching Reference Image 4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {[
            {
              step: 'STEP 1 OF 6',
              title: 'PASTE OR UPLOAD',
              desc: 'A draft copy, a DOCX, a PDF or an image. Multi-format ingestion validates file signatures and extracts clean text.'
            },
            {
              step: 'STEP 2 OF 6',
              title: 'RULES RUN FIRST',
              desc: 'Your banned phrases, required labels, product names, contrast, and trademark symbols are validated by code.'
            },
            {
              step: 'STEP 3 OF 6',
              title: 'CLAIMS MEET THE FACTS',
              desc: 'Every commercial claim is matched to your active fact ledger: supported, contradicted, expired or unsupported.'
            },
            {
              step: 'STEP 4 OF 6',
              title: 'EVIDENCE OR SILENCE',
              desc: 'A finding only surfaces if it names a real rule or fact citation and quotes your exact words with character offsets.'
            },
            {
              step: 'STEP 5 OF 6',
              title: 'FIXED WITHOUT INVENTING',
              desc: 'Claims are fixed only with approved master wording; your call to action, creative tone, and brand voice are kept intact.'
            },
            {
              step: 'STEP 6 OF 6',
              title: 'REVIEWED AND SEALED',
              desc: 'Reviewers decide, approvals are routed, and every authorized release receives a tamper-evident SHA-256 seal.'
            }
          ].map((item, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
            >
              <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block">
                {item.step}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}

        </div>

      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 7 — SIGNATURE INNOVATION (Brand Governance Digital Twin)    */}
      {/* ------------------------------------------------------------------- */}
      <section id="digital-twin" className="py-16 sm:py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
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

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Ordinary tools lint the text in front of them in isolation. The BrandTrace Digital Twin simulates the cascading consequences of a proposed fact or policy change <em>before</em> an authorized change is committed.
              </p>

              {/* Realistic Demonstration Comparison */}
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Illustrative Simulation Scenario (Synthetic Demo Data)
                </span>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-700">
                    <span className="text-slate-400 text-[10px] block">APPROVED PRICE</span>
                    <strong className="text-emerald-400 text-sm">₹499 / month</strong>
                    <span className="text-slate-500 text-[10px] block mt-0.5">FACT-AUR-PRC-01</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-indigo-800">
                    <span className="text-slate-400 text-[10px] block">PROPOSED MUTATION</span>
                    <strong className="text-cyan-400 text-sm">₹599 / month</strong>
                    <span className="text-indigo-400 text-[10px] block mt-0.5">Semi-Annual Revision</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">AFFECTED TOUCHPOINTS</span>
                    <strong className="text-white text-xs">4 Assets</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">EXPOSURE AT RISK</span>
                    <strong className="text-rose-400 text-xs">$320,000</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">ESTIMATED WORKLOAD</span>
                    <strong className="text-amber-400 text-xs">12.5 Hours</strong>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onEnterApp('impact-simulator')}
                  className="px-5 py-3 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Launch Change Impact Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Right: Graph Canvas Simulation Preview Card */}
            <div className="lg:col-span-6 bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
              {/* Realistic Neural Dependency Mesh Header */}
              <div className="h-32 w-full rounded-xl overflow-hidden relative border border-slate-700">
                <img
                  src="/images/digital_twin_network.jpg"
                  alt="Digital Twin Neural Dependency Mesh"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Live Neural Dependency Mesh
                  </span>
                  <span className="text-slate-300 text-[10px]">4 Downstream Nodes Flagged</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    Downstream Blast Radius Map
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  NetworkX Directed Engine
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'AST-AUR-AD-02', name: 'Meta Feed Ad: Cloud Studio at ₹499/mo', status: 'REQUIRES REVISION', risk: 'HIGH' },
                  { id: 'AST-AUR-AD-03', name: 'Google PPC Search Campaign', status: 'REQUIRES REVISION', risk: 'HIGH' },
                  { id: 'AST-AUR-WEB-01', name: 'Aurelle Cloud Studio Pricing & Checkout', status: 'REQUIRES REVISION', risk: 'CRITICAL' },
                  { id: 'AST-AUR-DOC-01', name: 'B2B Enterprise Rate Card PDF', status: 'REQUIRES REVISION', risk: 'MEDIUM' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] block">{item.id}</span>
                      <span className="text-slate-200 font-sans font-medium text-[11px]">{item.name}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl text-[11px] text-slate-400 flex items-center gap-2">
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
      <section id="security" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Enterprise Integrity
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Security, Isolation &amp; Cryptographic Accountability
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
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
              defaultIconColor: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
              desc: (
                <>
                  Every document, fact, and verification query scopes strictly by{' '}
                  <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">org_id</code> and{' '}
                  <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">workspace_id</code>. Cross-tenant probes return 404.
                </>
              )
            },
            {
              id: 'ssrf-defense',
              title: 'SSRF Defense Engine',
              icon: Globe,
              defaultIconColor: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
              desc: (
                <>
                  Website import resolves DNS hostnames and strictly blocks loopback, private Class A/B/C spaces, and cloud metadata endpoints (169.254.169.254).
                </>
              )
            },
            {
              id: 'sha256-digests',
              title: 'SHA-256 Chained Digests',
              icon: Hash,
              defaultIconColor: 'bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400',
              desc: (
                <>
                  Internal Merkle-style block digests immutably bind content payload, asset ID, approving user identity, and timestamp into a tamper-evident seal.
                </>
              )
            },
            {
              id: 'zero-knowledge',
              title: 'Zero-Knowledge Verification',
              icon: ShieldCheck,
              defaultIconColor: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
              desc: (
                <>
                  Public verification endpoints return authentic status and hashes without leaking employee emails, user roles, or internal database identifiers.
                </>
              )
            },
            {
              id: 'rbac',
              title: 'Role-Based Access (RBAC)',
              icon: Sliders,
              defaultIconColor: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
              desc: (
                <>
                  Fine-grained privileges across Admin, Compliance Reviewer, Brand Manager, Creator, and Auditor. Only authorized roles can sign release seals.
                </>
              )
            },
            {
              id: 'human-gate',
              title: 'Strict Human Gate',
              icon: CheckCircle2,
              defaultIconColor: 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
              desc: (
                <>
                  Zero autonomous publishing. Every release candidate, fact revision, and policy change requires human review sign-off with recorded audit notes.
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
                className={`p-6 rounded-2xl space-y-3 cursor-pointer outline-none transition-all duration-200 ease-out select-none ${
                  isActive
                    ? 'bg-gradient-to-b from-blue-50/80 via-white to-blue-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-blue-950/20 border-2 border-[#2563EB] dark:border-blue-500 shadow-lg shadow-blue-500/15 dark:shadow-blue-500/25 -translate-y-1 ring-2 ring-[#2563EB]/20 dark:ring-blue-500/30'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-800 translate-y-0'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/30 scale-105'
                      : feature.defaultIconColor
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 px-2 py-0.5 rounded-full transition-all">
                      ACTIVE
                    </span>
                  )}
                </div>
                <h3 className={`text-base font-bold transition-colors duration-200 ${
                  isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>

      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 9 — ROLE PERSONAS (Matching Reference Image 5)              */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
              EXPERIENCE THE PLATFORM BY ROLE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              One Unified Governance Engine. Tailored For Every Stakeholder.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Select any role to experience contextual guardrails, automated fact-checking, and role-based workflows.
            </p>
          </div>

          {/* 5 Persona Cards Row (Directly matching Reference Image 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Card 1: CREATOR */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[50px]">
                  Check a draft privately, accept cited fixes and send it for review.
                </p>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  OPENS &rarr; CHECK A POST
                </div>
              </div>
              <button
                onClick={() => onEnterApp('content-studio')}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS CREATOR
              </button>
            </div>

            {/* Card 2: AGENCY */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[50px]">
                  Check her own drafts. Confidential facts stay hidden from her.
                </p>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  OPENS &rarr; CHECK A POST
                </div>
              </div>
              <button
                onClick={() => onEnterApp('content-studio')}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS AGENCY
              </button>
            </div>

            {/* Card 3: REVIEWER */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[50px]">
                  Work through the queue: agree or disagree with each finding, then approve.
                </p>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  OPENS &rarr; REVIEW QUEUE
                </div>
              </div>
              <button
                onClick={() => onEnterApp('approvals')}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS REVIEWER
              </button>
            </div>

            {/* Card 4: COMPLIANCE */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[50px]">
                  Decide claims and confidential findings, and give the compliance sign-off.
                </p>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  OPENS &rarr; REVIEW QUEUE
                </div>
              </div>
              <button
                onClick={() => onEnterApp('approvals')}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS COMPLIANCE
              </button>
            </div>

            {/* Card 5: BRAND OWNER */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[50px]">
                  Own the rulebook and see which rules people find unclear.
                </p>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  OPENS &rarr; GUIDELINE HEALTH
                </div>
              </div>
              <button
                onClick={() => onEnterApp('knowledge-base')}
                className="w-full py-2.5 px-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
              >
                TRY AS BRAND OWNER
              </button>
            </div>

          </div>

          {/* Hanging Plumb Bob & Grand Statement directly matching Reference Image 1 */}
          <div className="pt-20 pb-12 text-center space-y-6 flex flex-col items-center">
            
            {/* Hanging Plumb Bob wire with horizontal T-bar and purple diamond */}
            <div className="flex flex-col items-center pointer-events-none select-none">
              <div className="w-8 h-[2px] bg-slate-400 dark:bg-slate-500 rounded-full" />
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
                onClick={() => onEnterApp('content-studio')}
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
      <footer id="about" className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-x-6 gap-y-3 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 w-full">
            
            <div className="flex items-center gap-4 sm:gap-6 shrink-0 whitespace-nowrap">
              <span className="font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                EVIDENCE OR SILENCE.
              </span>
              <button
                onClick={onVerify || (() => onEnterApp('public-verification'))}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors cursor-pointer"
              >
                STATUS
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors cursor-pointer"
              >
                HOW I KNOW IT WORKS
              </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-center md:text-right text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
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
