import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles,
  AlertCircle, CheckCircle2, UserCheck, User,
  Eye, EyeOff, Database, KeyRound, Check, Copy
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

  // Copy feedback state
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const copyCredential = (text: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
      setSuccessMessage('Account created successfully! Redirecting to workspace...');
      setTimeout(() => {
        onSuccess();
      }, 700);
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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-slate-900 selection:text-white dark:selection:bg-indigo-600 dark:selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-900 dark:text-white text-sm">BRANDTRACE</span>
                <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-1 py-0.2 rounded font-mono">
                  AI v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                The Autonomous Brand Intelligence &amp; Governance Control Plane
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>MongoDB Atlas Active</span>
            </span>

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {onOpenLanding && (
              <button
                onClick={onOpenLanding}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
              >
                ← Public Overview
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Auth Section */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 max-w-6xl w-full mx-auto my-3 sm:my-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full items-start">
          
          {/* Left Column: Tabbed Sign In / Register Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-7 md:p-8 shadow-xs space-y-5 sm:space-y-6 transition-colors duration-200">
            
            {/* Tab Switcher */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
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
                  className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                {authMode === 'login' ? 'JWT Authorized Access' : 'Enterprise Provisioning'}
              </span>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">Authentication Note</span>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success Notification Alert */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">Success</span>
                  <p>{successMessage}</p>
                </div>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {authMode === 'login' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Sign in to BrandTrace AI
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Access your brand knowledge graph, multi-agent inspection studio, and cryptographic release ledger.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        placeholder="demo@brandtrace.ai"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-indigo-500 transition-all shadow-2xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Demo: DemoAurelle2026!
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-indigo-500 transition-all shadow-2xs font-mono"
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

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-indigo-600 focus:ring-slate-900 cursor-pointer"
                      />
                      <span>Keep me signed in on this device</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('demo@brandtrace.ai');
                        setLoginPassword('DemoAurelle2026!');
                      }}
                      className="text-slate-800 dark:text-indigo-400 hover:text-black dark:hover:text-indigo-300 font-medium underline text-[11px] cursor-pointer text-left sm:text-right"
                    >
                      Fill Demo Credentials
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Control Plane</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: REGISTER ACCOUNT FORM */}
            {authMode === 'register' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Create Enterprise Account
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Set up your enterprise profile and connect to an isolated brand governance workspace.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          required
                          placeholder="e.g. Julian Vance"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-indigo-500 transition-all shadow-2xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Corporate Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                          placeholder="julian@aurelle.com"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-indigo-500 transition-all shadow-2xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Assigned Enterprise Role
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-medium cursor-pointer"
                      >
                        <option value="BRAND_MANAGER" className="dark:bg-slate-900 dark:text-white">VP Brand Governance (Manager)</option>
                        <option value="COMPLIANCE_REVIEWER" className="dark:bg-slate-900 dark:text-white">Compliance Reviewer (Legal / Reg)</option>
                        <option value="CREATOR" className="dark:bg-slate-900 dark:text-white">Creative Producer (Creator)</option>
                        <option value="ADMIN" className="dark:bg-slate-900 dark:text-white">System Administrator (CTO / Security)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Target Brand Workspace
                      </label>
                      <select
                        value={regWorkspace}
                        onChange={(e) => setRegWorkspace(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 shadow-2xs font-medium cursor-pointer"
                      >
                        <option value="aurelle-tech" className="dark:bg-slate-900 dark:text-white">Aurelle Technologies (Consumer Tech)</option>
                        <option value="apex-dynamics" className="dark:bg-slate-900 dark:text-white">Apex Dynamics (EV Mobility)</option>
                        <option value="novus-health" className="dark:bg-slate-900 dark:text-white">Novus Health (BioPharma)</option>
                        <option value="aurelle-maison" className="dark:bg-slate-900 dark:text-white">Aurelle Maison (Prestige Luxury)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Create Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          placeholder="Min 8 characters"
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-indigo-500 transition-all shadow-2xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-indigo-500 focus:ring-1 focus:ring-slate-900 dark:focus:ring-indigo-500 transition-all shadow-2xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Checklist */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <span className={passwordStrength.length ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}>
                        {passwordStrength.length ? "✓" : "○"} 8+ chars
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className={passwordStrength.hasNumber ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}>
                        {passwordStrength.hasNumber ? "✓" : "○"} Number
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className={passwordStrength.hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}>
                        {passwordStrength.hasSpecial ? "✓" : "○"} Symbol
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Argon2 / SHA-256</span>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-slate-900 dark:text-indigo-600 focus:ring-slate-900 cursor-pointer"
                      />
                      <span className="text-[11px] leading-relaxed">
                        I acknowledge server-side RBAC, tenant boundary isolation, and cryptographic audit trail logging for all actions under ORG-AURELLE.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Register &amp; Enter Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Bottom Security Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Signed JWT Bearer &amp; Salted Hash Gateway
              </span>
              <span className="font-mono">Tenant Isolation Enforced</span>
            </div>
          </div>

          {/* Right Column: Recommended Evaluation Showcase & Personas (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Primary Demo Card: Public Evaluation Experience */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-indigo-500 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4 relative overflow-hidden transition-colors duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 dark:bg-indigo-600 text-white px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Public Demonstration
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AURELLE Live
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Explore the BrandTrace AI Demo
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Log in with the dedicated restricted demonstration account to test the autonomous multi-agent gate, digital twin simulations, and cryptographic audit proofs.
                </p>
              </div>

              {/* Synthetic Data Note */}
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg flex items-center gap-2 text-[11px] text-amber-900 dark:text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Synthetic Demonstration Data:</strong> Isolated <code className="font-mono text-amber-950 dark:text-amber-200 font-bold">aurelle-tech</code> workspace. No production data modified.
                </span>
              </div>

              {/* Credential Box with Safe Copy-to-Clipboard Controls */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Demo Email:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 dark:text-white font-mono">demo@brandtrace.ai</strong>
                    <button
                      type="button"
                      onClick={() => copyCredential('demo@brandtrace.ai', 'email')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Copy email to clipboard"
                    >
                      {copiedField === 'email' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Demo Password:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 dark:text-white font-mono">DemoAurelle2026!</strong>
                    <button
                      type="button"
                      onClick={() => copyCredential('DemoAurelle2026!', 'password')}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                      title="Copy password to clipboard"
                    >
                      {copiedField === 'password' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400">Demo Role:</span>
                  <span className="text-slate-900 dark:text-white font-medium">Alex Mercer (Brand Manager · aurelle-tech)</span>
                </div>
              </div>

              {/* What You Can Test */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                  What You Can Test:
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Autonomous 4-agent pre-release compliance gate (&lt;800ms)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Explainable claim substantiation with direct policy citations</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Predictive digital twin (₹499 ➔ ₹599 price mutation &amp; $320k exposure)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>Cryptographic SHA-256 release proofs with Merkle block audit ledger</span>
                  </li>
                </ul>
              </div>

              {/* Clearly Labelled Action: Executes Normal Authentication */}
              <button
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Use Demo Account (Authenticate via JWT)</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-mono">
                Executes standard POST /api/auth/login · Zero route bypass
              </p>
            </div>

            {/* Other Pre-seeded Enterprise Personas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 transition-colors duration-200">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  Secondary Test Personas
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Click to test RBAC</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('compliance@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">David Sterling</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Compliance Reviewer · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
                    COMPLIANCE
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('creator@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Maya Lin</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Creative Director · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                    CREATOR
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('admin@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">Sarah Chen</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">System Admin &amp; CTO · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-slate-900 dark:bg-indigo-600 text-white px-2 py-0.5 rounded font-mono font-semibold">
                    ADMIN
                  </span>
                </button>
              </div>
            </div>

            {/* Architecture Highlights Pill */}
            <div className="p-4 bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-2 transition-colors duration-200">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                Architecture Highlights
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>4-Agent Autonomous Governance Pipeline (&lt;800ms)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Predictive Digital Twin ($320k commercial exposure calc)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>SHA-256 Release Proofs with Merkle Block-Chaining</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 text-center text-xs text-slate-500 dark:text-slate-400 max-w-7xl w-full mx-auto transition-colors duration-200">
        <p>
          Every brand decision connected. Every risk traceable. Every release accountable. &copy; {new Date().getFullYear()} BrandTrace AI Control Plane.
        </p>
      </footer>
    </div>
  );
};
