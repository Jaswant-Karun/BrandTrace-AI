import React, { useState } from 'react';
import {
  Sparkles, BookOpen, Flame, CheckSquare, Lock,
  ArrowRight, RotateCcw, CheckCircle2, AlertTriangle,
  ChevronDown, ChevronUp, Layers, ShieldCheck,
  Cpu
} from 'lucide-react';
import { NavigationTab } from './Sidebar';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useToast } from './ui/ToastContext';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface JudgeJourneyPanelProps {
  brandId: string;
  onNavigate: (tab: NavigationTab) => void;
  onRefreshData?: () => void;
}

export const JudgeJourneyPanel: React.FC<JudgeJourneyPanelProps> = ({
  brandId: _brandId,
  onNavigate,
  onRefreshData
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  const STEPS = [
    {
      number: 1,
      title: "Explore Brand Knowledge",
      description: "Inspect certified brand facts (FACT-AUR-PRC-01 at ₹499), guidelines (GL-AUR-01 to 07), and restricted claims.",
      targetTab: 'knowledge-base' as NavigationTab,
      actionLabel: "Open Brand Knowledge",
      icon: <BookOpen className="w-4 h-4 text-sky-600" />
    },
    {
      number: 2,
      title: "Inspect Sample Content",
      description: "Submit marketing copy or load an Aurelle preset into the autonomous 4-agent pre-release inspection gate (<800ms).",
      targetTab: 'content-studio' as NavigationTab,
      actionLabel: "Open Content Inspector",
      icon: <Sparkles className="w-4 h-4 text-indigo-600" />
    },
    {
      number: 3,
      title: "Review Evidence-Linked Findings",
      description: "Examine policy violations with direct citations to governing guidelines, ASTM Grade 5 benchmarks, or FDA rules.",
      targetTab: 'content-studio' as NavigationTab,
      actionLabel: "Inspect Findings",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />
    },
    {
      number: 4,
      title: "Open Change Impact Simulator",
      description: "Access the predictive digital twin to model upstream brand mutations before committing changes to touchpoints.",
      targetTab: 'impact-simulator' as NavigationTab,
      actionLabel: "Open Simulator",
      icon: <Layers className="w-4 h-4 text-amber-600" />
    },
    {
      number: 5,
      title: "Simulate AURELLE ₹499 ➔ ₹599 Price Change",
      description: "Model updating the Aurelle Cloud Studio subscription from ₹499 to ₹599 and compute the 86.5/100 risk score.",
      targetTab: 'impact-simulator' as NavigationTab,
      actionLabel: "Launch Price Simulation",
      icon: <Flame className="w-4 h-4 text-amber-600" />
    },
    {
      number: 6,
      title: "Review Affected Content",
      description: "Examine the 4 affected touchpoints (Meta ad, Google PPC, checkout page, B2B rate card) with computed $320k exposure.",
      targetTab: 'bdig' as NavigationTab,
      actionLabel: "View Knowledge Graph",
      icon: <Cpu className="w-4 h-4 text-purple-600" />
    },
    {
      number: 7,
      title: "Open Approval Center",
      description: "Review spawned revision tasks, compare diff highlights, and execute atomic approvals with zero silent overwrites.",
      targetTab: 'approvals' as NavigationTab,
      actionLabel: "Open Approval Center",
      icon: <CheckSquare className="w-4 h-4 text-emerald-600" />
    },
    {
      number: 8,
      title: "Inspect Trust & Audit Ledger",
      description: "Verify immutable SHA-256 release proofs, dual timestamps, reviewer signatures, and Merkle block chaining.",
      targetTab: 'audit-trust' as NavigationTab,
      actionLabel: "Inspect Audit Ledger",
      icon: <Lock className="w-4 h-4 text-slate-800" />
    }
  ];

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      await apiClient.demo.reset();
      toast.success("AURELLE demo workspace successfully reset to initial baseline (₹499 price, revision tasks cleared)!");
      setIsResetModalOpen(false);
      setCompletedSteps({});
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error("Reset demo failed:", err);
      toast.error(err.detail || err.message || "Failed to reset demo workspace.");
    } finally {
      setIsResetting(false);
    }
  };

  // Check if current user is authorized to reset (Creator cannot reset)
  const userRole = user?.role ? (typeof user.role === 'string' ? user.role : (user.role as any).value) : '';
  const canReset = userRole !== 'CREATOR';

  return (
    <>
      <div className="bg-white border-2 border-slate-900 rounded-2xl shadow-xs overflow-hidden transition-all">
        {/* Banner Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded font-mono">
                  Judge Evaluation Tour
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  8-Step Interactive Walkthrough
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                Start Here — Autonomous Brand Intelligence &amp; Governance Control Plane
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Safe Reset Action */}
            <button
              onClick={() => setIsResetModalOpen(true)}
              disabled={!canReset}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                canReset
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-400/40'
                  : 'bg-white/5 text-slate-400 border-white/10 opacity-50 cursor-not-allowed'
              }`}
              title={canReset ? "Safely reset AURELLE demo workspace to baseline" : "Creator role cannot reset workspace"}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
              <span>Reset Demo State</span>
            </button>

            {/* Collapse / Expand Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/20"
              title={isCollapsed ? "Expand Judge Journey" : "Collapse Judge Journey"}
            >
              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Informational Sub-Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold text-slate-900">Workspace:</span>
            <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700">
              aurelle-tech (Consumer Electronics &amp; Audio)
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-[11px] text-slate-500">
              Synthetic Demonstration Data Only
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">
              Evaluation Progress: <strong className="text-slate-900 font-mono">{completedCount}/8 Steps Tested</strong>
            </span>
            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Collapsible 8-Step Grid */}
        {!isCollapsed && (
          <div className="p-5 sm:p-6 bg-white space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {STEPS.map((step) => {
                const isChecked = !!completedSteps[step.number];
                return (
                  <div
                    key={step.number}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                      isChecked
                        ? 'bg-emerald-50/40 border-emerald-300/80'
                        : 'bg-white hover:bg-slate-50/70 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-mono font-bold text-slate-800">
                            0{step.number}
                          </span>
                          <span className="p-1 rounded-md bg-slate-50 border border-slate-200">
                            {step.icon}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleStep(step.number)}
                          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                          title="Mark step as verified"
                        >
                          <CheckCircle2
                            className={`w-4 h-4 transition-colors ${
                              isChecked ? 'text-emerald-600 fill-emerald-100' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {step.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => onNavigate(step.targetTab)}
                        className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <span>{step.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Summary Strip */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Deterministic + Neural Validation</span>
                <span className="text-slate-300">·</span>
                <span>Explainable Policy References</span>
                <span className="text-slate-300">·</span>
                <span>SHA-256 Release Proofs</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Argon2 / SHA-256 RBAC Enforced
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Demo Workspace Reset */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => !isResetting && setIsResetModalOpen(false)}
        title="Confirm Demo Workspace Reset"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={isResetting}
              onClick={() => setIsResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isResetting}
              onClick={handleExecuteReset}
              icon={<RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />}
            >
              {isResetting ? "Restoring Baseline..." : "Confirm & Reset Demo State"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Safe Demo Reset Warning</span>
              <p className="leading-relaxed">
                This action restores the <strong className="text-amber-950 font-mono">aurelle-tech</strong> demonstration workspace back to its initial evaluation state.
              </p>
            </div>
          </div>

          <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <span className="font-semibold text-slate-900 block">Actions performed upon reset:</span>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Restore master price node <strong className="text-slate-900 font-mono">FACT-AUR-PRC-01</strong> to baseline <strong className="text-emerald-700 font-mono">₹499</strong>.</li>
              <li>Purge temporary simulation reports and pending revision tasks for <strong className="text-slate-900 font-mono">aurelle-tech</strong>.</li>
              <li>Reset release ledger entries generated during current session.</li>
              <li><strong className="text-slate-900">Zero Cross-Tenant Impact:</strong> Workspaces <strong className="font-mono text-slate-800">apex-dynamics</strong> and <strong className="font-mono text-slate-800">novus-health</strong> are completely preserved.</li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-500">
            Enforced by server-side RBAC: Brand Manager or Admin authentication required.
          </p>
        </div>
      </Modal>
    </>
  );
};
