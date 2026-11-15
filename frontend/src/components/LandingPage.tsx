import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, GitFork, ArrowRight, Lock, 
  Sparkles, CheckCircle2, ChevronRight,
  Network, LineChart, AlertTriangle,
  FileText, Globe, Cpu,
  Check, AlertCircle, X, Menu,
  Hash, ArrowUpRight, Scale, Clock, Sliders
} from 'lucide-react';
import { ThemeToggle } from './ui/ThemeToggle';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
                  BRANDTRACE<span className="text-indigo-600 dark:text-indigo-400"> AI</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                  Control Plane
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono hidden sm:block">
                Autonomous Brand Intelligence &amp; Governance
              </p>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
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
          <div className="flex items-center gap-2.5">
            {/* Public Verification Link */}
            <button
              onClick={onVerify || (() => onEnterApp('public-verification'))}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shadow-2xs"
              title="Verify Release Seals &amp; Content (Zero Authentication)"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Verify Release</span>
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Sign In Button */}
            <button
              onClick={onSignIn || (() => onEnterApp('command-center'))}
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Sign In
            </button>

            {/* Primary Get Started CTA */}
            <button
              onClick={() => onEnterApp('command-center')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
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
              className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 px-4 pt-3 pb-6 space-y-3"
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

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={onSignIn || (() => onEnterApp('command-center'))}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-center"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onEnterApp('command-center')}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white text-center shadow-xs"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 2 — HERO SECTION                                            */}
      {/* ------------------------------------------------------------------- */}
      <section id="overview" className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        {/* Subtle background ambient gradients */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-100/50 via-purple-50/20 to-transparent dark:from-indigo-950/30 dark:via-purple-950/10 dark:to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Bold Editorial Typography & CTA */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>BEFORE IT'S PUBLISHED • AUTONOMOUS GOVERNANCE</span>
              </div>

              {/* Bold Title with Editorial Styling inspired by reference */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08]">
                Protect Your Brand. <br />
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  Govern Every Claim.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                BrandTrace AI helps enterprises maintain brand consistency, validate marketing claims, simulate the impact of brand changes, and verify approved content through an intelligent governance platform.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onEnterApp('command-center')}
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore the Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={onVerify || (() => onEnterApp('public-verification'))}
                  className="px-5 py-3.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
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
            <div className="lg:col-span-5">
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
      {/* SECTION 4 — PROBLEM SECTION                                         */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              The Enterprise Governance Crisis
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Content comes from everyone now. <br />
              <span className="text-rose-600 dark:text-rose-400">So do the mistakes.</span>
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Writers, agencies, influencers and AI tools all post for the brand. The brand guidelines are a 90-page PDF none of them has open.
            </p>
          </div>

          {/* 3 Real-World Problem Cards (Inspired by Reference Image 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Medical / Diagnostic Claim Violation */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">INSTAGRAM CAMPAIGN</span>
                  <span className="text-rose-600 font-bold">REJECTED</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    "Aurelle Pulse Smart Ring is a <span className="line-through text-rose-600 font-bold">medical-grade diagnostic cure</span> that eliminates cardiovascular symptoms."
                  </p>
                </div>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>BLOCKS "Diagnostic cure":</strong> Consumer wearables cannot claim disease cures under <strong>FDA 21 CFR §870</strong> (GL-AUR-03).
                </span>
              </div>
            </div>

            {/* Card 2: Outdated Price Contradiction */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">WEB AD CAMPAIGN</span>
                  <span className="text-rose-600 font-bold">OUTDATED</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    "Scale creative workflows with Cloud Studio starting at <span className="line-through text-rose-600 font-bold">₹599/mo</span> with unlimited audio mastering."
                  </p>
                </div>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>BLOCKS "₹599/mo":</strong> Active approved master price is <strong>₹499/mo</strong>. Proposed revision requires Digital Twin commit (FACT-AUR-PRC-01).
                </span>
              </div>
            </div>

            {/* Card 3: Expired Promotion */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">EMAIL NEWSLETTER</span>
                  <span className="text-rose-600 font-bold">EXPIRED</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2">
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    "Claim your <span className="line-through text-rose-600 font-bold">Free Founder Trial</span> with 12 months complimentary spatial access."
                  </p>
                </div>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>BLOCKS "Founder Trial":</strong> Promotional entitlement window expired in December 2025 (FACT-AUR-EXP-01).
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 3 — PRODUCT VISUAL GALLERY (6 Core Visual Pillars)          */}
      {/* ------------------------------------------------------------------- */}
      <section id="platform" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            End-to-End Control Plane
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Six Connected Pillars of Modern Governance
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            From raw document ingestion to multi-agent inspection, impact simulation, and public verification.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Pillar 1: Brand Intelligence Dashboard */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <LineChart className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              1. Brand Intelligence Dashboard
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Real-time enterprise command center tracking portfolio compliance (94.2%), active campaigns, statutory risk distribution, and live database health telemetry.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>View Executive Telemetry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 2: AI Content Risk Analysis */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              2. AI Content Risk Analysis
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Concurrent 3-agent orchestration (Voice, Claims, Regulatory) delivering monotonic response times under 800ms with character-level risk spans.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Inspect Multi-Agent Gate</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 3: Brand Knowledge Management */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              3. Brand Knowledge Studio
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Centralized studio for custom guidelines, PDF/DOCX uploads, SSRF-protected website imports, and automated immutable document versioning.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Manage Brand Documents</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 4: Brand Governance Digital Twin */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              4. Brand Governance Digital Twin
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Non-destructive virtual sandbox simulating commercial fact changes (e.g. ₹499 &rarr; ₹599) across upstream guidelines and downstream campaigns.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Explore Virtual Sandbox</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 5: Cascading Blast Radius Simulation */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              5. Cascading Blast Radius
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Quantifies organization-wide financial exposure ($320,000) and departmental review workload (12.5 hours) before authorized human commit.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>View Blast Radius Simulator</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Pillar 6: Public Content Verification */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all shadow-xs group">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              6. Public Verification Portal
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Zero-knowledge public verification portal allowing external consumers to verify seals, text, and image hashes without corporate credentials.
            </p>
            <div className="pt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span>Open Public Verifier</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </div>

      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 5 — PLATFORM FEATURES (10 Enterprise Cards)                 */}
      {/* ------------------------------------------------------------------- */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Technical Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ten Verified Governance Capabilities
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Engineered with zero mock data in production routes, backed by MongoDB Atlas and 163 automated test suites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {[
              {
                title: 'Brand Knowledge Management',
                desc: 'Upload PDFs, DOCX, TXT files or import web pages with automatic text indexing and version history.',
                icon: FileText,
                badge: 'STUDIO'
              },
              {
                title: 'AI Content Intelligence',
                desc: 'Concurrent 3-agent orchestration returning non-destructive character spans in <800ms.',
                icon: Cpu,
                badge: 'PRE-RELEASE'
              },
              {
                title: 'Brand Voice Analysis',
                desc: 'Audits tone, banned superlatives, vocabulary guidelines, and stylistic consistency.',
                icon: Sparkles,
                badge: 'VOICE AGENT'
              },
              {
                title: 'Claim Substantiation',
                desc: 'Grounds price, technical, and battery claims against active approved MongoDB facts.',
                icon: CheckCircle2,
                badge: 'FACT RAG'
              },
              {
                title: 'Regulatory Compliance',
                desc: 'Evaluates legal standards including FTC 16 CFR §260.4, FDA 21 CFR §870, and Lanham Act §43(a).',
                icon: Scale,
                badge: 'STATUTORY'
              },
              {
                title: 'Governance Digital Twin',
                desc: 'Simulates the organizational consequences of a commercial change in a virtual sandbox.',
                icon: Network,
                badge: 'INNOVATION'
              },
              {
                title: 'Cascading Blast Radius',
                desc: 'Traverses directed dependencies to quantify affected ads, landing pages, and dollar exposure.',
                icon: GitFork,
                badge: 'SIMULATOR'
              },
              {
                title: 'Human Approval Gate',
                desc: 'Zero autonomous publishing. Explicit review queue with role-based sign-off and audit notes.',
                icon: Lock,
                badge: 'HUMAN GATE'
              },
              {
                title: 'Cryptographic Ledger',
                desc: 'SHA-256 chained block digest sealing linking content, reviewer identity, and timestamp.',
                icon: Hash,
                badge: 'LEDGER'
              },
              {
                title: 'Public Verification Portal',
                desc: 'Zero-auth verification portal classifying assets as APPROVED, OUTDATED, MODIFIED, or UNKNOWN.',
                icon: ShieldCheck,
                badge: 'PUBLIC'
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{feature.badge}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {feature.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}

          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Strict Multi-Tenancy</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Every document, fact, and verification query scopes strictly by <code className="font-mono text-indigo-600 dark:text-indigo-400">org_id</code> and <code className="font-mono text-indigo-600 dark:text-indigo-400">workspace_id</code>. Cross-tenant probes return 404.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">SSRF Defense Engine</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Website import resolves DNS hostnames and strictly blocks loopback, private Class A/B/C spaces, and cloud metadata endpoints (169.254.169.254).
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">SHA-256 Chained Digests</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Internal Merkle-style block digests immutably bind content payload, asset ID, approving user identity, and timestamp into a tamper-evident seal.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero-Knowledge Verification</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Public verification endpoints return authentic status and hashes without leaking employee emails, user roles, or internal database identifiers.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Role-Based Access (RBAC)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Fine-grained privileges across Admin, Compliance Reviewer, Brand Manager, Creator, and Auditor. Only authorized roles can sign release seals.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Strict Human Gate</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Zero autonomous publishing. Every release candidate, fact revision, and policy change requires human review sign-off with recorded audit notes.
            </p>
          </div>

        </div>

      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 9 — FINAL CALL TO ACTION (Homage to reference banner)       */}
      {/* ------------------------------------------------------------------- */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-950 border-t border-slate-200 dark:border-slate-800 text-center relative overflow-hidden transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
          </div>

          {/* Bold Statement directly inspired by reference image 5 */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
              Silence is Never Clearance
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Make Every Brand Decision Verifiable.
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
              Bring your brand knowledge, content intelligence and governance workflows into one connected platform.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onEnterApp('command-center')}
              className="px-8 py-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 shadow-md hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onSignIn || (() => onEnterApp('command-center'))}
              className="px-7 py-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
            >
              Sign In to Control Plane
            </button>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* SECTION 10 — FOOTER                                                 */}
      {/* ------------------------------------------------------------------- */}
      <footer id="about" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Col 1: Identity */}
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                  BRANDTRACE AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The Autonomous Brand Intelligence &amp; Governance Control Plane. Detect. Predict. Verify. Prevent.
              </p>
              <div className="pt-1 text-[11px] font-mono text-slate-400 dark:text-slate-500">
                Team Storm Crackers • KPR Institute
              </div>
            </div>

            {/* Col 2: Platform Links */}
            <div className="space-y-2 text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Platform
              </span>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <li><button onClick={() => onEnterApp('command-center')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Command Center</button></li>
                <li><button onClick={() => onEnterApp('knowledge-base')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Brand Knowledge Base</button></li>
                <li><button onClick={() => onEnterApp('bdig')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Knowledge Graph (BDIG)</button></li>
                <li><button onClick={() => onEnterApp('content-studio')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Content Intelligence Studio</button></li>
                <li><button onClick={() => onEnterApp('impact-simulator')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Digital Twin Simulator</button></li>
                <li><button onClick={() => onEnterApp('approvals')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Approval Center</button></li>
              </ul>
            </div>

            {/* Col 3: Governance & Verification */}
            <div className="space-y-2 text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Verification
              </span>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <li><button onClick={onVerify || (() => onEnterApp('public-verification'))} className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold cursor-pointer">Public Verification Portal</button></li>
                <li><button onClick={() => onEnterApp('audit-trust')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Trust &amp; Audit Ledger</button></li>
                <li><button onClick={() => onEnterApp('risks')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Risk Intelligence</button></li>
                <li><button onClick={() => onEnterApp('campaigns')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">Campaign Intelligence</button></li>
              </ul>
            </div>

            {/* Col 4: Repository & Source */}
            <div className="space-y-2 text-xs">
              <span className="font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Open Source &amp; Submission
              </span>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                <li>
                  <a 
                    href="https://github.com/Jaswant-Karun/BrandTrace-AI" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold"
                  >
                    <span>GitHub Repository</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://brandtrace-backend.onrender.com/health" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <span>Live Health Endpoint</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a 
                    href="https://brandtrace-backend.onrender.com/docs" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                  >
                    <span>API Swagger Docs</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} BrandTrace AI. All rights reserved.</p>
            <p className="font-mono text-[11px]">Strict Multi-Tenant Architecture • SHA-256 Ledger Provenance</p>
          </div>

        </div>
      </footer>

    </div>
  );
};
