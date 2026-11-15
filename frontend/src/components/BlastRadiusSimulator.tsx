import React, { useState } from 'react';
import { 
  Flame, Network, GitCompare, 
  CheckCircle2, XCircle, AlertTriangle, Lock, Sparkles, Clock, Check
} from 'lucide-react';
import { BlastRadiusResponse } from '../types';
import { PageHeader } from './ui/PageHeader';
import { WorkflowBanner } from './ui/WorkflowBanner';

interface BlastRadiusSimulatorProps {
  brandId: string;
  onNavigate?: (tab: any) => void;
}

export const BlastRadiusSimulator: React.FC<BlastRadiusSimulatorProps> = ({ brandId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'change_simulator' | 'policy_cascade'>('change_simulator');

  // Change Impact Simulation State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('FACT-AUR-PRC-01');
  const [recordType, setRecordType] = useState<string>('PRICE');
  const [recordLabel, setRecordLabel] = useState<string>('Aurelle Cloud Studio Monthly Subscription');
  const [oldValue, setOldValue] = useState<string>('₹499');
  const [proposedValue, setProposedValue] = useState<string>('₹599');
  const [rationale, setRationale] = useState<string>(
    'Spatial audio rendering infrastructure scaling and global master commercial indexing.'
  );
  const [proposedBy, setProposedBy] = useState<string>('Julian Vance, VP Brand Governance');

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationReport, setSimulationReport] = useState<any>(null);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitMessage, setCommitMessage] = useState<{ status: 'success' | 'error'; text: string } | null>(null);

  // Policy Mutation Blast Radius State
  const [mutatedNodeId, setMutatedNodeId] = useState<string>('PC-01');
  const [mutationType, setMutationType] = useState<string>('REGULATORY_AMENDMENT');
  const [notes, setNotes] = useState<string>(
    'EU Directive 2024/825 tightens green claims: blanket zero-carbon references banned without certified whole-lifecycle verification.'
  );
  const [isCascadeLoading, setIsCascadeLoading] = useState<boolean>(false);
  const [blastResult, setBlastResult] = useState<BlastRadiusResponse | null>(null);

  // 5 Signature Simulation Scenarios (Fact, Policy, Terminology, Claim Restriction, Guideline)
  const SIMULATION_PRESETS = [
    {
      id: 'FACT-AUR-PRC-01',
      type: 'PRICE',
      label: 'Aurelle Cloud Studio Subscription',
      oldVal: '₹499',
      newVal: '₹599',
      rationale: 'Spatial audio rendering infrastructure scaling & master commercial tier indexing across all models.'
    },
    {
      id: 'PIL-AUR-01',
      type: 'CLAIM',
      label: 'Aurelle Pulse Durability Claim Restriction',
      oldVal: '100% Unbreakable and Indestructible',
      newVal: 'Engineered with Grade 5 Aerospace Titanium',
      rationale: 'FTC Substantiation Doctrine prohibits representing consumer electronic hardware as completely indestructible.'
    },
    {
      id: 'GL-AUR-06',
      type: 'TYPOGRAPHY',
      label: 'Regional Font Policy Conflict',
      oldVal: 'Editorial Serif',
      newVal: 'Helvetica Neue',
      rationale: 'Regional European branch preference for grotesque sans-serif over master luxury serif.'
    },
    {
      id: 'PC-02',
      type: 'TERMINOLOGY',
      label: 'Autonomous Driving Terminology',
      oldVal: 'Hands-Free Autonomous Driving',
      newVal: 'Driver-Supervised Level 2 Highway Assist',
      rationale: 'NHTSA Standing General Order 2021-01 alignment; explicit driver attention and supervision mandated.'
    },
    {
      id: 'PC-01',
      type: 'CLAIM',
      label: 'Environmental Greenwashing Restriction',
      oldVal: '100% Eco-Friendly Zero-Carbon',
      newVal: '85% Certified Recycled Aluminum Lifecycle',
      rationale: 'FTC 16 CFR §260 & EU Directive 2024/825 enforcement prohibits unverified broad environmental benefit assertions.'
    }
  ];

  const handleSelectPreset = (presetId: string) => {
    const p = SIMULATION_PRESETS.find(x => x.id === presetId);
    if (!p) return;
    setSelectedPresetId(p.id);
    setRecordType(p.type);
    setRecordLabel(p.label);
    setOldValue(p.oldVal);
    setProposedValue(p.newVal);
    setRationale(p.rationale);
    setSimulationReport(null);
    setCommitMessage(null);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationReport(null);
    setCommitMessage(null);

    const token = localStorage.getItem('brandtrace_jwt_token');
    try {
      const res = await fetch('/api/simulator/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          brand_id: brandId || 'aurelle-tech',
          target_record_id: selectedPresetId,
          target_record_type: recordType,
          record_label: recordLabel,
          old_value: oldValue,
          proposed_value: proposedValue,
          change_rationale: rationale,
          proposed_by: proposedBy
        })
      });

      if (!res.ok) throw new Error('Simulation failed');
      const data = await res.json();
      setSimulationReport(data);
    } catch (e: any) {
      console.error(e);
      setCommitMessage({ status: 'error', text: e.message || 'Failed to simulate change' });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCommitChange = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!simulationReport) return;
    setIsCommitting(true);
    setCommitMessage(null);

    const token = localStorage.getItem('brandtrace_jwt_token');
    try {
      const res = await fetch('/api/simulator/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          brand_id: brandId || 'aurelle-tech',
          simulation_id: simulationReport.simulation_id,
          decision: decision,
          authorized_reviewer: proposedBy
        })
      });

      if (!res.ok) throw new Error('Commit failed');
      const data = await res.json();

      setCommitMessage({
        status: 'success',
        text: data.message
      });

      if (data.report) {
        setSimulationReport(data.report);
      }
    } catch (e: any) {
      console.error(e);
      setCommitMessage({ status: 'error', text: e.message || 'Failed to commit change' });
    } finally {
      setIsCommitting(false);
    }
  };

  const handleRunCascade = async () => {
    setIsCascadeLoading(true);
    setBlastResult(null);

    try {
      const res = await fetch('/api/blast-radius', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId || 'aurelle-tech',
          mutated_node_id: mutatedNodeId,
          mutation_type: mutationType,
          mutation_notes: notes
        })
      });

      if (!res.ok) throw new Error('Blast radius simulation failed');
      const data: BlastRadiusResponse = await res.json();
      setBlastResult(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsCascadeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Change Impact Simulator"
        description="Preview which content may be affected before changing approved brand knowledge."
        category="Governance"
        workspaceName={brandId === 'aurelle-tech' ? 'Aurelle Technologies Inc.' : (brandId || 'aurelle-tech')}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Governance' },
          { label: 'Change Impact Simulator', active: true }
        ]}
        helpContext={{
          summary: "The Digital Twin provides a safe virtual DAG sandbox. You can simulate mutations (such as increasing subscription price from ₹499 to ₹599) to calculate downstream blast radius, affected touchpoints, and unbudgeted reprint/ad liability without altering live production facts until authorized human approval.",
          terms: [
            { term: "Virtual DAG Sandbox", definition: "Isolated copy of the brand ontology graph where proposed changes are calculated without mutating production data." },
            { term: "Direct vs Indirect Dependency", definition: "Direct dependencies cite the specific fact ID; indirect dependencies reference the product or related terminology." },
            { term: "Policy Conflict Engine", definition: "Evaluates prospective mutations against active rules to catch contradictions, regulatory violations, and typography conflicts." },
            { term: "Commit Gate", definition: "Mandates authorized human role sign-off (BRAND_MANAGER or ADMIN) before updating approved facts and generating revision tasks." }
          ]
        }}
        primaryAction={{
          label: isSimulating ? "Simulating..." : "Run Blast Radius Simulation",
          onClick: handleRunSimulation,
          icon: <Flame className="w-3.5 h-3.5 text-amber-300" />
        }}
        secondaryAction={{
          label: "View Approval Center",
          onClick: () => onNavigate && onNavigate('approvals'),
          icon: <Lock className="w-3.5 h-3.5" />
        }}
      />

      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Brand Governance Digital Twin &amp; Simulation Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-3xl">
            Simulate prospective product fact, brand policy, terminology, claim, and guideline changes. Detect policy contradictions, predict before-and-after compliance impact, and calculate human review workload without altering live approved brand truth.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('change_simulator')}
            className={`px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 min-h-[36px] ${
              activeTab === 'change_simulator'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Digital Twin Simulator (Propose &amp; Commit)</span>
            <span className="sm:hidden">Digital Twin Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('policy_cascade')}
            className={`px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 min-h-[36px] ${
              activeTab === 'policy_cascade'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">DAG Mutation Blast Radius</span>
            <span className="sm:hidden">Mutation Blast Radius</span>
          </button>
        </div>
      </div>

      {activeTab === 'change_simulator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Propose Parameters (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Scenario Picker */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2 pb-1 border-b border-slate-100">
                Pre-Configured Enterprise Simulation Scenarios
              </label>
              <div className="space-y-1.5">
                {SIMULATION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      selectedPresetId === p.id
                        ? 'bg-slate-100 border-slate-300 ring-1 ring-slate-400 text-slate-900'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{p.label}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {p.oldVal} <span className="text-slate-900 font-bold">➔</span> {p.newVal}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                      {p.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Change Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <GitCompare className="w-4 h-4 text-slate-700" />
                Proposed Amendment Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-semibold block mb-1">Target Record ID</label>
                  <input
                    type="text"
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400 shadow-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 font-semibold block mb-1">Record Type</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-xs"
                  >
                    <option value="PRICE">PRODUCT PRICE</option>
                    <option value="SPECIFICATION">SPECIFICATION</option>
                    <option value="CLAIM">PROMOTIONAL CLAIM</option>
                    <option value="TERMINOLOGY">TERMINOLOGY RULE</option>
                    <option value="TYPOGRAPHY">BRAND TYPOGRAPHY</option>
                    <option value="GUIDELINE">BRAND GUIDELINE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Record Label</label>
                <input
                  type="text"
                  value={recordLabel}
                  onChange={(e) => setRecordLabel(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-xs"
                />
              </div>

              {/* Value Diff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Current Approved Value</label>
                  <input
                    type="text"
                    value={oldValue}
                    onChange={(e) => setOldValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-900 font-bold block mb-1">Proposed Value</label>
                  <input
                    type="text"
                    value={proposedValue}
                    onChange={(e) => setProposedValue(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900 shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Governance Rationale</label>
                <textarea
                  rows={2}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 resize-none focus:outline-none focus:border-slate-400 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Proposed By (Authorized Actor)</label>
                <input
                  type="text"
                  value={proposedBy}
                  onChange={(e) => setProposedBy(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-xs"
                />
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Simulating Digital Twin...
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    Run Digital Twin Simulation
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Visual Impact Report & Twin Analytics (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {commitMessage && (
              <div className={`p-4 rounded-xl border text-xs flex items-center gap-2 shadow-xs ${
                commitMessage.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {commitMessage.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                )}
                <span className="font-medium">{commitMessage.text}</span>
              </div>
            )}

            {simulationReport ? (
              <div className="space-y-4">
                {/* Visual Demarcation Watermark */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-amber-900 uppercase tracking-wider text-[11px]">
                      Digital Twin Simulation Preview — Live Brand Truth Is Unaltered
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-white text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold">
                    STATUS: {simulationReport.status}
                  </span>
                </div>

                {/* Telemetry Bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {simulationReport.simulation_id}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{simulationReport.record_label}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Proposed: <span className="text-rose-600 line-through font-mono">{simulationReport.old_value}</span>{' '}
                        ➔ <span className="text-emerald-700 font-bold font-mono">{simulationReport.proposed_value}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-slate-900">
                        {simulationReport.overall_risk_score.toFixed(0)}/100
                      </div>
                      <div className="text-[10px] uppercase font-semibold text-slate-500">Risk Tier: {simulationReport.risk_tier}</div>
                    </div>
                  </div>

                  {/* Dependency Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {simulationReport.direct_dependencies_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-600">
                        Direct Graph Dependencies
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Connected DAG Assets</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {simulationReport.indirect_dependencies_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-600">
                        Inferred Lexical Mentions
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Found via Content Scan</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="text-lg font-bold font-mono text-slate-900">
                        {simulationReport.outdated_campaigns_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-600">
                        Outdated Campaigns
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Requires Revision Task</div>
                    </div>
                  </div>
                </div>

                {/* POLICY CONFLICT DETECTION CARD */}
                {simulationReport.policy_conflicts && simulationReport.policy_conflicts.length > 0 && (
                  <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                          Policy Conflict Detection ({simulationReport.policy_conflicts.length} Contradiction Detected)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-white text-rose-800 px-2 py-0.5 rounded border border-rose-300">
                        REQUIRES RESOLUTION
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {simulationReport.policy_conflicts.map((c: any, i: number) => (
                        <div key={i} className="bg-white p-3.5 rounded-lg border border-rose-200 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{c.title}</span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                              {c.conflict_type}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {c.explanation}
                          </p>
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] text-slate-700">
                            <strong className="text-slate-900">Recommended Resolution:</strong> {c.recommended_resolution}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BEFORE-AND-AFTER INSPECTION RESULTS */}
                {simulationReport.before_after_summary && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-slate-700" />
                      Before-and-After Inspection Impact Analysis
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                        <div className="text-xs text-slate-500 mb-1">Baseline Score</div>
                        <div className="text-xl font-bold font-mono text-slate-900">
                          {simulationReport.before_after_summary.baseline_compliance_score}%
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">Pre-amendment state</div>
                      </div>

                      <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 text-center">
                        <div className="text-xs text-rose-700 font-semibold mb-1">If Left Unaddressed</div>
                        <div className="text-xl font-bold font-mono text-rose-700">
                          {simulationReport.before_after_summary.simulated_score_if_unaddressed}%
                        </div>
                        <div className="text-[10px] text-rose-600 mt-1">Severe compliance drop</div>
                      </div>

                      <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200 text-center">
                        <div className="text-xs text-emerald-800 font-semibold mb-1">After Revision Sign-off</div>
                        <div className="text-xl font-bold font-mono text-emerald-800">
                          {simulationReport.before_after_summary.simulated_score_if_remediated}%
                        </div>
                        <div className="text-[10px] text-emerald-600 mt-1">Remediated release grade</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ESTIMATED REVIEW WORKLOAD & DECISIONS */}
                {simulationReport.workload_estimate && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-700" />
                        Estimated Governance Review Workload
                      </h4>
                      <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ~{simulationReport.workload_estimate.estimated_review_hours}h Review Time
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="text-[11px] text-slate-500 mb-1">Human Decisions Required</div>
                        <div className="text-lg font-bold font-mono text-slate-900">
                          {simulationReport.workload_estimate.required_human_decisions_count} Decision Sign-offs
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Touchpoints + policy conflicts</div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="text-[11px] text-slate-500 mb-1">Projected Lead Time</div>
                        <div className="text-lg font-bold font-mono text-slate-900">
                          ~{simulationReport.workload_estimate.estimated_lead_time_days} Working Days
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Across departmental routing queues</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Affected Touchpoints Table */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Affected Brand Touchpoints ({simulationReport.affected_touchpoints.length})
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Previewing Remediations
                    </span>
                  </div>

                  <div className="space-y-3">
                    {simulationReport.affected_touchpoints.map((t: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{t.asset_name}</span>
                            <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                              {t.asset_id}
                            </span>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              SIMULATED PREVIEW
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {t.exposure_tier}
                          </span>
                        </div>

                        {/* Content Before & After Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg space-y-1">
                            <div className="text-[10px] font-bold uppercase text-rose-700">Current Copy (Outdated)</div>
                            <div className="text-slate-500 font-mono text-xs line-through">
                              {t.old_content_preview}
                            </div>
                          </div>
                          <div className="bg-emerald-50/50 border border-emerald-200 p-2.5 rounded-lg space-y-1">
                            <div className="text-[10px] font-bold uppercase text-emerald-800">Remediated Copy (Pending Sign-off)</div>
                            <div className="text-emerald-950 font-mono text-xs font-semibold">
                              {t.remediated_content_preview}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                          <span><strong>Action:</strong> {t.required_human_action}</span>
                          <span className="font-mono text-[10px] text-slate-500">Campaign: {t.campaign_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Authorized Human Approval / Commit Gate */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-800" />
                      Authorized Human Commit Gate
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Formal human authorization seals this amendment into MongoDB Atlas, updates the DAG, and spawns revision tasks.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => handleCommitChange('REJECTED')}
                      disabled={isCommitting || simulationReport.status !== 'PROPOSED_PENDING_APPROVAL'}
                      className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 disabled:opacity-40 cursor-pointer shadow-xs min-h-[38px]"
                    >
                      Reject Proposal
                    </button>
                    <button
                      onClick={() => handleCommitChange('APPROVED')}
                      disabled={isCommitting || simulationReport.status !== 'PROPOSED_PENDING_APPROVAL'}
                      className="flex-1 sm:flex-none justify-center px-5 py-2.5 sm:py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 disabled:opacity-40 cursor-pointer shadow-xs min-h-[38px]"
                    >
                      {isCommitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sealing Change...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Authorize &amp; Commit to Graph
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center mx-auto text-slate-700">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  No Digital Twin Simulation Active
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Select one of the 5 benchmark scenarios or configure custom parameters on the left to simulate cross-channel blast radius, policy conflicts, and workload estimates.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Policy Mutation Cascade Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Network className="w-4 h-4 text-slate-700" />
              DAG Policy Cascade Configuration
            </h3>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Target Policy / Claim Node</label>
              <select
                value={mutatedNodeId}
                onChange={(e) => setMutatedNodeId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400 shadow-xs"
              >
                <option value="PC-01">PC-01: FTC Greenwashing Superlative Ban</option>
                <option value="PC-02">PC-02: NHTSA Automated Driving Hands-Free Directive</option>
                <option value="FACT-AUR-PRC-01">FACT-AUR-PRC-01: Aurelle Cloud Studio Price Point</option>
                <option value="GL-AUR-01">GL-AUR-01: Aurelle Logo Margin Safe-Zone (20px)</option>
                <option value="AC-01">AC-01: EPA 520 Miles Range Certification</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Mutation Type</label>
              <select
                value={mutationType}
                onChange={(e) => setMutationType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-xs"
              >
                <option value="REGULATORY_AMENDMENT">REGULATORY_AMENDMENT</option>
                <option value="PRICING_POLICY_CHANGE">PRICING_POLICY_CHANGE</option>
                <option value="SPECIFICATION_UPDATE">SPECIFICATION_UPDATE</option>
                <option value="BRAND_GUIDELINE_REVISION">BRAND_GUIDELINE_REVISION</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Regulatory Context / Operational Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 resize-none focus:outline-none focus:border-slate-400 shadow-xs"
              />
            </div>

            <button
              onClick={handleRunCascade}
              disabled={isCascadeLoading}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all disabled:opacity-50 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isCascadeLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Calculating DAG Cascade...
                </>
              ) : (
                <>
                  <Network className="w-3.5 h-3.5" />
                  Traverse Blast Radius
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {blastResult ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {blastResult.mutated_node_id}
                    </span>
                    <div className="text-xs text-slate-500 mt-1">
                      Type: <strong>{blastResult.mutation_type}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-slate-900">
                      {blastResult.overall_risk_score.toFixed(0)}/100
                    </div>
                    <div className="text-[10px] font-semibold uppercase text-slate-500">
                      Tier: {blastResult.impact_tier}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 mb-0.5">Affected Assets Count</div>
                    <div className="text-xl font-bold font-mono text-slate-900">
                      {blastResult.total_affected_assets}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500 mb-0.5">Affected Campaigns Count</div>
                    <div className="text-xl font-bold font-mono text-slate-900">
                      {blastResult.total_affected_campaigns}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Downstream Graph Targets
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {blastResult.affected_targets.map((tgt: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{tgt.asset_name}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            Path: {tgt.traversal_path?.join(' ➔ ') || tgt.asset_id}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                          {tgt.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center mx-auto text-slate-700">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Select a Policy to Simulate Graph Traversal
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Click 'Traverse Blast Radius' to trace direct and indirect downstream impacts across all enterprise touchpoints.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow Banner: Next Step in Governance Journey */}
      <WorkflowBanner
        currentStage="Change Impact Simulator"
        nextStageTitle="Approval Center (Human Sign-off)"
        nextStageDescription="Review findings, authorize revision tasks created by committed simulations, and record decisions with full reviewer attribution."
        nextStageActionLabel="Go to Approval Center"
        onNavigateNext={() => onNavigate && onNavigate('approvals')}
        governanceHint="Human review is non-negotiable: content is never automatically republished without explicit reviewer approval."
      />
    </div>
  );
};
