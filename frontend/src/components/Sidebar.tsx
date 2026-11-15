import React from 'react';
import {
  ShieldCheck, LayoutDashboard, GitFork, Sparkles, Flame,
  Eye, FileText, AlertTriangle, CheckSquare, BookOpen,
  BarChart3, Lock, Settings, ChevronLeft, ChevronRight, X
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
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
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
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const NAV_SECTIONS: { title: string; items: { id: NavigationTab; label: string; icon: React.ReactNode }[] }[] = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'command-center', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'knowledge-base', label: 'Brand Knowledge', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'bdig', label: 'Knowledge Graph', icon: <GitFork className="w-4 h-4" /> },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'content-studio', label: 'Content Intelligence', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'multimodal', label: 'Multimodal Inspection', icon: <Eye className="w-4 h-4" /> },
        { id: 'campaigns', label: 'Campaign Intelligence', icon: <FileText className="w-4 h-4" /> },
        { id: 'risks', label: 'Risk Intelligence', icon: <AlertTriangle className="w-4 h-4" /> },
      ]
    },
    {
      title: 'GOVERNANCE',
      items: [
        { id: 'impact-simulator', label: 'Change Impact Simulator', icon: <Flame className="w-4 h-4" /> },
        { id: 'approvals', label: 'Approval Center', icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'audit-trust', label: 'Trust & Audit Ledger', icon: <Lock className="w-4 h-4" /> },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      ]
    }
  ];

  const currentBrand = brands.find((b) => b.brand_id === selectedBrandId);

  const handleItemClick = (id: NavigationTab) => {
    setCurrentTab(id);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen?.(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        className={`border-r border-slate-200 bg-white flex flex-col justify-between transition-all duration-200 z-50 select-none ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 w-64 shadow-2xl translate-x-0'
            : 'hidden md:flex md:static'
        } ${isCollapsed ? 'md:w-18' : 'md:w-64'}`}
      >
        {/* Top Header & Brand Switcher */}
        <div>
          <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between">
            <button
              onClick={() => {
                onOpenLanding();
                if (setIsMobileOpen) setIsMobileOpen(false);
              }}
              className="flex items-center gap-2.5 text-left hover:opacity-85 transition-opacity"
              title="Return to Public Overview"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold tracking-tight text-slate-900 text-sm">BRANDTRACE</span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-1 py-0.2 rounded font-mono">
                      AI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate leading-none mt-0.5">Control Plane</p>
                </div>
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileOpen?.(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors md:hidden"
              title="Close Navigation"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Desktop Collapse / Expand Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden md:block"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Workspace Selector */}
          {(!isCollapsed || isMobileOpen) && (
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Active Workspace
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
              >
                {brands.length > 0 ? (
                  brands.map((b) => (
                    <option key={b.brand_id} value={b.brand_id}>
                      {b.brand_name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="aurelle-tech">Aurelle Technologies Inc.</option>
                    <option value="apex-dynamics">Apex Dynamics</option>
                    <option value="novus-health">Novus Health Solutions</option>
                  </>
                )}
              </select>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {currentBrand?.industry || 'Clean Mobility & Tech'}
              </div>
            </div>
          )}

          {/* Grouped Navigation List */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-190px)]">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                {(!isCollapsed || isMobileOpen) && (
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </div>
                )}
                {section.items.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      title={isCollapsed && !isMobileOpen ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white font-medium shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-normal'
                      } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                    >
                      <span className={isActive ? 'text-white' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      {(!isCollapsed || isMobileOpen) && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Telemetry Status */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <div
            className={`flex items-center gap-2 text-xs ${
              isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus?.connected ? 'bg-emerald-500 ring-4 ring-emerald-50' : 'bg-amber-500'
                }`}
              />
              {(!isCollapsed || isMobileOpen) && (
                <span className="text-[11px] font-medium text-slate-600 truncate">
                  {dbStatus?.connected ? 'Atlas Connected' : 'Memory Mode'}
                </span>
              )}
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-[10px] font-mono text-slate-400">v2.0</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
