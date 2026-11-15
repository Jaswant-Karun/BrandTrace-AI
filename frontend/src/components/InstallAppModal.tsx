import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Download,
  Globe,
  Laptop,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
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

type PlatformTab = 'desktop' | 'ios' | 'android';

const platformTabs: Array<{ id: PlatformTab; label: string; icon: React.ReactNode }> = [
  { id: 'desktop', label: 'Desktop', icon: <Laptop className="h-4 w-4" /> },
  { id: 'ios', label: 'iOS', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'android', label: 'Android', icon: <Smartphone className="h-4 w-4" /> },
];

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  onPromptInstall,
}) => {
  const [installing, setInstalling] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<PlatformTab>('desktop');

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const success = await onPromptInstall();
      if (success) onClose();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Install BrandTrace AI"
      subtitle="Get faster access to your Brand Intelligence Control Plane."
      maxWidth="md"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`h-2 w-2 rounded-full ${isInstalled ? 'bg-emerald-500' : isInstallable ? 'bg-blue-500' : 'bg-slate-300'}`}
              aria-hidden="true"
            />
            <span>
              {isInstalled
                ? 'Running in standalone mode'
                : isInstallable
                  ? 'Install is available in this browser'
                  : 'Use the guide for your platform'}
            </span>
          </div>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="w-full justify-center sm:w-auto"
            >
              Dismiss
            </Button>
            {isInstallable && !isInstalled && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleInstallClick}
                disabled={installing}
                icon={<Download className="h-4 w-4" />}
                className="w-full justify-center bg-blue-600 text-white shadow-sm hover:bg-blue-700 sm:w-auto"
              >
                {installing ? 'Installing...' : 'Install App'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5 text-sm text-slate-700">
        <section className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold tracking-tight text-slate-900">
                BrandTrace AI Control Plane
              </h3>
              <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                Progressive Web App
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Windows, macOS, iOS, and Android
            </p>
          </div>
        </section>

        <section aria-labelledby="install-benefits-heading">
          <h4 id="install-benefits-heading" className="sr-only">
            Installation benefits
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Monitor className="h-4 w-4 text-blue-600" />
                <span>Standalone Window</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Launch BrandTrace AI in a dedicated application window without browser tab clutter.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Quick Access</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Pin BrandTrace AI to your desktop, taskbar, dock, or mobile home screen.
              </p>
            </div>
          </div>
        </section>

        {isInstalled ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Application already installed</p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                BrandTrace AI is running in standalone application mode.
              </p>
            </div>
          </div>
        ) : isInstallable ? (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
            <Globe className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="font-semibold">Installation is ready</p>
              <p className="mt-1 text-xs leading-relaxed text-blue-800">
                Your browser supports direct installation. Select <strong>Install App</strong> below to continue.
              </p>
            </div>
          </div>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="manual-install-heading">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 id="manual-install-heading" className="font-semibold text-slate-900">
                  Install manually
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  Choose your platform for the relevant browser steps.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1" role="tablist" aria-label="Installation platform">
                {platformTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activePlatformTab === tab.id}
                    onClick={() => setActivePlatformTab(tab.id)}
                    className={`flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      activePlatformTab === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              {activePlatformTab === 'desktop' && (
                <InstructionList
                  items={[
                    <>
                      <strong>Chrome / Edge:</strong> Use the browser&apos;s <strong>Install App</strong> option or installation icon when available.
                    </>,
                    <>
                      <strong>macOS Safari:</strong> Use <strong>File &rarr; Add to Dock</strong>, where supported.
                    </>,
                  ]}
                />
              )}
              {activePlatformTab === 'ios' && (
                <InstructionList
                  items={[
                    <>Open this website in <strong>Safari</strong>.</>,
                    <>Tap <strong>Share</strong> in Safari.</>,
                    <>Select <strong>Add to Home Screen</strong>, then confirm.</>,
                  ]}
                />
              )}
              {activePlatformTab === 'android' && (
                <InstructionList
                  items={[
                    <>Open this website in <strong>Chrome</strong>.</>,
                    <>Open the browser menu.</>,
                    <>Select <strong>Install app</strong> or <strong>Add to Home screen</strong> when available.</>,
                  ]}
                />
              )}
            </div>
          </section>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Browser access remains available even when installation is not supported.</span>
        </div>
      </div>
    </Modal>
  );
};

const InstructionList: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <ul className="space-y-3 text-xs leading-relaxed text-slate-600">
    {items.map((item, index) => (
      <li key={index} className="flex items-start gap-2">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);
