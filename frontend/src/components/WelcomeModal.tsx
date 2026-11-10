import React from 'react';
import {
  ShieldCheck, ArrowRight, Sparkles, CheckCircle2,
  X, BookOpen, Layers, Flame, CheckSquare, Lock
} from 'lucide-react';

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
    { number: 1, title: "Brand Workspace", desc: "Isolate tenant boundaries under ORG-AURELLE." },
    { number: 2, title: "Brand Guidelines", desc: "Define regulatory, visual, and statutory rules." },
    { number: 3, title: "Approved Facts", desc: "Maintain certified prices (₹499) and specs." },
    { number: 4, title: "Marketing Content", desc: "Catalog ads, landing pages, decks, and feeds." },
    { number: 5, title: "Multi-Agent Scan", desc: "4 autonomous agents ground claims in truth." },
    { number: 6, title: "Risk Intelligence", desc: "Detect FTC, FDA, trademark, and WCAG risks." },
    { number: 7, title: "Impact Simulator", desc: "Simulate fact updates (₹499 → ₹599) non-destructively." },
    { number: 8, title: "Approval Center", desc: "Route revision tasks to authorized reviewers." },
    { number: 9, title: "Verified Releases", desc: "Cryptographic SHA-256 seal stamped on releases." },
    { number: 10, title: "Audit Ledger", desc: "Tamper-evident history proving compliance." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                Getting Started Guide
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight pt-1">
                Welcome to BrandTrace AI
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Your central control plane for brand intelligence, content governance, risk detection, and verified releases.
              </p>
            </div>
          </div>

          {/* 10-Step Operational Lifecycle Grid */}
          <div>
            <div className="text-xs font-semibold text-slate-900 mb-3 flex items-center justify-between">
              <span>The 10-Step Enterprise Governance Lifecycle:</span>
              <span className="text-[11px] font-mono text-slate-500">Autonomous &amp; Human-in-the-Loop</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STEPS.map((s) => (
                <div
                  key={s.number}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-xs"
                >
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
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
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5 max-w-lg">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Featured Evaluation Workflow: Aurelle Technologies</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Simulate changing an approved subscription price from <strong className="font-semibold">₹499</strong> to <strong className="font-semibold">₹599</strong>, see the blast radius across 4 dependent assets, and authorize human sign-off.
              </p>
            </div>

            <button
              onClick={() => {
                onClose();
                onLaunchDemoScenario();
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              Run ₹499 → ₹599 Demo
            </button>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Skip to Dashboard
            </button>

            <button
              onClick={() => {
                onClose();
                onStartTour();
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Start Interactive Guided Tour</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
