import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Play, RotateCcw, CheckCircle2, AlertTriangle, X,
  Layers, ChevronRight, UserCheck, Eye, Terminal, Sparkles,
  ArrowRight, Activity, Database, Check
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface ScenarioStep {
  step_number: number;
  title: str;
  actor_role: string;
  actor_name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  description: string;
  before_value?: string;
  after_value?: string;
  artifact_generated?: string;
  target_view?: string;
}

interface DemoCase {
  case_id: string;
  title: string;
  category: string;
  severity: string;
  sample_content: string;
  expected_violation: string;
  governing_policy: string;
  suggested_fix: string;
}

interface DemoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToView?: (viewId: string) => void;
}

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({
  isOpen,
  onClose,
  onNavigateToView
}) => {
  const { currentWorkspace, setWorkspace, user, personas, switchPersona } = useAuth();
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'cases'>('lifecycle');
  
  // Scenario state
  const [scenarioState, setScenarioState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [executingStep, setExecutingStep] = useState<number | null>(null);

  // Cases state
  const [cases, setCases] = useState<DemoCase[]>([]);
  const [activeCaseResult, setActiveCaseResult] = useState<any>(null);
  const [testingCaseId, setTestingCaseId] = useState<string | null>(null);

  const fetchScenarioStatus = async () => {
    try {
      setLoading(true);
      const data = await apiClient.demo.getScenarioStatus();
      setScenarioState(data);
    } catch (err) {
      console.error('Failed to load demo scenario status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      const data = await apiClient.demo.listCases();
      setCases(data);
    } catch (err) {
      console.error('Failed to list demo cases:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchScenarioStatus();
      fetchCases();
    }
  }, [isOpen]);

  const handleExecuteStep = async (stepNum: number) => {
    try {
      setExecutingStep(stepNum);
      const res = await apiClient.demo.executeStep(stepNum, user?.role, user?.name);
      setScenarioState(res.scenario_state);
    } catch (err) {
      console.error('Failed to execute step:', err);
    } finally {
      setExecutingStep(null);
    }
  };

  const handleResetScenario = async () => {
    try {
      setLoading(true);
      const data = await apiClient.demo.reset();
      setScenarioState(data);
      setActiveCaseResult(null);
    } catch (err) {
      console.error('Failed to reset demo scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCase = async (caseId: string) => {
    try {
      setTestingCaseId(caseId);
      const result = await apiClient.demo.runCase(caseId);
      setActiveCaseResult(result);
    } catch (err) {
      console.error('Failed to run demo test case:', err);
    } finally {
      setTestingCaseId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-[#070B14] border border-[#1E293B] rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0A0F1D]/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  AURELLE Interactive Governance Walkthrough
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  Phase 6 Master Scenario
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fictional consumer technology enterprise · 12-Step lifecycle & 9 statutory test cases · MongoDB Atlas live sync
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetScenario}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Reset scenario to ₹499 baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline (₹499)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace & Persona Quick-Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-[#0D1527] border-b border-[#1E293B]/60 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <span>Active Enterprise:</span>
            <span className="font-semibold text-cyan-400 flex items-center space-x-1">
              <Database className="w-3.5 h-3.5" />
              <span>ORG-AURELLE / aurelle-tech</span>
            </span>
            <span className="text-slate-600">|</span>
            <span>Current Cloud Studio Price:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
              scenarioState?.current_price === '₹599' ? 'bg-amber-950 text-amber-400 border border-amber-700' : 'bg-emerald-950 text-emerald-400 border border-emerald-700'
            }`}>
              {scenarioState?.current_price || '₹499'} / mo
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">RBAC Persona:</span>
            <div className="flex items-center space-x-1.5">
              {personas.filter(p => p.org_id === 'ORG-AURELLE' || p.workspace_id === 'aurelle-tech').map((p) => (
                <button
                  key={p.email}
                  onClick={() => switchPersona(p)}
                  className={`px-2 py-1 rounded text-xs font-medium transition ${
                    user?.email === p.email
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title={`${p.name} (${p.role})`}
                >
                  {p.role.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1E293B] px-6 bg-[#070B14]">
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'lifecycle'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>12-Step Governance Lifecycle</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              Step {scenarioState?.current_step || 1}/12
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition ${
              activeTab === 'cases'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>9 Governance Demonstration Cases</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-[10px] text-cyan-300 border border-cyan-800">
              Live AI Inspection
            </span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: 12-STEP LIFECYCLE */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-cyan-950/30 border border-blue-900/40 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Scenario: Flagship Price Mutation ₹499 ➔ ₹599
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Demonstrates autonomous dependency tracing, change simulation, human-in-the-loop revision routing, atomic review approvals, and cryptographic audit ledger sealing.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleExecuteStep(scenarioState?.current_step || 1)}
                    disabled={executingStep !== null || scenarioState?.current_step >= 12}
                    className="flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black hover:opacity-95 transition disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>
                      {scenarioState?.current_step >= 12 ? 'Scenario Complete' : `Execute Step ${scenarioState?.current_step || 1}`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Steps List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {scenarioState?.steps?.map((step: ScenarioStep) => {
                  const isCurrent = step.step_number === scenarioState?.current_step;
                  const isCompleted = step.status === 'COMPLETED';

                  return (
                    <div
                      key={step.step_number}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-cyan-950/20 border-cyan-500/50 shadow-md shadow-cyan-900/20'
                          : isCompleted
                          ? 'bg-[#0A0F1D]/80 border-slate-800/80 hover:border-slate-700'
                          : 'bg-[#070B14]/60 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : isCurrent
                              ? 'bg-cyan-500 text-black font-extrabold'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.step_number}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-white">
                              {step.title}
                            </h4>
                            <span className="text-[10px] text-cyan-400 font-medium">
                              Actor: {step.actor_name}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          isCompleted
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : isCurrent
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {step.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-2">
                        {step.description}
                      </p>

                      {step.before_value && step.after_value && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 line-through">{step.before_value}</span>
                          <ArrowRight className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-300 font-bold">{step.after_value}</span>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        {step.target_view && onNavigateToView && (
                          <button
                            onClick={() => {
                              onNavigateToView(step.target_view!);
                              onClose();
                            }}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                          >
                            <span>Open {step.target_view}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleExecuteStep(step.step_number)}
                          disabled={executingStep === step.step_number}
                          className="ml-auto text-[10px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                        >
                          {executingStep === step.step_number ? 'Running...' : 'Execute'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 9 GOVERNANCE TEST CASES */}
          {activeTab === 'cases' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  9 Comprehensive Governance & Statutory Compliance Tests
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Each case simulates real-world marketing and legal risks. Run live AI verification to inspect rule enforcement, risk scoring, and explainable rewrites.
                </p>
              </div>

              {/* Case Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cases.map((c) => (
                  <div
                    key={c.case_id}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      activeCaseResult?.case_id === c.case_id
                        ? 'bg-blue-950/30 border-blue-500 shadow-md'
                        : 'bg-[#0A0F1D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-cyan-400 font-mono">
                          {c.case_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                          c.severity === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}>
                          {c.severity}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white mb-1.5">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-slate-300 italic mb-2 line-clamp-2">
                        "{c.sample_content}"
                      </p>
                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        <strong className="text-slate-300">Policy:</strong> {c.governing_policy}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRunCase(c.case_id)}
                      disabled={testingCaseId === c.case_id}
                      className="mt-3 w-full py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center space-x-1.5 transition"
                    >
                      <Play className="w-3 h-3 fill-cyan-400" />
                      <span>{testingCaseId === c.case_id ? 'Analyzing...' : 'Run Live Inspection'}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Case Inspection Result Display */}
              {activeCaseResult && (
                <div className="p-4 rounded-xl bg-[#0A0F1D] border border-cyan-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white">
                        Inspection Results: {activeCaseResult.title}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-950 text-red-400 border border-red-800">
                      {activeCaseResult.governance_decision} · Risk Score: {activeCaseResult.composite_risk_score}/100
                    </span>
                  </div>

                  {/* Tested Content */}
                  <div className="text-xs font-mono p-2.5 rounded-lg bg-black/60 border border-slate-800 text-slate-200">
                    <span className="text-slate-400 font-sans block text-[10px] mb-1">Tested Raw Content:</span>
                    {activeCaseResult.content_tested}
                  </div>

                  {/* Defects Detected */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Detected Governance Deviations ({activeCaseResult.defects_detected_count}):
                    </h5>
                    {activeCaseResult.risk_spans?.map((span: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-red-300 font-mono">
                            "{span.matched_text}"
                          </span>
                          <span className="text-[10px] text-red-400 font-mono">
                            {span.category} · {span.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{span.explanation}</p>
                        <p className="text-[10px] text-cyan-400 mt-1">
                          <strong>Governing Rule:</strong> {span.rule_citation}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Remediation Rewrite */}
                  {activeCaseResult.suggested_remediation && (
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs">
                      <span className="text-emerald-400 font-bold block mb-1">
                        Explainable Graph-Preserving Remediation:
                      </span>
                      <p className="text-emerald-200 font-medium">
                        "{activeCaseResult.suggested_remediation}"
                      </p>
                      {activeCaseResult.remediation_rationale && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {activeCaseResult.remediation_rationale}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1E293B] bg-[#0A0F1D] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>MongoDB Atlas Vector Search & GraphLookup Active</span>
          </div>
          <span>BRANDTRACE AI v2.0 Enterprise Control Plane</span>
        </div>

      </div>
    </div>
  );
};
