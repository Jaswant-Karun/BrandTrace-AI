import React from 'react';
import { motion } from 'framer-motion';

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
  const tabs: TabItem[] = customTabs || [
    { id: 'check', label: 'CHECK A POST' },
    { id: 'audit', label: 'AUDIT LOG' },
    { id: 'rulebook', label: 'RULEBOOK' },
    { id: 'facts', label: 'FACTS' },
    { id: 'health', label: 'GUIDELINE HEALTH' },
    { id: 'watch', label: 'CLAIM WATCH' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b border-neutral-800/80 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 relative">
        
        {/* Left: Brand Identity / Plumbline Logo */}
        <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => onTabChange('check')}>
          <div className="w-5 h-5 flex items-center justify-center text-indigo-400">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <line x1="6" y1="3" x2="18" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="3" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" />
              <polygon points="12,12 16,16 12,21 8,16" fill="#818cf8" stroke="currentColor" strokeWidth="1" />
            </svg>
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-wider text-white font-mono">
            BRANDTRACE
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 lg:gap-4 overflow-x-auto h-full">
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

        {/* Right: Authenticated Creator Indicator & Sign Out */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 relative">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[11px] font-mono text-neutral-400">
              SIGNED IN AS <strong className="text-neutral-200 uppercase">{userName}</strong>
            </span>
            <span className="text-[9px] font-mono text-indigo-400 uppercase font-semibold">
              {roleName}
            </span>
          </div>

          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900/80 hover:bg-neutral-800 text-xs font-mono font-bold text-neutral-200 uppercase tracking-wider transition-colors cursor-pointer"
            title="Return to Landing Page or Sign Out"
          >
            SIGN OUT
          </button>

          {/* Hanging Plumb Bob Visual Ornament (matching user reference) */}
          <div className="hidden sm:flex flex-col items-center absolute -bottom-16 right-28 pointer-events-none z-40">
            <div className="w-[1px] h-14 border-l border-dashed border-indigo-400/50" />
            <motion.div
              animate={{ rotate: [-2, 2, -2] }}
              transition={{ duration: 4.0, repeat: Infinity, ease: 'easeInOut' }}
              className="w-3.5 h-3.5 bg-gradient-to-br from-indigo-400 to-indigo-600 rotate-45 shadow-[0_0_12px_rgba(99,102,241,0.9)]"
            />
          </div>
        </div>

      </div>

      {/* Mobile Tab Scrollbar */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto py-2 border-t border-neutral-800/60 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold tracking-wider whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'text-neutral-400 hover:text-white bg-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
