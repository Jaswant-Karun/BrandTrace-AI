import React, { useState } from 'react';
import {
  Download, Monitor, ShieldCheck, CheckCircle2,
  Globe, Sparkles, Check, Smartphone, Laptop, HelpCircle
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onPromptInstall: () => Promise<boolean>;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onPromptInstall
}) => {
  const [installing, setInstalling] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<'desktop' | 'ios' | 'android'>('desktop');

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await onPromptInstall();
      if (success) {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Install BrandTrace AI Application"
      maxWidth="md"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono text-center sm:text-left">
            {isInstalled ? 'Mode: Standalone Installed' : isInstallable ? 'Ready: Direct Install Supported' : 'Mode: Browser Navigation'}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            <Button variant="secondary" size="sm" onClick={onClose} className="flex-1 sm:flex-none justify-center">
              Dismiss
            </Button>
            {isInstallable && !isInstalled && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                disabled={installing}
                icon={<Download className={`w-3.5 h-3.5 ${installing ? 'animate-bounce' : ''}`} />}
                className="flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
              >
                {installing ? 'Installing...' : 'Install Now'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-slate-700 dark:text-neutral-300">
        {/* Banner Graphic */}
        <div className="p-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950 border border-neutral-800 text-white rounded-xl flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500 text-white px-1.5 py-0.5 rounded font-mono">
                PWA Standalone
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">Windows · macOS · iOS · Android</span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              BrandTrace AI Control Plane
            </h3>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-neutral-100">
              <Monitor className="w-3.5 h-3.5 text-indigo-500" />
              <span>Standalone Window</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
              Launch in dedicated window without address bar or tab clutter for distraction-free enterprise governance.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/60 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-neutral-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Taskbar &amp; Dock Launch</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-snug">
              Pin BrandTrace AI directly to Windows Taskbar, macOS Dock, or mobile home screen with instant access.
            </p>
          </div>
        </div>

        {/* Dynamic Installation Guide */}
        {isInstalled ? (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2.5 text-emerald-900 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold block text-xs">Application Already Installed</span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-400/90">
                You are currently running BrandTrace AI in standalone application mode.
              </p>
            </div>
          </div>
        ) : isInstallable ? (
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>1-Click Browser Installation Available</span>
            </div>
            <p className="text-[11px] text-indigo-800 dark:text-indigo-300 leading-relaxed">
              Your browser has unlocked the native installation engine. Click the <strong>"Install Now"</strong> button below to install BrandTrace AI instantly.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-neutral-100">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Manual Installation Steps:</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setActivePlatformTab('desktop')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${activePlatformTab === 'desktop' ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-neutral-400'}`}
                >
                  <Laptop className="w-3 h-3 inline mr-1" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatformTab('ios')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${activePlatformTab === 'ios' ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-neutral-400'}`}
                >
                  iOS Safari
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatformTab('android')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${activePlatformTab === 'android' ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-neutral-400'}`}
                >
                  <Smartphone className="w-3 h-3 inline mr-1" /> Android
                </button>
              </div>
            </div>

            {activePlatformTab === 'desktop' && (
              <ul className="space-y-1.5 text-slate-600 dark:text-neutral-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Chrome / Edge (Windows &amp; Mac):</strong> Click the <strong>Install</strong> icon (⊕) on the right side of the address bar, or menu (⋮) ➔ <strong>Save and share ➔ Install BrandTrace AI</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>macOS Safari:</strong> Click <strong>File ➔ Add to Dock...</strong> to pin BrandTrace AI as an independent macOS desktop app.
                  </span>
                </li>
              </ul>
            )}

            {activePlatformTab === 'ios' && (
              <ul className="space-y-1.5 text-slate-600 dark:text-neutral-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Tap the <strong>Share</strong> icon (square with upward arrow) in Safari's bottom toolbar.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Confirm with <strong>Add</strong> in the top-right corner.</span>
                </li>
              </ul>
            )}

            {activePlatformTab === 'android' && (
              <ul className="space-y-1.5 text-slate-600 dark:text-neutral-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Tap the menu icon (<strong>⋮</strong>) in Chrome's top-right corner.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</span>
                </li>
              </ul>
            )}
          </div>
        )}

        {/* Security Reassurance */}
        <div className="p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between">
          <span>Browser tab usage remains 100% operational without installation.</span>
          <span className="font-mono text-slate-400 dark:text-neutral-500 text-[10px]">Zero Vendor Lock-in</span>
        </div>
      </div>
    </Modal>
  );
};
