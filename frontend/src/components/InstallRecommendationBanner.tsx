import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

interface InstallRecommendationBannerProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onPromptInstall: () => Promise<boolean>;
  onOpenModal: () => void;
}

const DISMISS_STORAGE_KEY = 'brandtrace_pwa_banner_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const InstallRecommendationBanner: React.FC<InstallRecommendationBannerProps> = ({
  isInstallable,
  isInstalled,
  onPromptInstall,
  onOpenModal
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Never show if already installed
    if (isInstalled) {
      setIsDismissed(true);
      return;
    }

    // Check localStorage dismiss cooldown
    try {
      const dismissedUntilStr = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedUntilStr) {
        const dismissedUntil = parseInt(dismissedUntilStr, 10);
        if (Date.now() < dismissedUntil) {
          setIsDismissed(true);
          return;
        }
      }
    } catch {
      // Fallback if localStorage is disabled
    }

    // Delay initial presentation slightly so user can orient on first visit
    const timer = setTimeout(() => {
      setIsDismissed(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + SEVEN_DAYS_MS));
    } catch {
      // Ignore storage write failure
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await onPromptInstall();
        if (success) {
          setIsDismissed(true);
        }
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Open modal with platform-specific instructions for Safari, Firefox, etc.
      onOpenModal();
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-sm sm:max-w-md w-auto"
        aria-label="Progressive Web App Install Recommendation"
      >
        <div className="bg-neutral-950/95 border border-neutral-800 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-white flex flex-col gap-3 relative">
          {/* Top Bar with Icon, Title, and Dismiss */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white tracking-tight">
                    Install BrandTrace AI
                  </h4>
                  <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    App
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                  Launch in dedicated standalone window with desktop shortcuts.
                </p>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800/60 transition-colors shrink-0"
              aria-label="Dismiss install recommendation for 7 days"
              title="Dismiss for 7 days"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={handleInstallClick}
              disabled={isInstalling}
              icon={<Download className={`w-3.5 h-3.5 ${isInstalling ? 'animate-bounce' : ''}`} />}
              className="flex-1 justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs text-xs py-1.5"
            >
              {isInstalling ? 'Installing...' : isInstallable ? 'Install App' : 'How to Install'}
            </Button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
