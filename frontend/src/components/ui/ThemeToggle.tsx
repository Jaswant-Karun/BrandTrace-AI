import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'pill';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', variant = 'navbar' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border cursor-pointer select-none ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800 hover:border-slate-600 shadow-2xs'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
        } ${className}`}
      >
        <motion.div
          key={theme}
          initial={{ rotate: -45, opacity: 0, scale: 0.8 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400 stroke-[2.2]" /> : <Moon className="w-3.5 h-3.5 text-slate-600 stroke-[2.2]" />}
        </motion.div>
        <span className="hidden sm:inline font-sans text-[11px] font-semibold">
          {isDark ? 'Light' : 'Dark'}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500/40 select-none ${
        isDark
          ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-amber-400 hover:text-amber-300 shadow-inner'
          : 'bg-white/90 hover:bg-slate-100/90 border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
      } ${className}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: isDark ? 90 : -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: isDark ? -90 : 90, opacity: 0, scale: 0.6 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 stroke-[2.2]" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 stroke-[2.2]" />
        )}
      </motion.div>
    </button>
  );
};
