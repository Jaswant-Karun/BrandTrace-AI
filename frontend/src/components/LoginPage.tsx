import React, { useState } from 'react';
import {
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles,
  AlertCircle, CheckCircle2, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSuccess: () => void;
  onOpenLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onOpenLanding }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('demo@brandtrace.ai');
  const [password, setPassword] = useState<string>('DemoAurelle2026!');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(
        err.detail || err.message || 'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('demo@brandtrace.ai');
    setPassword('DemoAurelle2026!');
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
    setEmail(presetEmail);
    setPassword(presetPassword);
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
      {/* Top Simple Brand Header */}
      <header className="border-b border-slate-200 px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 text-sm">BRANDTRACE</span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1 py-0.2 rounded">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Autonomous Control Plane</p>
          </div>
        </div>

        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer"
          >
            ← Back to Public Overview
          </button>
        )}
      </header>

      {/* Main Authentication Grid */}
      <main className="flex-1 flex items-center justify-center p-6 max-w-5xl w-full mx-auto my-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-start">
          
          {/* Left Column: Sign-in Form */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6">
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                Enterprise Authentication
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight pt-1">
                Sign in to Control Plane
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your authorized credentials to access your brand workspace, knowledge graph, and release ledger.
              </p>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold">Authentication Failed</span>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="demo@brandtrace.ai"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Demo: DemoAurelle2026!
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-2xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Brand Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                JWT Auth &amp; Argon2/SHA-256 Validated
              </span>
              <span>Tenant Isolation Enforced</span>
            </div>
          </div>

          {/* Right Column: One-Click Demo Mode & Pre-configured Personas */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Primary Demo Card */}
            <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                  Recommended for Evaluation
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  AURELLE Hackathon Demo
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Log in directly with the pre-seeded <strong className="text-slate-900">Aurelle Technologies</strong> consumer electronics workspace to test the ₹499 → ₹599 price mutation scenario.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Demo User:</span>
                  <strong className="text-slate-900 font-mono">demo@brandtrace.ai</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Persona:</span>
                  <span className="text-slate-900 font-medium">Alex Mercer (VP Governance)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Workspace:</span>
                  <span className="text-slate-900 font-medium">aurelle-tech</span>
                </div>
              </div>

              <button
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch AURELLE Demo Workspace</span>
              </button>
            </div>

            {/* Other Presets */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                  Secondary Test Personas
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Click to test</span>
              </div>

              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('compliance@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-slate-900">David Sterling</div>
                    <div className="text-[11px] text-slate-500">Compliance Reviewer · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                    COMPLIANCE
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('creator@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-slate-900">Maya Lin</div>
                    <div className="text-[11px] text-slate-500">Creative Director · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                    CREATOR
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset('admin@aurelle.com', 'brandtrace2026')}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-slate-900">Sarah Chen</div>
                    <div className="text-[11px] text-slate-500">System Admin &amp; CTO · Aurelle</div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                    ADMIN
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500 max-w-7xl w-full mx-auto">
        <p>
          Every brand decision connected. Every risk traceable. Every release accountable. &copy; {new Date().getFullYear()} BrandTrace AI.
        </p>
      </footer>
    </div>
  );
};
