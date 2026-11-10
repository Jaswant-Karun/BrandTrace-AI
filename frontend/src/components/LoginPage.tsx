import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles,
  AlertCircle, CheckCircle2, UserCheck, User,
  Eye, EyeOff, Database, KeyRound, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSuccess: () => void;
  onOpenLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onOpenLanding }) => {
  const { login, register } = useAuth();
  
  // Tab state: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-slate-900 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-slate-900 text-sm">BRANDTRACE</span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 px-1 py-0.2 rounded font-mono">
                  AI v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                The Autonomous Brand Intelligence &amp; Governance Control Plane
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3 h-3 text-emerald-600" />
              <span>MongoDB Atlas Active</span>
            </span>

            {onOpenLanding && (
              <button
                onClick={onOpenLanding}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                ← Public Overview
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Auth Section */}
      <main className="flex-1 flex items-center justify-center p-6 max-w-6xl w-full mx-auto my-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-start">
          
          {/* Left Column: Tabbed Sign In / Register Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 shadow-xs space-y-6">
            
            {/* Attractive White Tab Switcher */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                  }}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
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
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                {authMode === 'login' ? 'JWT Authorized Access' : 'Enterprise Provisioning'}
              </span>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block">Authentication Note</span>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success Notification Alert */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Sign in to BrandTrace AI
                  </h1>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Access your brand knowledge graph, multi-agent inspection studio, and cryptographic release ledger.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        placeholder="demo@brandtrace.ai"
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Password
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Demo: DemoAurelle2026!
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        placeholder="••••••••••••"
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                      <span>Keep me signed in on this device</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail('demo@brandtrace.ai');
                        setLoginPassword('DemoAurelle2026!');
                      }}
                      className="text-slate-800 hover:text-black font-medium underline text-[11px] cursor-pointer"
                    >
                      Fill Demo Credentials
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
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
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Create Enterprise Account
                  </h1>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Set up your enterprise profile and connect to an isolated brand governance workspace.
                  </p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          required
                          placeholder="e.g. Julian Vance"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Corporate Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                          placeholder="julian@aurelle.com"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Assigned Enterprise Role
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs font-medium cursor-pointer"
                      >
                        <option value="BRAND_MANAGER">VP Brand Governance (Manager)</option>
                        <option value="COMPLIANCE_REVIEWER">Compliance Reviewer (Legal / Reg)</option>
                        <option value="CREATOR">Creative Producer (Creator)</option>
                        <option value="ADMIN">System Administrator (CTO / Security)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Target Brand Workspace
                      </label>
                      <select
                        value={regWorkspace}
                        onChange={(e) => setRegWorkspace(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs font-medium cursor-pointer"
                      >
                        <option value="aurelle-tech">Aurelle Technologies (Consumer Tech)</option>
                        <option value="apex-dynamics">Apex Dynamics (EV Mobility)</option>
                        <option value="novus-health">Novus Health (BioPharma)</option>
                        <option value="aurelle-maison">Aurelle Maison (Prestige Luxury)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Create Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          placeholder="Min 8 characters"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          required
                          placeholder="Repeat password"
                          className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Checklist */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <span className={passwordStrength.length ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {passwordStrength.length ? "✓" : "○"} 8+ chars
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className={passwordStrength.hasNumber ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {passwordStrength.hasNumber ? "✓" : "○"} Number
                      </span>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <span className={passwordStrength.hasSpecial ? "text-emerald-600 font-bold" : "text-slate-400"}>
                        {passwordStrength.hasSpecial ? "✓" : "○"} Symbol
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Argon2 / SHA-256</span>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                      <span className="text-[11px] leading-relaxed">
                        I acknowledge server-side RBAC, tenant boundary isolation, and cryptographic audit trail logging for all actions under ORG-AURELLE.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-2"
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
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Signed JWT Bearer &amp; Salted Hash Gateway
              </span>
              <span className="font-mono">Tenant Isolation Enforced</span>
            </div>
          </div>

          {/* Right Column: Recommended Evaluation Showcase & Personas (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Primary Demo Card */}
            <div className="bg-white border-2 border-slate-900 rounded-2xl p-6 shadow-xs space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Recommended for Evaluation
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AURELLE Live
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Aurelle Technologies Showcase
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log in directly to explore the signature <strong className="text-slate-900">₹499 → ₹599 price mutation scenario</strong>, 4-agent pre-release checks, and tamper-evident trust verification.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500">Evaluation Email:</span>
                  <strong className="text-slate-900 font-mono">demo@brandtrace.ai</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500">Assigned Persona:</span>
                  <span className="text-slate-900 font-medium">Alex Mercer (VP Governance)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500">Enterprise Workspace:</span>
                  <span className="text-slate-900 font-semibold font-mono">aurelle-tech</span>
                </div>
              </div>

              <button
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Launch AURELLE Demo</span>
              </button>
            </div>

            {/* Other Pre-seeded Enterprise Personas */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  Secondary Test Personas
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Click to test RBAC</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('compliance@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">David Sterling</div>
                    <div className="text-[11px] text-slate-500">Compliance Reviewer · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-semibold">
                    COMPLIANCE
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('creator@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">Maya Lin</div>
                    <div className="text-[11px] text-slate-500">Creative Director · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-semibold">
                    CREATOR
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('admin@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900">Sarah Chen</div>
                    <div className="text-[11px] text-slate-500">System Admin &amp; CTO · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-semibold">
                    ADMIN
                  </span>
                </button>
              </div>
            </div>

            {/* Architecture Highlights Pill */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
              <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                Architecture Highlights
              </span>
              <ul className="space-y-1 text-slate-600 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>4-Agent Autonomous Governance Pipeline (&lt;800ms)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Predictive Digital Twin ($320k commercial exposure calc)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>SHA-256 Release Proofs with Merkle Block-Chaining</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500 max-w-7xl w-full mx-auto">
        <p>
          Every brand decision connected. Every risk traceable. Every release accountable. &copy; {new Date().getFullYear()} BrandTrace AI Control Plane.
        </p>
      </footer>
    </div>
  );
};
