import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, ChevronRight, User } from 'lucide-react';

export type CreatorTab = 'check' | 'submissions' | 'queue' | 'audit' | 'rulebook' | 'facts' | 'health' | 'watch' | 'verify';

export interface TabItem {
  id: CreatorTab;
  label: string;
}

interface CreatorHeaderProps {
  activeTab: CreatorTab;
  onTabChange: (tab: CreatorTab) => void;
  onSignOut: () => void;
  userName?: string;
  roleName?: string;
  customTabs?: TabItem[];
}

export const CreatorHeader: React.FC<CreatorHeaderProps> = ({
  activeTab,
  onTabChange,
  onSignOut,
  userName = 'CREATOR ASHA',
  roleName = 'CREATOR',
  customTabs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: TabItem[] = customTabs || [
    { id: 'check', label: 'CHECK A POST' },
    { id: 'audit', label: 'AUDIT LOG' },
    { id: 'rulebook', label: 'RULEBOOK' },
    { id: 'facts', label: 'FACTS' },
    { id: 'health', label: 'GUIDELINE HEALTH' },
    { id: 'watch', label: 'CLAIM WATCH' },
  ];

  const handleSelectMobileTab = (tabId: CreatorTab) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  // Role accent color indicator
  const getRoleBadgeClasses = (role: string) => {
    const r = role.toUpperCase();
    if (r.includes('AGENCY')) {
      return 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300';
    }
    if (r.includes('REVIEW')) {
      return 'bg-amber-950/80 border-amber-500/50 text-amber-300';
    }
    if (r.includes('COMPLIANCE')) {
      return 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300';
    }
    if (r.includes('OWNER')) {
      return 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300';
    }
    return 'bg-purple-950/80 border-purple-500/50 text-purple-300';
  };

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-800/80 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 relative">
        
        {/* Left: Brand Identity / Plumbline Logo & Mobile Role Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => onTabChange(tabs[0]?.id || 'check')}
          >
            <div className="w-5 h-5 flex items-center justify-center text-indigo-400">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                <line x1="6" y1="3" x2="18" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="3" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
                <polygon points="12,12 16,16 12,21 8,16" fill="#818cf8" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-wider text-white font-mono select-none">
              BRANDTRACE
            </span>
          </div>

          {/* Current Role Badge: Always visible on mobile, tablet & desktop */}
          <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${getRoleBadgeClasses(roleName)}`}>
            {roleName}
          </span>
        </div>

        {/* Center: Desktop Navigation Tabs (Visible on lg screens) */}
        <nav className="hidden lg:flex items-center gap-1 lg:gap-2 xl:gap-3 overflow-x-auto h-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-2.5 py-4 text-xs font-mono font-semibold tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeCreatorTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: User Info & Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative">
          
          {/* Desktop User Info */}
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[11px] font-mono text-neutral-400">
              SIGNED IN AS <strong className="text-neutral-200 uppercase">{userName}</strong>
            </span>
            <span className="text-[9px] font-mono text-indigo-400 uppercase font-semibold">
              {roleName}
            </span>
          </div>

          {/* Desktop Sign Out Button */}
          <button
            onClick={onSignOut}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider transition-colors cursor-pointer"
            title="Return to Landing Page or Sign Out"
          >
            <span>SIGN OUT</span>
          </button>

          {/* Mobile Hamburger / Close Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg border border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-neutral-200" />
            )}
          </button>

          {/* Hanging Plumb Bob Visual Ornament (Hidden on mobile & tablet) */}
          <div className="hidden xl:flex flex-col items-center absolute -bottom-16 right-28 pointer-events-none z-40">
            <div className="w-[1px] h-14 border-l border-dashed border-indigo-400/50" />
            <motion.div
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut' }}
              className="w-3.5 h-3.5 bg-gradient-to-br from-indigo-400 to-indigo-600 rotate-45 shadow-[0_0_12px_rgba(99,102,241,0.9)]"
            />
          </div>
        </div>

      </div>

      {/* Mobile / Tablet Horizontal Tab Swipe Strip (Below header for 1-tap switching) */}
      <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto py-2 border-t border-neutral-800/60 no-scrollbar -mx-3 px-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold tracking-wider whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                  : 'bg-neutral-950/80 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Professional Mobile Navigation Drawer (Dropdown Overlay) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="lg:hidden border-t border-neutral-800 bg-neutral-950/98 backdrop-blur-xl px-4 py-4 space-y-4 shadow-2xl overflow-hidden"
          >
            {/* Authenticated User Status Card */}
            <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-mono font-bold text-white uppercase">
                    {userName}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400">
                    Role: <span className="text-indigo-400 font-bold">{roleName}</span>
                  </div>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${getRoleBadgeClasses(roleName)}`}>
                ACTIVE
              </span>
            </div>

            {/* Navigation Tabs List with Large Touch Targets */}
            <div className="space-y-1">
              <div className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-widest px-1 pb-1">
                NAVIGATION MODULES
              </div>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectMobileTab(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-indigo-600/90 border-indigo-500 text-white shadow-md'
                        : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                      )}
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile Drawer Sign Out Button */}
            <div className="pt-2 border-t border-neutral-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:bg-rose-950/60 hover:border-rose-600/70 text-xs font-mono font-bold text-rose-300 uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>SIGN OUT / SWITCH ROLE</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
};
