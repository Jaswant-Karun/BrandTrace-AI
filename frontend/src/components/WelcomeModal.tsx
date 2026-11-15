import React from 'react';
import { ShieldCheck, ArrowRight, Sparkles, X, Flame } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  onLaunchDemoScenario: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onLaunchDemoScenario
}) => {
  if (!isOpen) return null;

  const STEPS = [
    { number: 1, title: "Connected Workspace", desc: "Know what your brand allows across all channels." },
    { number: 2, title: "Certified Truth Nodes", desc: "Maintain approved prices (₹499), specs, and claims." },
    { number: 3, title: "Multi-Agent Inspection", desc: "Detect voice, claim, and regulatory defects in <800ms." },
    { number: 4, title: "Evidence-Linked Findings", desc: "View statutory legal citations (FTC, FDA, Lanham Act)." },
    { number: 5, title: "Reverse-Offset Remediation", desc: "Apply 1-click rewrites without character drift." },
    { number: 6, title: "Change Impact Simulator", desc: "Preview downstream ripple (₹499 ➔ ₹599) in virtual DAG." },
    { number: 7, title: "Approval Center Gate", desc: "Human sign-off records authorized decisions." },
    { number: 8, title: "5-State Release Ledger", desc: "Deterministic SHA-256 seals verify immutable history." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-4 sm:p-6 md:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-3 sm:right-5 top-3 sm:top-5 p-2 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close onboarding"
          aria-label="Close welcome modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">First-Time User Experience</Badge>
                <span className="text-[11px] font-mono text-slate-500">Enterprise Onboarding</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Welcome to BrandTrace AI
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                The autonomous brand intelligence &amp; governance control plane.
                <strong className="block text-slate-800 font-semibold mt-0.5">
                  "Know what your brand allows. Detect what your content risks. Understand the impact of changes. Approve with evidence. Preserve an auditable record."
                </strong>
              </p>
            </div>
          </div>

          {/* 8-Step Lifecycle Grid */}
          <div>
            <div className="text-xs font-semibold text-slate-900 mb-3 flex items-center justify-between">
              <span>The 8-Step Connected Governance Journey:</span>
              <span className="text-[11px] font-mono text-slate-500">Autonomous + Human Gate</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STEPS.map((s) => (
                <div
                  key={s.number}
                  className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl flex items-start gap-3 text-xs"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-[11px] shrink-0 mt-0.5">
                    {s.number}
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-semibold">{s.title}</strong>
                    <span className="text-slate-500 text-[11px] leading-tight block">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature Scenario Callout */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs">
            <div className="space-y-0.5 max-w-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Featured Evaluation Showcase: Aurelle Technologies Inc.</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Test the <strong className="font-semibold">₹499 ➔ ₹599</strong> subscription price mutation simulation, see the blast radius across 4 dependent touchpoints, and review the cryptographic release seals in the ledger.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onLaunchDemoScenario();
              }}
              icon={<Flame className="w-3.5 h-3.5 text-amber-400" />}
              className="w-full sm:w-auto justify-center"
            >
              Simulate ₹499 ➔ ₹599
            </Button>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-slate-100 gap-3">
            <button
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer text-center sm:text-left"
            >
              Skip Onboarding &amp; Enter Workspace
            </button>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="flex-1 sm:flex-none justify-center"
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                iconPosition="right"
                className="flex-1 sm:flex-none justify-center"
              >
                Start Interactive Guided Tour
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
