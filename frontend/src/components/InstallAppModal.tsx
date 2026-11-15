import React from 'react';
import {
  Download, Monitor, ShieldCheck, CheckCircle2,
  ExternalLink, Chrome, Sparkles, Check
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
  const [installing, setInstalling] = React.useState(false);

  const handleInstallClick = async () => {
    setInstalling(true);
    const success = await onPromptInstall();
    setInstalling(false);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Install BrandTrace AI Desktop Application"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-500 font-mono">
            {isInstalled ? 'Status: Installed' : isInstallable ? 'Ready to Install' : 'Browser Mode Active'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Dismiss
            </Button>
            {isInstallable && !isInstalled && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                disabled={installing}
                icon={<Download className={`w-3.5 h-3.5 ${installing ? 'animate-bounce' : ''}`} />}
              >
                {installing ? 'Installing...' : 'Install Now'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-slate-700">
        {/* Banner Graphic */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-400 text-slate-950 px-1.5 py-0.5 rounded font-mono">
                PWA Standalone
              </span>
              <span className="text-[11px] text-slate-300 font-mono">Chrome / Edge / Safari</span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
              BrandTrace AI Control Plane
            </h3>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Monitor className="w-3.5 h-3.5 text-slate-700" />
              <span>Standalone Window</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Run without browser tabs or address bar clutter for a focused enterprise governance experience.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Taskbar &amp; Dock Launch</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Pin BrandTrace AI directly to Windows Taskbar, macOS Dock, or Linux application launcher.
            </p>
          </div>
        </div>

        {/* Dynamic Installation Guide */}
        {isInstalled ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Application Already Installed</span>
              <p className="text-[11px] text-emerald-800">
                You are running BrandTrace AI in standalone desktop window mode.
              </p>
            </div>
          </div>
        ) : isInstallable ? (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Chrome className="w-4 h-4 text-slate-700" />
              <span>1-Click Browser Installation Supported</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your browser supports direct installation. Click the <strong>"Install Now"</strong> button below to add BrandTrace AI to your applications.
            </p>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-semibold text-slate-900">
              Manual Browser Installation Steps:
            </div>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Google Chrome / Microsoft Edge:</strong> Look for the <strong>Install</strong> icon (⊕ or computer icon) on the right side of your address bar, or click <strong>Menu (⋮) ➔ Cast, Save &amp; Share ➔ Install BrandTrace AI</strong>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>macOS Safari:</strong> Click <strong>File ➔ Add to Dock...</strong> to run BrandTrace AI as an independent app.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>iOS Safari:</strong> Tap the <strong>Share</strong> button ➔ <strong>Add to Home Screen</strong>.
                </span>
              </li>
            </ul>
          </div>
        )}

        {/* Browser Continuity Reassurance */}
        <div className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-center justify-between">
          <span>Browser tab usage remains 100% operational without installation.</span>
          <span className="font-mono text-slate-400">Zero Lock-in</span>
        </div>
      </div>
    </Modal>
  );
};
