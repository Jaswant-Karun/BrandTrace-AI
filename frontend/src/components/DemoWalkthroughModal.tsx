import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Play, RotateCcw, X,
  Layers, ChevronRight, Sparkles,
  ArrowRight, Database, Check
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface ScenarioStep {
  step_number: number;
  title: string;
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
  const { user, personas, switchPersona } = useAuth();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl text-slate-900 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-white gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  AURELLE Interactive Governance Walkthrough
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-100 border border-slate-200 text-slate-700">
                  Enterprise Governance Lifecycle Scenario
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fictional consumer technology enterprise · 12-Step lifecycle &amp; 9 statutory test cases · MongoDB Atlas live sync
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={handleResetScenario}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-xs cursor-pointer"
              title="Reset scenario to ₹499 baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline (₹499)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-1.5 min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close walkthrough"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace & Persona Quick-Bar */}
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 text-xs gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-slate-600">
            <span>Active Enterprise:</span>
            <span className="font-semibold text-slate-900 flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-slate-700" />
              <span>ORG-AURELLE / aurelle-tech</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span>Current Cloud Studio Price:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
              scenarioState?.current_price === '₹599' ? 'bg-amber-50 text-amber-800 border border-amber-300' : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            }`}>
              {scenarioState?.current_price || '₹499'} / mo
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-slate-600 font-semibold">RBAC Persona:</span>
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              {personas.filter(p => p.org_id === 'ORG-AURELLE' || p.workspace_id === 'aurelle-tech').map((p) => (
                <button
                  key={p.email}
                  onClick={() => switchPersona(p)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                    user?.email === p.email
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title={`${p.name} (${p.role})`}
                >
                  {p.role.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-4 sm:px-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'lifecycle'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>12-Step Governance Lifecycle</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-bold border border-slate-200">
              Step {scenarioState?.current_step || 1}/12
            </span>
          </button>
          <button
            onClick={() => setActiveTab('cases')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
              activeTab === 'cases'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>9 Governance Demonstration Cases</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-700 font-bold border border-slate-200">
              Live AI Inspection
            </span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* TAB 1: 12-STEP LIFECYCLE */}
          {activeTab === 'lifecycle' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Scenario: Flagship Price Mutation ₹499 ➔ ₹599
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Demonstrates autonomous dependency tracing, change simulation, human-in-the-loop revision routing, atomic review approvals, and cryptographic audit ledger sealing.
                  </p>
                </div>
                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleExecuteStep(scenarioState?.current_step || 1)}
                    disabled={executingStep !== null || scenarioState?.current_step >= 12}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 shadow-xs cursor-pointer min-h-[36px]"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
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
                          ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900/10 shadow-xs'
                          : isCompleted
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-slate-50/50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : isCurrent
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.step_number}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              {step.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Actor: {step.actor_name}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isCurrent
                            ? 'bg-slate-100 text-slate-900 border border-slate-300 font-bold'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {step.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {step.description}
                      </p>

                      {step.before_value && step.after_value && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 line-through">{step.before_value}</span>
                          <ArrowRight className="w-3 h-3 text-slate-700" />
                          <span className="text-emerald-700 font-bold">{step.after_value}</span>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center justify-between">
                        {step.target_view && onNavigateToView && (
                          <button
                            onClick={() => {
                              onNavigateToView(step.target_view!);
                              onClose();
                            }}
                            className="text-[10px] text-slate-700 hover:text-slate-900 font-medium flex items-center space-x-1 underline cursor-pointer"
                          >
                            <span>Open {step.target_view}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleExecuteStep(step.step_number)}
                          disabled={executingStep === step.step_number}
                          className="ml-auto text-[10px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition font-semibold cursor-pointer"
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
                <h3 className="text-sm font-semibold text-slate-900">
                  9 Comprehensive Governance &amp; Statutory Compliance Tests
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Each case simulates real-world marketing and legal risks. Run live AI verification to inspect rule enforcement, risk scoring, and explainable rewrites.
                </p>
              </div>

              {/* Case Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {cases.map((c) => (
                  <div
                    key={c.case_id}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all shadow-xs ${
                      activeCaseResult?.case_id === c.case_id
                        ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900/10'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-700 font-mono">
                          {c.case_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.severity === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          c.severity === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {c.severity}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mb-1.5">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 italic mb-2 line-clamp-2">
                        "{c.sample_content}"
                      </p>
                      <p className="text-[10px] text-slate-500 line-clamp-2">
                        <strong className="text-slate-700">Policy:</strong> {c.governing_policy}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRunCase(c.case_id)}
                      disabled={testingCaseId === c.case_id}
                      className="mt-3 w-full py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>{testingCaseId === c.case_id ? 'Analyzing...' : 'Run Live Inspection'}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Case Inspection Result Display */}
              {activeCaseResult && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-slate-800" />
                      <h4 className="text-xs font-bold text-slate-900">
                        Inspection Results: {activeCaseResult.title}
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {activeCaseResult.governance_decision} · Risk Score: {activeCaseResult.composite_risk_score}/100
                    </span>
                  </div>

                  {/* Tested Content */}
                  <div className="text-xs font-mono p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800">
                    <span className="text-slate-500 font-sans block text-[10px] mb-1">Tested Raw Content:</span>
                    {activeCaseResult.content_tested}
                  </div>

                  {/* Defects Detected */}
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Detected Governance Deviations ({activeCaseResult.defects_detected_count}):
                    </h5>
                    {activeCaseResult.risk_spans?.map((span: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-rose-800 font-mono">
                            "{span.matched_text}"
                          </span>
                          <span className="text-[10px] text-rose-700 font-mono">
                            {span.category} · {span.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{span.explanation}</p>
                        <p className="text-[10px] text-slate-700 mt-1 font-mono">
                          <strong>Governing Rule:</strong> {span.rule_citation}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Remediation Rewrite */}
                  {activeCaseResult.suggested_remediation && (
                    <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
                      <span className="text-emerald-800 font-bold block mb-1">
                        Explainable Graph-Preserving Remediation:
                      </span>
                      <p className="text-emerald-950 font-medium">
                        "{activeCaseResult.suggested_remediation}"
                      </p>
                      {activeCaseResult.remediation_rationale && (
                        <p className="text-[10px] text-emerald-800/80 mt-1">
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
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>MongoDB Atlas Vector Search &amp; GraphLookup Active</span>
          </div>
          <span>BRANDTRACE AI v2.0 Enterprise Control Plane</span>
        </div>

      </div>
    </div>
  );
};
