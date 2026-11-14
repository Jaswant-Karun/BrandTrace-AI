import React from 'react';
import { ArrowRight, ArrowLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { NavigationTab } from './Sidebar';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export interface TourStep {
  tab: NavigationTab;
  title: string;
  category: string;
  description: string;
  actionText: string;
  badge: string;
  highlightTip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    tab: 'command-center',
    title: '1. Welcome to BrandTrace AI',
    category: 'Overview',
    description: 'Welcome to BrandTrace AI — the autonomous brand intelligence & governance control plane. Every brand decision connected. Every risk traceable. Every release accountable.',
    actionText: 'Next: Product Promise in Plain Language',
    badge: 'Step 1 of 8',
    highlightTip: 'Your governance workspace at a glance: real-time compliance index, sealed release counts, and pending approvals.'
  },
  {
    tab: 'command-center',
    title: '2. Product Promise in Plain Language',
    category: 'Core Value',
    description: 'Know what your brand allows. Detect what your content risks. Understand the impact of changes. Approve with evidence. Preserve an auditable record.',
    actionText: 'Next: Meet Aurelle Workspace',
    badge: 'Step 2 of 8',
    highlightTip: 'Eliminates siloed brand books, accidental price leaks, greenwashing lawsuits, and unverified marketing claims.'
  },
  {
    tab: 'command-center',
    title: '3. Introduce the AURELLE Demo Workspace',
    category: 'Showcase Workspace',
    description: 'Aurelle Technologies Inc. is pre-loaded as your live demonstration workspace. It features next-generation spatial computing hardware, proprietary audio patents, and subscription pricing.',
    actionText: 'Next: View Approved Brand Facts',
    badge: 'Step 3 of 8',
    highlightTip: 'You can switch between Aurelle Technologies, Apex Dynamics, and Novus Health Solutions in the sidebar.'
  },
  {
    tab: 'knowledge-base',
    title: '4. Where Approved Brand Facts Are Stored',
    category: 'Brand Knowledge',
    description: 'Manage the approved facts, rules and guidelines that your organisation uses. Notice FACT-AUR-PRC-01: Aurelle Cloud Studio is officially certified at ₹499/mo.',
    actionText: 'Next: Inspect Content Sample',
    badge: 'Step 4 of 8',
    highlightTip: 'Every marketing claim evaluated by BrandTrace is grounded against these immutable truth nodes.'
  },
  {
    tab: 'content-studio',
    title: '5. Inspect Marketing Content in Real-Time',
    category: 'Content Intelligence',
    description: 'Check content against your approved brand knowledge. Select a preset scenario and run 3 concurrent agent pipelines (Voice, Claim, Regulatory) in under 800ms.',
    actionText: 'Next: Review Findings & Citations',
    badge: 'Step 5 of 8',
    highlightTip: 'Paste any draft copy or select the Aurelle ₹499 ad preset to execute immediate multi-agent scanning.'
  },
  {
    tab: 'content-studio',
    title: '6. Review Evidence-Linked Findings & Rewrites',
    category: 'Explainable AI',
    description: 'Inspect token-level defect highlights with exact statutory citations (FTC 16 CFR §260.4, FDA §870, Lanham Act). Apply 1-click reverse-offset remediation without syntax errors.',
    actionText: 'Next: Change Impact Simulator',
    badge: 'Step 6 of 8',
    highlightTip: 'Reverse-offset replacement swaps text from right to left, preserving character indices and surrounding brand voice.'
  },
  {
    tab: 'impact-simulator',
    title: '7. The Change Impact Simulator (Digital Twin)',
    category: 'Predictive Governance',
    description: 'Preview which content may be affected before changing approved brand knowledge. Simulate mutating Cloud Studio price from ₹499 to ₹599 in an isolated virtual DAG before production commit.',
    actionText: 'Next: Approval & Audit Ledger',
    badge: 'Step 7 of 8',
    highlightTip: 'Simulating ₹499 ➔ ₹599 identifies 4 affected touchpoints and $320,000 in unbudgeted exposure before human sign-off.'
  },
  {
    tab: 'audit-trust',
    title: '8. Human Approval & Cryptographic Trust Ledger',
    category: 'Assurance & Ledger',
    description: 'Conduct authorized human-in-the-loop sign-off in the Approval Center. Releases are sealed with deterministic SHA-256 Merkle digests and verified across 5 integrity states.',
    actionText: 'Finish Onboarding Tour',
    badge: 'Step 8 of 8',
    highlightTip: 'Test the 5-state integrity verifier on AST-AUR-01 to see authentic, modified, superseded, or revoked states.'
  }
];

interface GuidedTourOverlayProps {
  isOpen: boolean;
  currentStepIndex: number;
  onStepChange: (index: number, tab: NavigationTab) => void;
  onClose: () => void;
}

export const GuidedTourOverlay: React.FC<GuidedTourOverlayProps> = ({
  isOpen,
  currentStepIndex,
  onStepChange,
  onClose
}) => {
  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onClose();
    } else {
      const nextIdx = currentStepIndex + 1;
      onStepChange(nextIdx, TOUR_STEPS[nextIdx].tab);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIdx = currentStepIndex - 1;
      onStepChange(prevIdx, TOUR_STEPS[prevIdx].tab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end p-4 sm:p-6 md:justify-center md:items-center">
      {/* Light Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Guided Tour Card */}
      <div className="relative pointer-events-auto w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 z-10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 sm:pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Badge variant="brand" size="sm">
              {step.badge}
            </Badge>
            <span className="text-[11px] font-mono font-medium text-slate-500">
              {step.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Skip and close onboarding tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 sm:space-y-1.5">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {step.title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {step.description}
          </p>
        </div>

        {step.highlightTip && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/70 border border-sky-200 text-xs text-sky-950 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{step.highlightTip}</span>
          </div>
        )}

        {/* Navigation Step Indicators */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => onStepChange(i, TOUR_STEPS[i].tab)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === currentStepIndex ? 'w-6 bg-slate-900' : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Jump to step ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrev}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              icon={isLast ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              iconPosition="right"
            >
              <span className="sm:hidden">{isLast ? 'Finish' : 'Next'}</span>
              <span className="hidden sm:inline">{step.actionText}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
