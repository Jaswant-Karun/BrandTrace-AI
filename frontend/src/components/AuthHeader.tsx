import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, UserCheck, ChevronDown, 
  Database, Sparkles
} from 'lucide-react';

interface AuthHeaderProps {
  onOpenDbStatus: () => void;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ onOpenDbStatus }) => {
  const { user, currentOrg, currentWorkspace, switchPersona, personas, setWorkspace } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">ADMIN</span>;
      case 'COMPLIANCE_REVIEWER':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">COMPLIANCE REVIEWER</span>;
      case 'BRAND_MANAGER':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-bold">BRAND MANAGER</span>;
      case 'CREATOR':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">CREATOR</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">{role || 'REVIEWER'}</span>;
    }
  };

  return (
    <div className="bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-40 sticky top-0">
      {/* Left: Organization & Workspace Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
          <Building className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">{currentOrg}</span>
          <span className="text-slate-600">|</span>
          <select
            value={currentWorkspace}
            onChange={(e) => setWorkspace(e.target.value)}
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="apex-dynamics" className="bg-slate-950 text-white">Apex Dynamics (EV Mobility)</option>
            <option value="novus-health" className="bg-slate-950 text-white">Novus Health (BioPharma)</option>
            <option value="aurelle-maison" className="bg-slate-950 text-white">Aurelle Maison (Eco-Luxury)</option>
          </select>
        </div>

        {/* MongoDB Atlas Indicator */}
        <button
          onClick={onOpenDbStatus}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Database className="w-3 h-3" />
          <span>MongoDB Atlas Vector Search Active</span>
        </button>
      </div>

      {/* Right: Authenticated User & Persona Switcher */}
      <div className="flex items-center gap-3 relative">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
            <span>{user?.name}</span>
            {getRoleBadge(user?.role)}
          </div>
          <div className="text-[10px] font-mono text-slate-400">{user?.email}</div>
        </div>

        {/* Persona Switcher Dropdown Button */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Switch Persona</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-11 w-72 bg-[#0B0F19] border border-slate-800 rounded-2xl shadow-2xl p-2 space-y-1 z-50 animate-fadeIn">
            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
              <span>Enterprise RBAC Personas</span>
              <Sparkles className="w-3 h-3 text-cyan-400" />
            </div>

            {personas.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  switchPersona(p);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                  user?.email === p.email
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-white'
                    : 'hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-[10px] font-mono text-slate-400">{p.email}</div>
                </div>
                <div>
                  {getRoleBadge(p.role)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
