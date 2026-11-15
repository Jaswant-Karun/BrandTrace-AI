import React, { useState } from 'react';
import { 
  Flame, ArrowRight, Network, Layers, GitCompare, ShieldAlert, 
  CheckCircle2, XCircle, AlertTriangle, Lock, Sparkles, Clock, Users, Shield, Check
} from 'lucide-react';
import { BlastRadiusResponse } from '../types';

interface BlastRadiusSimulatorProps {
  brandId: string;
}

export const BlastRadiusSimulator: React.FC<BlastRadiusSimulatorProps> = ({ brandId }) => {
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

    try {
      const res = await fetch('/api/simulator/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    try {
      const res = await fetch('/api/simulator/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      {/* Top Banner & Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Brand Governance Digital Twin &amp; Simulation Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Simulate prospective product fact, brand policy, terminology, claim, and guideline changes. Detect policy contradictions, predict before-and-after compliance impact, and calculate human review workload without altering live approved brand truth.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('change_simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'change_simulator'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Digital Twin Simulator (Propose &amp; Commit)
          </button>
          <button
            onClick={() => setActiveTab('policy_cascade')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'policy_cascade'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            DAG Mutation Blast Radius
          </button>
        </div>
      </div>

      {activeTab === 'change_simulator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Propose Parameters (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Quick Scenario Picker */}
            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-4 shadow-xl">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                5 Differentiating Hackathon Simulation Scenarios
              </label>
              <div className="space-y-1.5">
                {SIMULATION_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      selectedPresetId === p.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white">{p.label}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {p.oldVal} <span className="text-amber-400 font-bold">➔</span> {p.newVal}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-slate-900 px-2 py-0.5 rounded text-slate-400">
                      {p.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Change Form */}
            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-amber-400" />
                Proposed Amendment Parameters
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Target Record ID</label>
                  <input
                    type="text"
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1">Record Type</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
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
                <label className="text-xs text-slate-400 font-medium block mb-1">Record Label</label>
                <input
                  type="text"
                  value={recordLabel}
                  onChange={(e) => setRecordLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Value Diff */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-red-400 font-medium block mb-1">Current Approved Value</label>
                  <input
                    type="text"
                    value={oldValue}
                    onChange={(e) => setOldValue(e.target.value)}
                    className="w-full bg-red-950/20 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-emerald-400 font-medium block mb-1">Proposed Value</label>
                  <input
                    type="text"
                    value={proposedValue}
                    onChange={(e) => setProposedValue(e.target.value)}
                    className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Governance Rationale</label>
                <textarea
                  rows={2}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Proposed By (Authorized Actor)</label>
                <input
                  type="text"
                  value={proposedBy}
                  onChange={(e) => setProposedBy(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
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
              <div className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
                commitMessage.status === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}>
                {commitMessage.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <span>{commitMessage.text}</span>
              </div>
            )}

            {simulationReport ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Visual Demarcation Watermark */}
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-bold text-amber-200 uppercase tracking-wider text-[11px]">
                      Digital Twin Simulation Preview — Live Brand Truth Is Unaltered
                    </span>
                  </div>
                  <span className="font-mono text-[10px] bg-amber-950/60 text-amber-300 px-2 py-0.5 rounded border border-amber-800/40">
                    STATUS: {simulationReport.status}
                  </span>
                </div>

                {/* Telemetry Bar */}
                <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {simulationReport.simulation_id}
                        </span>
                        <span className="text-xs font-bold text-white">{simulationReport.record_label}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Proposed: <span className="text-red-400 line-through font-mono">{simulationReport.old_value}</span>{' '}
                        ➔ <span className="text-emerald-400 font-bold font-mono">{simulationReport.proposed_value}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-mono text-red-400">
                        {simulationReport.overall_risk_score.toFixed(0)}/100
                      </div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Risk Tier: {simulationReport.risk_tier}</div>
                    </div>
                  </div>

                  {/* Dependency Breakdown */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-lg font-bold font-mono text-cyan-400">
                        {simulationReport.direct_dependencies_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Direct Graph Dependencies
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Connected DAG Assets</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-lg font-bold font-mono text-purple-400">
                        {simulationReport.indirect_dependencies_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Inferred Lexical Mentions
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Found via Content Scan</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-lg font-bold font-mono text-amber-400">
                        {simulationReport.outdated_campaigns_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Outdated Campaigns
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Requires Revision Task</div>
                    </div>
                  </div>
                </div>

                {/* POLICY CONFLICT DETECTION CARD */}
                {simulationReport.policy_conflicts && simulationReport.policy_conflicts.length > 0 && (
                  <div className="bg-red-950/20 border border-red-500/40 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider">
                          Policy Conflict Detection ({simulationReport.policy_conflicts.length} Contradiction Detected)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30">
                        REQUIRES RESOLUTION
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {simulationReport.policy_conflicts.map((c: any, i: number) => (
                        <div key={i} className="bg-slate-950/80 p-3 rounded-xl border border-red-900/50 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{c.title}</span>
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800/40">
                              {c.conflict_type}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            {c.explanation}
                          </p>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                            <strong className="text-amber-400">Recommended Resolution:</strong> {c.recommended_resolution}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BEFORE-AND-AFTER INSPECTION RESULTS */}
                {simulationReport.before_after_summary && (
                  <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      Before-and-After Inspection Impact Analysis
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-400 mb-1">Baseline Score</div>
                        <div className="text-xl font-bold font-mono text-emerald-400">
                          {simulationReport.before_after_summary.baseline_compliance_score}%
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">Pre-amendment state</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-red-900/40 text-center">
                        <div className="text-xs text-red-400 mb-1">If Left Unaddressed</div>
                        <div className="text-xl font-bold font-mono text-red-400">
                          {simulationReport.before_after_summary.simulated_score_if_unaddressed}%
                        </div>
                        <div className="text-[10px] text-red-400/80 mt-1">Severe compliance drop</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40 text-center">
                        <div className="text-xs text-emerald-400 mb-1">After Revision Sign-off</div>
                        <div className="text-xl font-bold font-mono text-cyan-300">
                          {simulationReport.before_after_summary.simulated_score_if_remediated}%
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">Remediated release grade</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ESTIMATED REVIEW WORKLOAD & DECISIONS */}
                {simulationReport.workload_estimate && (
                  <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        Estimated Governance Review Workload
                      </h4>
                      <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                        ~{simulationReport.workload_estimate.estimated_review_hours}h Review Time
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-1">Human Decisions Required</div>
                        <div className="text-lg font-bold font-mono text-white">
                          {simulationReport.workload_estimate.required_human_decisions_count} Decision Sign-offs
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Touchpoints + policy conflicts</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[11px] text-slate-400 mb-1">Projected Lead Time</div>
                        <div className="text-lg font-bold font-mono text-white">
                          ~{simulationReport.workload_estimate.estimated_lead_time_days} Working Days
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Across departmental routing queues</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Affected Touchpoints Table */}
                <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Affected Brand Touchpoints ({simulationReport.affected_touchpoints.length})
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Previewing Remediations
                    </span>
                  </div>

                  <div className="space-y-3">
                    {simulationReport.affected_touchpoints.map((t: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{t.asset_name}</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                              {t.asset_id}
                            </span>
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                              SIMULATED PREVIEW
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {t.exposure_tier}
                          </span>
                        </div>

                        {/* Content Before & After Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-red-950/10 border border-red-500/20 p-2.5 rounded-lg space-y-1">
                            <div className="text-[10px] font-bold uppercase text-red-400">Current Copy (Outdated)</div>
                            <div className="text-slate-300 font-mono text-xs line-through opacity-80">
                              {t.old_content_preview}
                            </div>
                          </div>
                          <div className="bg-emerald-950/10 border border-emerald-500/20 p-2.5 rounded-lg space-y-1">
                            <div className="text-[10px] font-bold uppercase text-emerald-400">Remediated Copy (Pending Sign-off)</div>
                            <div className="text-slate-200 font-mono text-xs">
                              {t.remediated_content_preview}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 flex items-center justify-between">
                          <span><strong>Action:</strong> {t.required_human_action}</span>
                          <span className="font-mono text-[10px] text-cyan-400">Campaign: {t.campaign_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Authorized Human Approval / Commit Gate */}
                <div className="bg-[#0B0F19] border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      Authorized Human Commit Gate
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Formal human authorization seals this amendment into MongoDB Atlas, updates the DAG, and spawns revision tasks.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCommitChange('REJECTED')}
                      disabled={isCommitting || simulationReport.status !== 'PROPOSED_PENDING_APPROVAL'}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-700 disabled:opacity-40"
                    >
                      Reject Proposal
                    </button>
                    <button
                      onClick={() => handleCommitChange('APPROVED')}
                      disabled={isCommitting || simulationReport.status !== 'PROPOSED_PENDING_APPROVAL'}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-40"
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
              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-12 text-center shadow-xl space-y-3">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <Flame className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  No Digital Twin Simulation Active
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Select one of the 5 benchmark scenarios or configure custom parameters on the left to simulate cross-channel blast radius, policy conflicts, and workload estimates.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Policy Mutation Cascade Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Network className="w-4 h-4 text-amber-400" />
              DAG Policy Cascade Configuration
            </h3>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Target Policy / Claim Node</label>
              <select
                value={mutatedNodeId}
                onChange={(e) => setMutatedNodeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              >
                <option value="PC-01">PC-01: FTC Greenwashing Superlative Ban</option>
                <option value="PC-02">PC-02: NHTSA Automated Driving Hands-Free Directive</option>
                <option value="FACT-AUR-PRC-01">FACT-AUR-PRC-01: Aurelle Cloud Studio Price Point</option>
                <option value="GL-AUR-01">GL-AUR-01: Aurelle Logo Margin Safe-Zone (20px)</option>
                <option value="AC-01">AC-01: EPA 520 Miles Range Certification</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Mutation Type</label>
              <select
                value={mutationType}
                onChange={(e) => setMutationType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="REGULATORY_AMENDMENT">REGULATORY_AMENDMENT</option>
                <option value="PRICING_POLICY_CHANGE">PRICING_POLICY_CHANGE</option>
                <option value="SPECIFICATION_UPDATE">SPECIFICATION_UPDATE</option>
                <option value="BRAND_GUIDELINE_REVISION">BRAND_GUIDELINE_REVISION</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Regulatory Context / Operational Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white resize-none"
              />
            </div>

            <button
              onClick={handleRunCascade}
              disabled={isCascadeLoading}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
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
              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {blastResult.mutated_node_id}
                    </span>
                    <div className="text-xs text-slate-400 mt-1">
                      Type: <strong>{blastResult.mutation_type}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-red-400">
                      {blastResult.overall_risk_score.toFixed(0)}/100
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Tier: {blastResult.impact_tier}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 mb-0.5">Affected Assets Count</div>
                    <div className="text-xl font-bold font-mono text-cyan-400">
                      {blastResult.total_affected_assets}
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="text-[11px] text-slate-400 mb-0.5">Affected Campaigns Count</div>
                    <div className="text-xl font-bold font-mono text-amber-400">
                      {blastResult.total_affected_campaigns}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Downstream Graph Targets
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {blastResult.affected_targets.map((tgt: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white">{tgt.asset_name}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            Path: {tgt.traversal_path?.join(' ➔ ') || tgt.asset_id}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase bg-red-950/60 text-red-300 px-2 py-0.5 rounded border border-red-800/40">
                          {tgt.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-12 text-center shadow-xl space-y-3">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Select a Policy to Simulate Graph Traversal
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click 'Traverse Blast Radius' to trace direct and indirect downstream impacts across all enterprise touchpoints.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
