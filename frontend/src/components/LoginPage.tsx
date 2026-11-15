import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles,
  AlertCircle, CheckCircle2, User,
  Eye, EyeOff, Database, KeyRound, Check,
  HelpCircle, X, ShieldAlert, Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ui/ThemeToggle';

interface LoginPageProps {
  onSuccess: () => void;
  onOpenLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onOpenLanding }) => {
  const { login, register } = useAuth();
  
  // Tab state: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState<string>('demo@brandtrace.ai');
  const [loginPassword, setLoginPassword] = useState<string>('DemoAurelle2026!');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<string>('BRAND_MANAGER');
  const [regWorkspace, setRegWorkspace] = useState<string>('aurelle-tech');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Status state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password Strength Calculation for Register Form
  const passwordStrength = {
    length: regPassword.length >= 8,
    hasNumber: /\d/.test(regPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(regPassword)
  };

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
    if (!agreeTerms) {
      setErrorMessage('You must acknowledge server-side RBAC and audit policies.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        workspace_id: regWorkspace
      });
      setSuccessMessage('Account created successfully! Redirecting...');
      setTimeout(() => {
        onSuccess();
      }, 600);
    } catch (err: any) {
      setErrorMessage(
        err.detail || err.message || 'Registration failed. This email may already be registered.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setAuthMode('login');
    setLoginEmail('demo@brandtrace.ai');
    setLoginPassword('DemoAurelle2026!');
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login('demo@brandtrace.ai', 'DemoAurelle2026!');
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = async (presetEmail: string, presetPassword: string) => {
    setAuthMode('login');
    setLoginEmail(presetEmail);
    setLoginPassword(presetPassword);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(presetEmail, presetPassword);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.detail || err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row selection:bg-slate-900 selection:text-white dark:selection:bg-indigo-600 dark:selection:text-white transition-colors duration-200">
      
      {/* =================================================================== */}
      {/* LEFT SIDE — AUTHENTICATION FORM (50% on desktop, full on mobile)    */}
      {/* =================================================================== */}
      <div className="w-full lg:w-1/2 xl:w-5/12 bg-white dark:bg-slate-950 flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto min-h-screen border-r border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
        
        {/* Top Header inside Left Pane */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
                    BRANDTRACE<span className="text-indigo-600 dark:text-indigo-400"> AI</span>
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.2 rounded font-mono">
                    Control Plane
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Autonomous Brand Governance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {onOpenLanding && (
                <button
                  onClick={onOpenLanding}
                  className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="View Public Product Overview"
                >
                  Overview
                </button>
              )}
            </div>
          </div>

          {/* Welcome Heading & Supporting Description */}
          <div className="space-y-1.5 mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {authMode === 'login' ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {authMode === 'login'
                ? 'Sign in to access your brand knowledge graph, multi-agent inspection studio, and cryptographic release ledger.'
                : 'Set up your enterprise profile and connect to an isolated brand governance workspace.'}
            </p>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                authMode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                authMode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 mb-5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Authentication Notice</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 mb-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Success</span>
                <p>{successMessage}</p>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 1: SIGN IN FORM                                             */}
          {/* --------------------------------------------------------------- */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Corporate Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="demo@brandtrace.ai"
                    className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-slate-900 dark:focus:ring-indigo-500 transition-all font-medium shadow-2xs"
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
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-medium"
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
                    className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-slate-900 dark:focus:ring-indigo-500 transition-all font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-indigo-600 focus:ring-slate-900 cursor-pointer"
                  />
                  <span>Remember this device</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setLoginEmail('demo@brandtrace.ai');
                    setLoginPassword('DemoAurelle2026!');
                  }}
                  className="text-slate-800 dark:text-indigo-400 hover:underline font-medium text-[11px] cursor-pointer"
                >
                  Autofill Demo
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Control Plane</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* --------------------------------------------------------------- */}
          {/* TAB 2: REGISTER FORM                                            */}
          {/* --------------------------------------------------------------- */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      placeholder="e.g. Julian Vance"
                      className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      placeholder="julian@aurelle.com"
                      className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enterprise Role
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-medium cursor-pointer"
                  >
                    <option value="BRAND_MANAGER" className="dark:bg-slate-900">VP Brand Governance (Manager)</option>
                    <option value="COMPLIANCE_REVIEWER" className="dark:bg-slate-900">Compliance Reviewer (Legal / Reg)</option>
                    <option value="CREATOR" className="dark:bg-slate-900">Creative Producer (Creator)</option>
                    <option value="ADMIN" className="dark:bg-slate-900">System Administrator (CTO / Security)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Workspace
                  </label>
                  <select
                    value={regWorkspace}
                    onChange={(e) => setRegWorkspace(e.target.value)}
                    className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-medium cursor-pointer"
                  >
                    <option value="aurelle-tech" className="dark:bg-slate-900">Aurelle Technologies (Consumer Tech)</option>
                    <option value="apex-dynamics" className="dark:bg-slate-900">Apex Dynamics (EV Mobility)</option>
                    <option value="novus-health" className="dark:bg-slate-900">Novus Health (BioPharma)</option>
                    <option value="aurelle-maison" className="dark:bg-slate-900">Aurelle Maison (Prestige Luxury)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="Min 8 characters"
                      className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat password"
                      className="w-full bg-slate-50/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-2.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Password Checklist */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className={passwordStrength.length ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}>
                  {passwordStrength.length ? "✓" : "○"} 8+ chars
                </span>
                <span className={passwordStrength.hasNumber ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}>
                  {passwordStrength.hasNumber ? "✓" : "○"} Number
                </span>
                <span className={passwordStrength.hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}>
                  {passwordStrength.hasSpecial ? "✓" : "○"} Symbol
                </span>
              </div>

              <div className="pt-0.5">
                <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-indigo-600 focus:ring-slate-900 cursor-pointer"
                  />
                  <span className="text-[10px] leading-relaxed">
                    I acknowledge server-side RBAC and tenant boundary isolation under ORG-AURELLE.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Register &amp; Enter</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo 1-Click Access Card */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <button
              onClick={handleQuickDemoLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/40 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/60 dark:hover:to-purple-900/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2 text-left">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">1-Click Demo Account</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Alex Mercer · Brand Manager · aurelle-tech</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                Enter &rarr;
              </span>
            </button>

            {/* Secondary RBAC Persona Buttons */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                Switch Test Role:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('compliance@aurelle.com', 'brandtrace2026')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left cursor-pointer transition-colors"
                >
                  <div className="font-semibold text-slate-900 dark:text-white truncate">David S.</div>
                  <div className="text-slate-400 truncate">Compliance</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('creator@aurelle.com', 'brandtrace2026')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left cursor-pointer transition-colors"
                >
                  <div className="font-semibold text-slate-900 dark:text-white truncate">Maya Lin</div>
                  <div className="text-slate-400 truncate">Creator</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('admin@aurelle.com', 'brandtrace2026')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-left cursor-pointer transition-colors"
                >
                  <div className="font-semibold text-slate-900 dark:text-white truncate">Sarah Chen</div>
                  <div className="text-slate-400 truncate">Admin (CTO)</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer inside Left Pane */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Argon2 / SHA-256 Scoped Gateway
          </span>
          <span className="font-mono">Isolated Workspace</span>
        </div>
      </div>

      {/* =================================================================== */}
      {/* RIGHT SIDE — VISUAL DESIGN (Inspired by reference & premium SaaS)   */}
      {/* =================================================================== */}
      <div className="w-full lg:w-1/2 xl:w-7/12 bg-slate-950 text-white relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-[560px] lg:min-h-screen border-t lg:border-t-0 lg:border-l border-slate-800 selection:bg-indigo-600">
        
        {/* Ambient Gradient Glows & Subtle Grid Backdrop */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-3xl" />
          <div 
            className="absolute inset-0 opacity-[0.04]" 
            style={{ 
              backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)', 
              backgroundSize: '24px 24px' 
            }} 
          />
        </div>

        {/* Top Floating Telemetry & Hanging Diamond Line inspired by reference */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-wider text-slate-300 uppercase">
              AUTONOMOUS GOVERNANCE CONTROL PLANE
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Hanging Diamond visual icon from status screen reference */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono text-purple-300">
              <span className="text-purple-400">◆</span>
              <span>LIVE RELEASES MONITORED</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/70 px-2 py-0.5 rounded">
              &lt;800ms GATE
            </span>
          </div>
        </div>

        {/* Centerpiece: Hero Typography & Layered Floating UI Cards */}
        <div className="relative z-10 py-6 sm:py-10 space-y-6 sm:space-y-8 max-w-2xl">
          
          {/* Main Brand Statement */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>INTELLIGENCE BEHIND EVERY BRAND DECISION</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Protect Your Brand. <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                Govern Every Claim.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Connect brand knowledge, detect content risks, simulate changes and verify every approved release across all channels before publishing.
            </p>
          </div>

          {/* Layered Showcase Cards */}
          <div className="space-y-3.5">
            
            {/* Showcase Card 1: 4-Agent Pre-Release Gate */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Multi-Agent Content Gate</span>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> 94.2% GOVERNANCE CLEARANCE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Voice Persona</span>
                  <span className="text-emerald-400 font-bold">98% Aurelle</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Claims Ledger</span>
                  <span className="text-emerald-400 font-bold">FACT-014 CITED</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Regulatory</span>
                  <span className="text-emerald-400 font-bold">FDA §870 OK</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Ethics &amp; Legal</span>
                  <span className="text-emerald-400 font-bold">ZERO VIOLATIONS</span>
                </div>
              </div>
            </div>

            {/* Showcase Card 2: Brand Governance Digital Twin (Simulation) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Predictive Digital Twin Simulation</span>
                </div>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                  PRE-RELEASE BLOCKED
                </span>
              </div>

              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-300 font-semibold">
                    Simulated Mutation: <code className="text-amber-300 font-mono">₹499 &rarr; ₹599</code>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Cascading blast radius flagged 14 connected marketing assets &amp; packaging specs
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-rose-400 uppercase font-mono block">Exposure Prevented</span>
                  <span className="text-xs font-bold text-rose-300 font-mono">$320,000</span>
                </div>
              </div>
            </div>

            {/* Showcase Card 3: Cryptographic Release Seal */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Cryptographic Release Seal</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 rounded">
                      VERIFIED
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    BT-SEAL-8842-AURELLE-PASS · SHA-256 Digest Chained
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-indigo-300 hidden sm:inline">
                Block #1402
              </span>
            </div>

          </div>
        </div>

        {/* Bottom Platform Telemetry */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 font-mono">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>MongoDB Atlas Active · Multi-Tenant Isolation</span>
          </div>
          <span>&copy; {new Date().getFullYear()} BrandTrace AI</span>
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Enterprise Password Reset</h3>
                </div>
                <button
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  BrandTrace AI utilizes enterprise single-tenant cryptographic credentials and role-based access control.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 font-mono text-[11px]">
                  <div><strong>Pre-seeded Demo:</strong> demo@brandtrace.ai</div>
                  <div><strong>Demo Password:</strong> DemoAurelle2026!</div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  For production accounts, please contact your organizational security administrator or email <code className="text-indigo-600 dark:text-indigo-400">security@brandtrace.ai</code>.
                </p>
              </div>

              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Notice
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
