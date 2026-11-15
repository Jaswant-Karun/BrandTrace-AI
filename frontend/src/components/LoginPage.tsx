import React, { useState, memo } from 'react';
import {
  ShieldCheck, Lock, Mail, User,
  Eye, EyeOff, KeyRound, HelpCircle, X,
  Zap, AlertCircle, CheckCircle2, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSuccess: (user?: any) => void;
  onOpenLanding?: () => void;
}

// ===================================================================
// MEMOIZED 3D GEOMETRIC CONSTELLATION / POLYGONAL MESH OVERLAY
// Hoisted & memoized to prevent expensive SVG filter recalculation on every keystroke
// Styled with BrandTrace AI Landing Page Midnight Indigo & Obsidian Theme
// ===================================================================
const ConstellationBackground = memo(() => (
  <svg 
    className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none opacity-85 sm:opacity-90"
    viewBox="0 0 1000 1000"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      {/* Luminous Brand Indigo / Violet gradients matching Landing Page */}
      <linearGradient id="facetGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#544df2" stopOpacity="0.48" />
        <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.18" />
      </linearGradient>

      <linearGradient id="facetGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.16" />
      </linearGradient>

      <linearGradient id="facetGrad3" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.42" />
        <stop offset="100%" stopColor="#18181b" stopOpacity="0.14" />
      </linearGradient>

      <linearGradient id="facetGrad4" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.52" />
        <stop offset="100%" stopColor="#09090b" stopOpacity="0.22" />
      </linearGradient>

      <linearGradient id="brandWire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.70" />
        <stop offset="50%" stopColor="#6366f1" stopOpacity="0.50" />
        <stop offset="100%" stopColor="#4338ca" stopOpacity="0.30" />
      </linearGradient>

      {/* Node Glow Filter */}
      <filter id="indigoGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* ----------------- RIGHT-SIDE DENSE CRYSTALLINE CLUSTER ----------------- */}
    {/* Facet 1: Top Right */}
    <polygon points="760,130 910,70 860,240" fill="url(#facetGrad1)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.60" />
    <polygon points="860,240 985,180 935,360" fill="url(#facetGrad2)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.55" />
    <polygon points="860,240 935,360 805,370" fill="url(#facetGrad3)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.65" />
    <polygon points="710,230 760,130 860,240" fill="url(#facetGrad4)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.50" />
    <polygon points="710,230 860,240 805,370" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.45" fill="none" />

    {/* Facet 2: Middle Right Constellation */}
    <polygon points="805,370 935,360 905,530" fill="url(#facetGrad1)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.65" />
    <polygon points="805,370 905,530 815,595" fill="url(#facetGrad4)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.70" />
    <polygon points="935,360 1010,430 955,700" fill="url(#facetGrad2)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.50" />
    <polygon points="905,530 955,700 875,770" fill="url(#facetGrad3)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.60" />
    <polygon points="815,595 905,530 955,700" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.50" fill="none" />
    
    {/* Facet 3: Lower Right Crystal Formations */}
    <polygon points="715,525 815,595 775,720" fill="url(#facetGrad2)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.65" />
    <polygon points="815,595 875,770 825,905" fill="url(#facetGrad1)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.60" />
    <polygon points="775,720 875,770 825,905" fill="url(#facetGrad4)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.65" />
    <polygon points="625,685 775,720 715,840" fill="url(#facetGrad3)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.60" />
    <polygon points="525,765 625,685 585,885" fill="url(#facetGrad1)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.65" />
    <polygon points="415,815 525,765 475,945" fill="url(#facetGrad2)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.55" />

    {/* ----------------- LEFT-SIDE GEOMETRIC FACETS & LINES ----------------- */}
    <polygon points="35,420 165,370 125,520" fill="url(#facetGrad1)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.55" />
    <polygon points="125,520 235,480 195,640" fill="url(#facetGrad3)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.50" />
    <polygon points="15,580 125,520 95,690" fill="url(#facetGrad4)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.65" />
    <polygon points="95,690 195,640 175,800" fill="url(#facetGrad2)" stroke="#818cf8" strokeWidth="0.9" strokeOpacity="0.55" />
    <polygon points="0,710 95,690 45,840" fill="url(#facetGrad1)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.50" />
    <polygon points="95,690 175,800 125,910" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.55" fill="none" />
    <polygon points="175,800 285,740 255,910" fill="url(#facetGrad3)" stroke="#a5b4fc" strokeWidth="0.9" strokeOpacity="0.60" />
    <polygon points="285,740 385,790 345,940" stroke="#818cf8" strokeWidth="0.8" strokeOpacity="0.50" fill="none" />

    {/* ----------------- WIREFRAME NETWORK CONNECTORS ----------------- */}
    <line x1="390" y1="110" x2="520" y2="70" stroke="url(#brandWire)" strokeWidth="0.8" />
    <line x1="520" y1="70" x2="680" y2="90" stroke="url(#brandWire)" strokeWidth="0.8" />
    <line x1="680" y1="90" x2="760" y2="130" stroke="url(#brandWire)" strokeWidth="0.8" />
    <line x1="760" y1="130" x2="805" y2="370" stroke="url(#brandWire)" strokeWidth="0.8" />
    <line x1="805" y1="370" x2="715" y2="525" stroke="url(#brandWire)" strokeWidth="0.8" />
    <line x1="715" y1="525" x2="625" y2="685" stroke="url(#brandWire)" strokeWidth="0.8" />
    <line x1="165" y1="370" x2="310" y2="320" stroke="url(#brandWire)" strokeWidth="0.7" />
    <line x1="235" y1="480" x2="330" y2="580" stroke="url(#brandWire)" strokeWidth="0.7" />

    {/* ----------------- GLOWING INDIGO / PLUMBLINE NODES ----------------- */}
    <circle cx="760" cy="130" r="3.5" fill="#a5b4fc" filter="url(#indigoGlow)" />
    <circle cx="910" cy="70" r="3" fill="#818cf8" filter="url(#indigoGlow)" />
    <circle cx="860" cy="240" r="4" fill="#c7d2fe" filter="url(#indigoGlow)" />
    <circle cx="985" cy="180" r="3" fill="#818cf8" filter="url(#indigoGlow)" />
    <circle cx="935" cy="360" r="4" fill="#a5b4fc" filter="url(#indigoGlow)" />
    <circle cx="805" cy="370" r="4" fill="#c7d2fe" filter="url(#indigoGlow)" />
    <circle cx="905" cy="530" r="3.5" fill="#818cf8" filter="url(#indigoGlow)" />
    <circle cx="815" cy="595" r="4" fill="#c7d2fe" filter="url(#indigoGlow)" />
    <circle cx="955" cy="700" r="3.5" fill="#a5b4fc" filter="url(#indigoGlow)" />
    <circle cx="875" cy="770" r="4" fill="#c7d2fe" filter="url(#indigoGlow)" />
    <circle cx="775" cy="720" r="3.5" fill="#818cf8" filter="url(#indigoGlow)" />
    <circle cx="825" cy="905" r="3" fill="#a5b4fc" filter="url(#indigoGlow)" />
    <circle cx="625" cy="685" r="3.5" fill="#c7d2fe" filter="url(#indigoGlow)" />
    <circle cx="525" cy="765" r="3.5" fill="#818cf8" filter="url(#indigoGlow)" />
    <circle cx="415" cy="815" r="3" fill="#c7d2fe" filter="url(#indigoGlow)" />

    {/* Left Nodes */}
    <circle cx="165" cy="370" r="3.5" fill="#c7d2fe" filter="url(#indigoGlow)" />
    <circle cx="125" cy="520" r="4" fill="#a5b4fc" filter="url(#indigoGlow)" />
    <circle cx="235" cy="480" r="3.5" fill="#818cf8" filter="url(#indigoGlow)" />
    <circle cx="95" cy="690" r="4" fill="#c7d2fe" filter="url(#indigoGlow)" />
    <circle cx="195" cy="640" r="3.5" fill="#818cf8" filter="url(#indigoGlow)" />
    <circle cx="175" cy="800" r="4" fill="#c7d2fe" filter="url(#indigoGlow)" />
    <circle cx="285" cy="740" r="3.5" fill="#a5b4fc" filter="url(#indigoGlow)" />
  </svg>
));
ConstellationBackground.displayName = 'ConstellationBackground';

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

  // Handle normal login form submission with double-submission lock
  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return; // Prevent duplicate requests
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await login(loginEmail, loginPassword);
      onSuccess(user);
    } catch (err: any) {
      setErrorMessage(
        err.detail || err.message || 'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 1-click Demo Account Login with double-submission lock
  const handleOneClickDemo = async () => {
    if (isLoading) return;
    setLoginEmail('demo@brandtrace.ai');
    setLoginPassword('DemoAurelle2026!');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await login('demo@brandtrace.ai', 'DemoAurelle2026!');
      onSuccess(user);
    } catch (err: any) {
      setErrorMessage(
        err.detail || err.message || 'Demo login failed. Please verify credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle register submission with double-submission lock
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
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
      const user = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: 'BRAND_MANAGER',
        workspace_id: 'aurelle-tech'
      });
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        onSuccess(user);
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
      className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans"
      style={{
        background: 'radial-gradient(ellipse at 18% 18%, #1e1338 0%, #0d091e 35%, #050508 72%, #020204 100%)'
      }}
    >
      
      {/* 1. Memoized 3D Geometric Constellation Background */}
      <ConstellationBackground />

      {/* =================================================================== */}
      {/* 2. SLEEK ENTERPRISE HEADER (BrandTrace AI & Proverb / Welcome)      */}
      {/* =================================================================== */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-5 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#544df2]/20 border border-[#544df2]/40 text-indigo-400 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-extrabold tracking-tight text-white text-xs sm:text-base select-none">
                BRANDTRACE<span className="text-[#6366f1]">&nbsp;AI</span>
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-1.5 py-0.5 rounded font-mono shrink-0">
                CONTROL PLANE
              </span>
            </div>
          </div>
        </div>

        {/* Welcome Proverb Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-neutral-900/90 border border-neutral-700/80 text-neutral-300 text-[10px] sm:text-xs shadow-xs font-mono select-none">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden sm:inline italic text-neutral-400">“Silence is never clearance” &bull;</span>
          <span className="text-indigo-300 font-semibold">Welcome</span>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 3. CENTERPIECE FROSTED-GLASS CARD (Matching Reference Design)       */}
      {/* =================================================================== */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-8">
        
        <div 
          className="relative w-full max-w-[390px] sm:max-w-[420px] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl border border-indigo-400/30 dark:border-indigo-500/30 transition-all"
        >
          {/* Glassmorphic Gradient Fill */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 22%, rgba(28, 24, 66, 0.90) 46%, rgba(18, 18, 24, 0.97) 72%, rgba(8, 8, 12, 0.99) 100%)'
            }}
          />

          {/* Card Inner Content */}
          <div className="relative z-10 p-6 sm:p-8 space-y-4">
            
            {/* Header: MEMBER LOGIN with Supporting Welcome Proverb */}
            <div className="pt-1 pb-1 select-none text-center">
              <h1 className="font-extrabold uppercase tracking-[0.25em] text-white text-base sm:text-lg select-none drop-shadow-sm">
                {authMode === 'login' ? 'MEMBER LOGIN' : 'CREATE ACCOUNT'}
              </h1>
              <p className="text-[11px] font-medium text-indigo-100/90 tracking-wide mt-1">
                {authMode === 'login' 
                  ? '“Silence is never clearance.” — Welcome to BrandTrace AI' 
                  : '“Truth before publication.” — Create your enterprise account'}
              </p>
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
                  <div className="flex items-center bg-[#131318] border border-neutral-700/80 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30 rounded-md px-3.5 py-3 shadow-inner transition-colors">
                    <User className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      placeholder="Username"
                      className="w-full bg-transparent text-white placeholder:text-neutral-500 text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-70"
                    />
                  </div>
                </div>

                {/* Input 2: Password */}
                <div>
                  <div className="flex items-center bg-[#131318] border border-neutral-700/80 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30 rounded-md px-3.5 py-3 shadow-inner transition-colors">
                    <Lock className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      placeholder="Password"
                      className="w-full bg-transparent text-white placeholder:text-neutral-500 text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="text-neutral-400 hover:text-white cursor-pointer ml-2 p-0.5 transition-colors"
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Button: LOGIN (Clean Solid White Button) */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-white hover:bg-neutral-100 text-neutral-950 font-bold uppercase tracking-[0.22em] text-xs sm:text-sm rounded-md shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
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
                    className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Forgot Password? <span className="underline decoration-indigo-400/60 hover:decoration-white font-medium text-neutral-300">Click Here</span>
                  </button>
                </div>

                {/* Horizontal Engraved Inset Divider Line */}
                <div className="relative py-1">
                  <div className="border-t border-neutral-800 shadow-[0_1px_0_rgba(255,255,255,0.06)] w-full" />
                </div>

                {/* Secondary Button: REGISTER (BrandTrace AI Indigo / Purple Button) */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  className="w-full py-3 px-4 bg-[#544df2] hover:bg-indigo-500 text-white font-bold uppercase tracking-[0.22em] text-xs sm:text-sm rounded-md shadow-md ring-1 ring-indigo-400/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                >
                  <span>REGISTER</span>
                </button>

                {/* 4. Preserved 1-Click Demo Account */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOneClickDemo}
                    disabled={isLoading}
                    title="Authenticate instantly as Alex Mercer (Brand Manager)"
                    className="w-full py-2.5 px-3 bg-neutral-900/90 hover:bg-neutral-850 border border-indigo-500/40 hover:border-indigo-400 text-neutral-200 rounded-md text-[11px] font-mono flex items-center justify-between cursor-pointer transition-all shadow-xs group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="font-bold text-white tracking-wide truncate">1-Click Demo Login</span>
                    </div>
                    <span className="text-[10px] text-indigo-300 font-medium shrink-0 group-hover:text-white">
                      demo@brandtrace.ai &rarr;
                    </span>
                  </button>
                  <div className="text-center text-[10px] font-mono text-neutral-500 pt-1.5">
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
                <div className="flex items-center bg-[#131318] border border-neutral-700/80 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30 rounded-md px-3.5 py-2.5 shadow-inner transition-colors">
                  <User className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    disabled={isLoading}
                    required
                    placeholder="Full Name (e.g. Alex Mercer)"
                    className="w-full bg-transparent text-white placeholder:text-neutral-500 text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-70"
                  />
                </div>

                {/* Corporate Email */}
                <div className="flex items-center bg-[#131318] border border-neutral-700/80 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30 rounded-md px-3.5 py-2.5 shadow-inner transition-colors">
                  <Mail className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    placeholder="Corporate Email (alex@company.com)"
                    className="w-full bg-transparent text-white placeholder:text-neutral-500 text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-70"
                  />
                </div>

                {/* Password */}
                <div className="flex items-center bg-[#131318] border border-neutral-700/80 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30 rounded-md px-3.5 py-2.5 shadow-inner transition-colors">
                  <Lock className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    placeholder="Password (min 8 chars)"
                    className="w-full bg-transparent text-white placeholder:text-neutral-500 text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="text-neutral-400 hover:text-white cursor-pointer ml-2 p-0.5 transition-colors"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="flex items-center bg-[#131318] border border-neutral-700/80 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-500/30 rounded-md px-3.5 py-2.5 shadow-inner transition-colors">
                  <KeyRound className="w-4 h-4 text-neutral-400 shrink-0 mr-3" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    placeholder="Confirm Password"
                    className="w-full bg-transparent text-white placeholder:text-neutral-500 text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-70"
                  />
                </div>

                {/* Primary Register Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#544df2] hover:bg-indigo-500 text-white font-bold uppercase tracking-[0.22em] text-xs sm:text-sm rounded-md shadow-md ring-1 ring-indigo-400/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>CREATE ACCOUNT</span>
                  )}
                </button>

                {/* Divider Line */}
                <div className="relative py-1">
                  <div className="border-t border-neutral-800 shadow-[0_1px_0_rgba(255,255,255,0.06)] w-full" />
                </div>

                {/* Back to Login Button */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className="w-full py-3 px-4 bg-white hover:bg-neutral-100 text-neutral-950 font-bold uppercase tracking-[0.22em] text-xs sm:text-sm rounded-md shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
                >
                  <span>BACK TO LOGIN</span>
                </button>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* =================================================================== */}
      {/* 4. MINIMAL TELEMETRY FOOTER                                         */}
      {/* =================================================================== */}
      <footer className="relative z-20 px-5 sm:px-8 py-3 text-[11px] font-mono text-neutral-500 flex items-center justify-between max-w-7xl w-full mx-auto border-t border-neutral-900">
        <span>&copy; {new Date().getFullYear()} BRANDTRACE AI &bull; Autonomous Brand Intelligence</span>
        <div className="flex items-center gap-3">
          <span>Enterprise Guardrail</span>
          <span>&bull;</span>
          <span>SHA-256 Verified</span>
        </div>
      </footer>

      {/* =================================================================== */}
      {/* 5. FORGOT PASSWORD HELPER MODAL (Pure CSS Fast Transition)           */}
      {/* =================================================================== */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-[#131316] border border-neutral-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-white transform transition-all duration-200 scale-100 opacity-100"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold tracking-wide">Enterprise Password Recovery</h3>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <p>
                BrandTrace AI utilizes enterprise cryptographic credentials with tenant isolation.
              </p>
              <div className="p-3 bg-black/60 rounded-xl border border-neutral-800 space-y-1.5 font-mono text-[11px] text-neutral-300">
                <div><strong>Demo User:</strong> demo@brandtrace.ai</div>
                <div><strong>Demo Pass:</strong> DemoAurelle2026!</div>
                <div><strong>Tenant Role:</strong> Alex Mercer (Brand Manager)</div>
              </div>
              <p className="text-[11px] text-neutral-400">
                For enterprise account resets, contact your IT workspace security officer.
              </p>
            </div>

            <button
              onClick={() => {
                setLoginEmail('demo@brandtrace.ai');
                setLoginPassword('DemoAurelle2026!');
                setIsForgotPasswordOpen(false);
              }}
              className="w-full py-2.5 bg-[#544df2] hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors shadow-md"
            >
              Autofill Demo Credentials
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
