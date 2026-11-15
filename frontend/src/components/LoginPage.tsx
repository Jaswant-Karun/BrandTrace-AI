import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldCheck, Lock, Mail, User,
  Eye, EyeOff, KeyRound, HelpCircle, X,
  Zap, AlertCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ui/ThemeToggle';

interface LoginPageProps {
  onSuccess: () => void;
  onOpenLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();

  // Tab state: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);

  // Sign In Form State (Pre-filled with official demo account for 1-click ease)
  const [loginEmail, setLoginEmail] = useState<string>('demo@brandtrace.ai');
  const [loginPassword, setLoginPassword] = useState<string>('DemoAurelle2026!');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);

  // Status state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle normal login form submission
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(loginEmail, loginPassword);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.detail || err.message || 'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 1-click Demo Account Login (Section 5 Preservation Requirement)
  const handleOneClickDemo = async () => {
    setLoginEmail('demo@brandtrace.ai');
    setLoginPassword('DemoAurelle2026!');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login('demo@brandtrace.ai', 'DemoAurelle2026!');
      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.detail || err.message || 'Demo login failed. Please verify credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('A valid corporate email address is required.');
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: 'BRAND_MANAGER',
        workspace_id: 'aurelle-tech'
      });
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      setErrorMessage(
        err.detail || err.message || 'Registration failed. This email may already be registered.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between selection:bg-teal-500 selection:text-slate-950 font-sans"
      style={{
        background: 'radial-gradient(ellipse at 15% 15%, #3d1037 0%, #1e122b 32%, #081620 65%, #03080d 100%)'
      }}
    >
      
      {/* =================================================================== */}
      {/* 2. 3D GEOMETRIC CONSTELLATION / POLYGONAL MESH OVERLAY              */}
      {/* =================================================================== */}
      <svg 
        className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none opacity-90 sm:opacity-95"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Luminous emerald/cyan gradients for 3D polygonal facets */}
          <linearGradient id="facetGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38ef7d" stopOpacity="0.50" />
            <stop offset="100%" stopColor="#11998e" stopOpacity="0.20" />
          </linearGradient>

          <linearGradient id="facetGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#24d3b6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0d5d56" stopOpacity="0.18" />
          </linearGradient>

          <linearGradient id="facetGrad3" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0a6157" stopOpacity="0.15" />
          </linearGradient>

          <linearGradient id="facetGrad4" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#20c997" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#063833" stopOpacity="0.22" />
          </linearGradient>

          <linearGradient id="goldWire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#d4af37" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#e5c07b" stopOpacity="0.40" />
          </linearGradient>

          {/* Node Glow Filter */}
          <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ----------------- RIGHT-SIDE DENSE CRYSTALLINE CLUSTER ----------------- */}
        {/* Facet 1: Top Right */}
        <polygon points="760,130 910,70 860,240" fill="url(#facetGrad1)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.65" />
        <polygon points="860,240 985,180 935,360" fill="url(#facetGrad2)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.60" />
        <polygon points="860,240 935,360 805,370" fill="url(#facetGrad3)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.70" />
        <polygon points="710,230 760,130 860,240" fill="url(#facetGrad4)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.55" />
        <polygon points="710,230 860,240 805,370" stroke="#d4af37" strokeWidth="0.8" strokeOpacity="0.50" fill="none" />

        {/* Facet 2: Middle Right Constellation */}
        <polygon points="805,370 935,360 905,530" fill="url(#facetGrad1)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.70" />
        <polygon points="805,370 905,530 815,595" fill="url(#facetGrad4)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.75" />
        <polygon points="935,360 1010,430 955,700" fill="url(#facetGrad2)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.55" />
        <polygon points="905,530 955,700 875,770" fill="url(#facetGrad3)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.65" />
        <polygon points="815,595 905,530 955,700" stroke="#d4af37" strokeWidth="0.8" strokeOpacity="0.55" fill="none" />
        
        {/* Facet 3: Lower Right Crystal Formations */}
        <polygon points="715,525 815,595 775,720" fill="url(#facetGrad2)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.70" />
        <polygon points="815,595 875,770 825,905" fill="url(#facetGrad1)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.65" />
        <polygon points="775,720 875,770 825,905" fill="url(#facetGrad4)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.70" />
        <polygon points="625,685 775,720 715,840" fill="url(#facetGrad3)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.65" />
        <polygon points="525,765 625,685 585,885" fill="url(#facetGrad1)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.70" />
        <polygon points="415,815 525,765 475,945" fill="url(#facetGrad2)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.60" />

        {/* ----------------- LEFT-SIDE GEOMETRIC FACETS & LINES ----------------- */}
        <polygon points="35,420 165,370 125,520" fill="url(#facetGrad1)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.60" />
        <polygon points="125,520 235,480 195,640" fill="url(#facetGrad3)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.55" />
        <polygon points="15,580 125,520 95,690" fill="url(#facetGrad4)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.70" />
        <polygon points="95,690 195,640 175,800" fill="url(#facetGrad2)" stroke="#d4af37" strokeWidth="0.9" strokeOpacity="0.60" />
        <polygon points="0,710 95,690 45,840" fill="url(#facetGrad1)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.55" />
        <polygon points="95,690 175,800 125,910" stroke="#d4af37" strokeWidth="0.8" strokeOpacity="0.60" fill="none" />
        <polygon points="175,800 285,740 255,910" fill="url(#facetGrad3)" stroke="#e5c07b" strokeWidth="0.9" strokeOpacity="0.65" />
        <polygon points="285,740 385,790 345,940" stroke="#d4af37" strokeWidth="0.8" strokeOpacity="0.55" fill="none" />

        {/* ----------------- GOLD WIREFRAME NETWORK CONNECTORS ----------------- */}
        <line x1="390" y1="110" x2="520" y2="70" stroke="url(#goldWire)" strokeWidth="0.8" />
        <line x1="520" y1="70" x2="680" y2="90" stroke="url(#goldWire)" strokeWidth="0.8" />
        <line x1="680" y1="90" x2="760" y2="130" stroke="url(#goldWire)" strokeWidth="0.8" />
        <line x1="760" y1="130" x2="805" y2="370" stroke="url(#goldWire)" strokeWidth="0.8" />
        <line x1="805" y1="370" x2="715" y2="525" stroke="url(#goldWire)" strokeWidth="0.8" />
        <line x1="715" y1="525" x2="625" y2="685" stroke="url(#goldWire)" strokeWidth="0.8" />
        <line x1="165" y1="370" x2="310" y2="320" stroke="url(#goldWire)" strokeWidth="0.7" />
        <line x1="235" y1="480" x2="330" y2="580" stroke="url(#goldWire)" strokeWidth="0.7" />

        {/* ----------------- GLOWING CYAN / MINT NODES ----------------- */}
        <circle cx="760" cy="130" r="3.5" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="910" cy="70" r="3" fill="#5eead4" filter="url(#cyanGlow)" />
        <circle cx="860" cy="240" r="4" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="985" cy="180" r="3" fill="#5eead4" filter="url(#cyanGlow)" />
        <circle cx="935" cy="360" r="4" fill="#a7f3d0" filter="url(#cyanGlow)" />
        <circle cx="805" cy="370" r="4" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="905" cy="530" r="3.5" fill="#5eead4" filter="url(#cyanGlow)" />
        <circle cx="815" cy="595" r="4" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="955" cy="700" r="3.5" fill="#a7f3d0" filter="url(#cyanGlow)" />
        <circle cx="875" cy="770" r="4" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="775" cy="720" r="3.5" fill="#5eead4" filter="url(#cyanGlow)" />
        <circle cx="825" cy="905" r="3" fill="#a7f3d0" filter="url(#cyanGlow)" />
        <circle cx="625" cy="685" r="3.5" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="525" cy="765" r="3.5" fill="#5eead4" filter="url(#cyanGlow)" />
        <circle cx="415" cy="815" r="3" fill="#7fffd4" filter="url(#cyanGlow)" />

        {/* Left Nodes */}
        <circle cx="165" cy="370" r="3.5" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="125" cy="520" r="4" fill="#a7f3d0" filter="url(#cyanGlow)" />
        <circle cx="235" cy="480" r="3.5" fill="#5eead4" filter="url(#cyanGlow)" />
        <circle cx="95" cy="690" r="4" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="195" cy="640" r="3.5" fill="#5eead4" filter="url(#cyanGlow)" />
        <circle cx="175" cy="800" r="4" fill="#7fffd4" filter="url(#cyanGlow)" />
        <circle cx="285" cy="740" r="3.5" fill="#a7f3d0" filter="url(#cyanGlow)" />
      </svg>

      {/* =================================================================== */}
      {/* 3. SLEEK ENTERPRISE HEADER (BrandTrace AI & Theme Control)         */}
      {/* =================================================================== */}
      <header className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-extrabold tracking-tight text-white text-sm sm:text-base select-none">
                BRANDTRACE<span className="text-teal-400">&nbsp;AI</span>
              </span>
              <span className="text-[9px] font-bold bg-teal-950/80 text-teal-300 border border-teal-800/80 px-1.5 py-0.5 rounded font-mono shrink-0">
                CONTROL PLANE
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle variant="pill" className="bg-slate-900/80 border-teal-900/60 text-teal-300 hover:border-teal-600/60" />
        </div>
      </header>

      {/* =================================================================== */}
      {/* 4. CENTERPIECE FROSTED-GLASS CARD (Matching Reference Design)       */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-4 sm:py-8">
        <div 
          className="relative w-full max-w-[390px] sm:max-w-[420px] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl border border-teal-300/40 dark:border-teal-400/30 transition-all"
        >
          {/* Exact Glassmorphic Gradient Fill from Reference Screenshot */}
          {/* Luminous Light Seafoam/Mint top wash fading to deep dark forest-teal glass */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #62e7df 0%, #46cfc6 22%, rgba(28, 92, 98, 0.88) 46%, rgba(14, 46, 50, 0.96) 72%, rgba(7, 24, 27, 0.99) 100%)'
            }}
          />

          {/* Card Inner Content */}
          <div className="relative z-10 p-6 sm:p-8 space-y-4">
            
            {/* Header: MEMBER LOGIN (Exact Typography & Deep Teal Contrast against radiant mint wash) */}
            <div className="pt-1 pb-1 select-none">
              <h1 className="text-center font-bold uppercase tracking-[0.25em] text-[#135750] text-base sm:text-lg select-none">
                {authMode === 'login' ? 'MEMBER LOGIN' : 'CREATE ACCOUNT'}
              </h1>
            </div>

            {/* Error Message Feedback */}
            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/60 rounded-lg flex items-start gap-2 text-xs text-rose-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
            )}

            {/* Success Message Feedback */}
            {successMessage && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-lg flex items-start gap-2 text-xs text-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-snug">{successMessage}</p>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: SIGN IN / MEMBER LOGIN                                   */}
            {/* ------------------------------------------------------------- */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-1">
                
                {/* Input 1: Username / Corporate Email */}
                <div>
                  <div className="flex items-center bg-[#1c3d40] border border-teal-700/70 focus-within:border-teal-300 rounded-md px-3.5 py-3 shadow-inner transition-colors">
                    <User className="w-4 h-4 text-white shrink-0 mr-3" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="Username"
                      className="w-full bg-transparent text-white placeholder:text-teal-200/50 text-xs sm:text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Input 2: Password */}
                <div>
                  <div className="flex items-center bg-[#1c3d40] border border-teal-700/70 focus-within:border-teal-300 rounded-md px-3.5 py-3 shadow-inner transition-colors">
                    <Lock className="w-4 h-4 text-white shrink-0 mr-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="Password"
                      className="w-full bg-transparent text-white placeholder:text-teal-200/50 text-xs sm:text-sm font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="text-teal-200/70 hover:text-white cursor-pointer ml-2 p-0.5 transition-colors"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Button: LOGIN (Pale Mint / Bone White Solid Button) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#d7e5de] hover:bg-white text-slate-900 font-bold uppercase tracking-[0.22em] text-xs sm:text-sm rounded-md shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <span>LOGIN</span>
                  )}
                </button>

                {/* Centered Link: Forgot Password? Click Here */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs text-teal-100/85 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot Password? <span className="underline decoration-teal-300/50 hover:decoration-white font-medium">Click Here</span>
                  </button>
                </div>

                {/* Horizontal Engraved Inset Divider Line */}
                <div className="relative py-1">
                  <div className="border-t border-teal-900/80 shadow-[0_1px_0_rgba(255,255,255,0.12)] w-full" />
                </div>

                {/* Secondary Button: REGISTER (Vibrant Emerald / Cyan Teal Solid Button) */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  className="w-full py-3 px-4 bg-[#24c89d] hover:bg-[#20b88f] text-slate-950 font-bold uppercase tracking-[0.22em] text-xs sm:text-sm rounded-md shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <span>REGISTER</span>
                </button>

                {/* ========================================================= */}
                {/* 5. PRESERVED DEMO ACCOUNT (Requirement 5 Compliance)      */}
                {/* ========================================================= */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOneClickDemo}
                    disabled={isLoading}
                    title="Authenticate instantly as Alex Mercer (Brand Manager)"
                    className="w-full py-2.5 px-3 bg-[#133c40]/80 hover:bg-[#18494e] border border-teal-500/40 hover:border-teal-400 text-teal-200 rounded-md text-[11px] font-mono flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-white tracking-wide truncate">1-Click Demo Login</span>
                    </div>
                    <span className="text-[10px] text-teal-300/90 font-medium shrink-0 group-hover:text-white">
                      demo@brandtrace.ai &rarr;
                    </span>
                  </button>
                  <div className="text-center text-[10px] font-mono text-teal-200/55 pt-1.5">
                    Pre-configured: demo@brandtrace.ai &bull; DemoAurelle2026!
                  </div>
                </div>

              </form>
            ) : (
              /* ------------------------------------------------------------- */
              /* TAB: REGISTER / CREATE ACCOUNT                                */
              /* ------------------------------------------------------------- */
              <form onSubmit={handleRegisterSubmit} className="space-y-3 pt-1">
                
                {/* Full Name */}
                <div className="flex items-center bg-[#1c3d40] border border-teal-700/70 focus-within:border-teal-300 rounded-md px-3.5 py-2.5 shadow-inner transition-colors">
                  <User className="w-4 h-4 text-white shrink-0 mr-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="Full Name (e.g. Alex Mercer)"
                    className="w-full bg-transparent text-white placeholder:text-teal-200/50 text-xs sm:text-sm font-medium focus:outline-none"
                  />
                </div>

                {/* Corporate Email */}
                <div className="flex items-center bg-[#1c3d40] border border-teal-700/70 focus-within:border-teal-300 rounded-md px-3.5 py-2.5 shadow-inner transition-colors">
                  <Mail className="w-4 h-4 text-white shrink-0 mr-3" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="Corporate Email (alex@company.com)"
                    className="w-full bg-transparent text-white placeholder:text-teal-200/50 text-xs sm:text-sm font-medium focus:outline-none"
                  />
                </div>

                {/* Password */}
                <div className="flex items-center bg-[#1c3d40] border border-teal-700/70 focus-within:border-teal-300 rounded-md px-3.5 py-2.5 shadow-inner transition-colors">
                  <Lock className="w-4 h-4 text-white shrink-0 mr-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="Password (min 8 chars)"
                    className="w-full bg-transparent text-white placeholder:text-teal-200/50 text-xs sm:text-sm font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-teal-200/70 hover:text-white cursor-pointer ml-2 p-0.5 transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="flex items-center bg-[#1c3d40] border border-teal-700/70 focus-within:border-teal-300 rounded-md px-3.5 py-2.5 shadow-inner transition-colors">
                  <KeyRound className="w-4 h-4 text-white shrink-0 mr-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm Password"
                    className="w-full bg-transparent text-white placeholder:text-teal-200/50 text-xs sm:text-sm font-medium focus:outline-none"
                  />
                </div>

                {/* Primary Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#24c89d] hover:bg-[#20b88f] text-slate-950 font-bold uppercase tracking-[0.22em] text-xs sm:text-sm rounded-md shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  ) : (
                    <span>CREATE ACCOUNT</span>
                  )}
                </button>

                {/* Divider Line */}
                <div className="relative py-1">
                  <div className="border-t border-teal-900/80 shadow-[0_1px_0_rgba(255,255,255,0.12)] w-full" />
                </div>

                {/* Back to Login Button */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className="w-full py-3 px-4 bg-[#d7e5de] hover:bg-white text-slate-900 font-bold uppercase tracking-[0.22em] text-xs sm:text-sm rounded-md shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <span>BACK TO LOGIN</span>
                </button>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* =================================================================== */}
      {/* 5. MINIMAL TELEMETRY FOOTER                                         */}
      {/* =================================================================== */}
      <footer className="relative z-20 px-5 sm:px-8 py-3 text-[11px] font-mono text-teal-200/60 flex items-center justify-between max-w-7xl w-full mx-auto border-t border-teal-950/40">
        <span>&copy; {new Date().getFullYear()} BRANDTRACE AI &bull; Autonomous Brand Intelligence</span>
        <div className="flex items-center gap-3">
          <span>Enterprise Guardrail</span>
          <span>&bull;</span>
          <span>SHA-256 Verified</span>
        </div>
      </footer>

      {/* =================================================================== */}
      {/* 6. FORGOT PASSWORD HELPER MODAL                                     */}
      {/* =================================================================== */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-teal-500/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-white"
            >
              <div className="flex items-center justify-between border-b border-teal-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold tracking-wide">Enterprise Password Recovery</h3>
                </div>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  BrandTrace AI utilizes enterprise cryptographic credentials with tenant isolation.
                </p>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-teal-900/80 space-y-1.5 font-mono text-[11px] text-teal-200">
                  <div><strong>Demo User:</strong> demo@brandtrace.ai</div>
                  <div><strong>Demo Pass:</strong> DemoAurelle2026!</div>
                  <div><strong>Tenant Role:</strong> Alex Mercer (Brand Manager)</div>
                </div>
                <p className="text-[11px] text-slate-400">
                  For enterprise account resets, contact your IT workspace security officer.
                </p>
              </div>

              <button
                onClick={() => {
                  setLoginEmail('demo@brandtrace.ai');
                  setLoginPassword('DemoAurelle2026!');
                  setIsForgotPasswordOpen(false);
                }}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Autofill Demo Credentials
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
