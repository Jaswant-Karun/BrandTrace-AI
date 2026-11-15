import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, UserCheck, ChevronDown, 
  Database, Sparkles, LogOut, Compass,
  Menu, Download, CheckCircle2
} from 'lucide-react';

interface AuthHeaderProps {
  onOpenDbStatus: () => void;
  onOpenDemoWalkthrough?: () => void;
  onStartTour?: () => void;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
  onOpenInstallModal?: () => void;
  isInstallable?: boolean;
  isInstalled?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  onOpenDbStatus,
  onOpenDemoWalkthrough,
  onStartTour,
  onLogout,
  onToggleMobileMenu,
  onOpenInstallModal,
  isInstallable = false,
  isInstalled = false
}) => {
  const { user, currentOrg, currentWorkspace, switchPersona, personas, setWorkspace, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-semibold">ADMIN</span>;
      case 'COMPLIANCE_REVIEWER':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">COMPLIANCE REVIEWER</span>;
      case 'BRAND_MANAGER':
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">BRAND MANAGER</span>;
      case 'CREATOR':
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">CREATOR</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">{role || 'REVIEWER'}</span>;
    }
  };

  const handleSignOut = () => {
    logout();
    if (onLogout) onLogout();
  };

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-30 sticky top-0">
      {/* Left: Mobile Menu + Organization & Workspace Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
        {/* Mobile Hamburger Menu Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors md:hidden cursor-pointer shadow-2xs"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 sm:px-2.5 py-1">
          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{currentOrg}</span>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <select
            value={currentWorkspace}
            onChange={(e) => setWorkspace(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-none cursor-pointer max-w-[120px] xs:max-w-[150px] sm:max-w-none truncate"
          >
            <option value="aurelle-tech">Aurelle Technologies (Consumer Tech)</option>
            <option value="apex-dynamics">Apex Dynamics (EV Mobility)</option>
            <option value="novus-health">Novus Health (BioPharma)</option>
            <option value="aurelle-maison">Aurelle Maison (Eco-Luxury)</option>
          </select>
        </div>

        {/* MongoDB Atlas Indicator */}
        <button
          onClick={onOpenDbStatus}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium hover:bg-emerald-100/60 transition-colors cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3 h-3 text-emerald-600" />
          <span>MongoDB Atlas Active</span>
        </button>

        {/* Interactive Guided Tour Trigger */}
        {onStartTour && (
          <button
            onClick={onStartTour}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title="Start Interactive Quick Tour of Modules"
          >
            <Compass className="w-3.5 h-3.5 text-slate-600" />
            <span>Quick Tour</span>
          </button>
        )}

        {/* Guided Demo Pill */}
        {onOpenDemoWalkthrough && (
          <button
            onClick={onOpenDemoWalkthrough}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            title="Open Interactive AURELLE Walkthrough & 9 Test Cases"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">AURELLE Scenario</span>
            <span className="sm:hidden">Scenario</span>
          </button>
        )}

        {/* Unobtrusive PWA Install Option */}
        {onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border shadow-2xs ${
              isInstalled
                ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                : isInstallable
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Install BrandTrace AI as standalone desktop application"
          >
            {isInstalled ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span className="hidden sm:inline">{isInstalled ? 'App Active' : 'Install App'}</span>
          </button>
        )}
      </div>

      {/* Right: Authenticated User & Persona Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-semibold text-slate-900 flex items-center justify-end gap-1.5">
            <span>{user?.name || 'Enterprise Persona'}</span>
            {getRoleBadge(user?.role)}
          </div>
          <div className="text-[11px] font-mono text-slate-500">{user?.email || 'demo@brandtrace.ai'}</div>
        </div>

        {/* Persona Switcher Dropdown Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer shadow-2xs"
        >
          <UserCheck className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden md:inline">Personas</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-11 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-2 space-y-2 z-50">
            <div className="px-2 py-1 text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between border-b border-slate-100 pb-2">
              <span>Switch RBAC Persona</span>
              <span className="text-[10px] font-mono text-slate-400">JWT Scoped</span>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {personas.map((p) => (
                <button
                  key={p.email}
                  onClick={() => {
                    switchPersona(p);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex flex-col cursor-pointer ${
                    user?.email === p.email
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-slate-900 truncate">{p.name}</span>
                    {getRoleBadge(p.role)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">{p.email}</span>
                </button>
              ))}
            </div>

            {/* Sign Out Option */}
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  handleSignOut();
                }}
                className="w-full px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Control Plane</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
