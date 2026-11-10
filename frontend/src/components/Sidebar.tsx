import React from 'react';
import {
  ShieldCheck, LayoutDashboard, GitFork, Sparkles, Flame,
  Eye, FileText, AlertTriangle, CheckSquare, BookOpen,
  BarChart3, Lock, Settings, ChevronLeft, ChevronRight,
  Database
} from 'lucide-react';
import { BrandProfile, DatabaseStatus } from '../types';

export type NavigationTab =
  | 'command-center'
  | 'bdig'
  | 'content-studio'
  | 'impact-simulator'
  | 'multimodal'
  | 'campaigns'
  | 'risks'
  | 'approvals'
  | 'knowledge-base'
  | 'analytics'
  | 'audit-trust'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  brands: BrandProfile[];
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  dbStatus: DatabaseStatus | null;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenLanding: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  brands,
  selectedBrandId,
  setSelectedBrandId,
  dbStatus,
  isCollapsed,
  setIsCollapsed,
  onOpenLanding,
}) => {
  const NAV_ITEMS: { id: NavigationTab; label: string; icon: React.ReactNode; group: string }[] = [
    // Core Control Plane
    { id: 'command-center', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" />, group: 'Core' },
    { id: 'bdig', label: 'Brand Intelligence Graph', icon: <GitFork className="w-4 h-4" />, group: 'Core' },
    { id: 'content-studio', label: 'Content Studio', icon: <Sparkles className="w-4 h-4" />, group: 'Core' },
    { id: 'impact-simulator', label: 'Change Impact Simulator', icon: <Flame className="w-4 h-4" />, group: 'Core' },
    { id: 'multimodal', label: 'Multimodal Inspection', icon: <Eye className="w-4 h-4" />, group: 'Core' },

    // Strategy & Governance
    { id: 'campaigns', label: 'Campaign Intelligence', icon: <FileText className="w-4 h-4" />, group: 'Intelligence' },
    { id: 'risks', label: 'Risk Intelligence', icon: <AlertTriangle className="w-4 h-4" />, group: 'Intelligence' },
    { id: 'approvals', label: 'Approval Center', icon: <CheckSquare className="w-4 h-4" />, group: 'Intelligence' },
    { id: 'knowledge-base', label: 'Brand Knowledge Base', icon: <BookOpen className="w-4 h-4" />, group: 'Intelligence' },

    // Trust & Telemetry
    { id: 'analytics', label: 'Governance Analytics', icon: <BarChart3 className="w-4 h-4" />, group: 'Assurance' },
    { id: 'audit-trust', label: 'Audit & Trust Center', icon: <Lock className="w-4 h-4" />, group: 'Assurance' },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, group: 'Assurance' },
  ];

  const currentBrand = brands.find((b) => b.brand_id === selectedBrandId);

  return (
    <aside
      className={`border-r border-slate-800/80 bg-[#0B0F19] flex flex-col justify-between transition-all duration-300 z-40 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Brand Switcher */}
      <div>
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <button
            onClick={onOpenLanding}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
            title="Return to Public Overview"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white text-sm">BRANDTRACE</span>
                  <span className="text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1 py-0.2 rounded">
                    SaaS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Governance Control Plane</p>
              </div>
            )}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Brand Selector Badge */}
        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active Enterprise Profile
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full bg-[#070B14] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b.brand_id} value={b.brand_id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 block mt-1 truncate">
              {currentBrand?.industry || 'Clean Mobility & Tech'}
            </span>
          </div>
        )}

        {/* Navigation List */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
          {NAV_ITEMS.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/30 shadow-md shadow-blue-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry Status */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div
          className={`flex items-center gap-2 text-xs font-mono ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Database className={`w-3.5 h-3.5 ${dbStatus?.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
            {!isCollapsed && (
              <span className="text-[11px] text-slate-400 truncate">
                {dbStatus?.connected ? 'MongoDB Live' : 'Memory Store'}
              </span>
            )}
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
        </div>
      </div>
    </aside>
  );
};
