import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Lock, Mail, ArrowRight,
  AlertCircle, CheckCircle2, User,
  Eye, EyeOff, KeyRound, HelpCircle, X
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

  // Sign In Form State (Pre-filled for seamless testing)
  const [loginEmail, setLoginEmail] = useState<string>('demo@brandtrace.ai');
  const [loginPassword, setLoginPassword] = useState<string>('DemoAurelle2026!');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row selection:bg-slate-900 selection:text-white dark:selection:bg-indigo-600 dark:selection:text-white transition-colors duration-200">
      
      {/* =================================================================== */}
      {/* LEFT SIDE — SIMPLIFIED ENTERPRISE AUTHENTICATION FORM (50% desktop) */}
      {/* =================================================================== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 min-h-screen bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
        
        {/* Top Header: Brand Logo & Theme Toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base select-none">
                  BRANDTRACE<span className="text-indigo-600 dark:text-indigo-400">&nbsp;AI</span>
                </span>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono shrink-0">
                  Control Plane
                </span>
              </div>
            </div>
          </div>

          <ThemeToggle />
        </div>

        {/* Center Content: Clean Minimal Auth Form */}
        <div className="w-full max-w-sm mx-auto py-8 sm:py-12">
          
          {/* Header Texts */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {authMode === 'login'
                ? 'Sign in to continue to BrandTrace AI.'
                : 'Start governing your brand with BrandTrace AI.'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-snug">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-snug">{successMessage}</p>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SIGN IN FORM                                                  */}
          {/* ------------------------------------------------------------- */}
          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="demo@brandtrace.ai"
                    className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-850 transition-all font-medium shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-850 transition-all font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-0.5"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-indigo-600 focus:ring-slate-900 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-1"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Register
                </button>
              </p>
            </form>
          ) : (
            /* ------------------------------------------------------------- */
            /* REGISTER FORM                                                 */
            /* ------------------------------------------------------------- */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="Alex Mercer"
                    className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="alex@company.com"
                    className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    placeholder="At least 8 characters"
                    className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className="w-full bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-1"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-3">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

        </div>

        {/* Minimal Footer */}
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <span>&copy; {new Date().getFullYear()} BrandTrace AI</span>
          <div className="flex items-center gap-3">
            <span>Privacy</span>
            <span>&bull;</span>
            <span>Terms</span>
          </div>
        </div>

      </div>

      {/* =================================================================== */}
      {/* RIGHT SIDE — MINIMAL & BALANCED VISUAL ARTWORK (50% desktop)        */}
      {/* =================================================================== */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 text-white relative overflow-hidden flex-col justify-between p-12 xl:p-16 border-l border-slate-800 selection:bg-indigo-600">
        
        {/* Subtle Ambient Lighting Backdrop */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-1/4 right-1/4 w-[420px] h-[420px] bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-[380px] h-[380px] bg-purple-600/15 rounded-full blur-3xl" />
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', 
              backgroundSize: '24px 24px' 
            }} 
          />
        </div>

        {/* Top Status Indicator */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="tracking-wider uppercase">Autonomous Brand Intelligence Control Plane</span>
        </div>

        {/* Center Artwork: Single Balanced BrandTrace Visual Composition */}
        <div className="w-full max-w-md mx-auto py-8">
          
          {/* Glass Card Composition */}
          <div className="relative rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl backdrop-blur-xl">
            
            {/* Top Row: Core Status & Verification Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white tracking-wide">Brand Governance Core</div>
                  <div className="text-[10px] font-mono text-slate-400">Continuous Knowledge Guardrail</div>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VERIFIED
              </span>
            </div>

            {/* Middle Row: Visual Intelligence Indicators */}
            <div className="pt-4 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Ground Truth Substantiation</span>
                <span className="font-mono text-emerald-400 font-semibold text-[11px]">100% Certified</span>
              </div>
              
              <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div className="bg-gradient-to-r from-indigo-500 via-purple-400 to-emerald-400 h-full w-full rounded-full" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Release Seal</span>
                  <span className="text-slate-300 font-bold">SHA-256 Chained</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Impact Blast Radius</span>
                  <span className="text-emerald-400 font-bold">Zero Violations</span>
                </div>
              </div>
            </div>

          </div>

          {/* Clean Brand Statement Below the Composition */}
          <div className="mt-8 space-y-2 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Intelligence Behind Every Brand Decision.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Connect brand knowledge, detect content risks, simulate changes and verify every approved release.
            </p>
          </div>

        </div>

        {/* Bottom Minimal Platform Telemetry */}
        <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between pt-4 border-t border-slate-800/80">
          <span>Enterprise Multi-Tenant Isolation</span>
          <span>v2.0 Control Plane</span>
        </div>

      </div>

      {/* ------------------------------------------------------------------- */}
      {/* FORGOT PASSWORD HELPER MODAL                                        */}
      {/* ------------------------------------------------------------------- */}
      <AnimatePresence>
        {isForgotPasswordOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Password Recovery</h3>
                </div>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  BrandTrace AI utilizes enterprise single-tenant cryptographic credentials.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px]">
                  <div><strong>Demo Account:</strong> demo@brandtrace.ai</div>
                  <div><strong>Demo Password:</strong> DemoAurelle2026!</div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  For production credentials, contact your enterprise workspace administrator.
                </p>
              </div>

              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
