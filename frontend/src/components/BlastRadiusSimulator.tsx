import React, { useState } from 'react';
import { 
  Flame, ArrowRight, Network, Layers, GitCompare, ShieldAlert, 
  CheckCircle2, XCircle, AlertTriangle, FileText, ChevronRight, Lock
} from 'lucide-react';
import { BlastRadiusResponse } from '../types';

interface BlastRadiusSimulatorProps {
  brandId: string;
}

export const BlastRadiusSimulator: React.FC<BlastRadiusSimulatorProps> = ({ brandId }) => {
  const [activeTab, setActiveTab] = useState<'change_simulator' | 'policy_cascade'>('change_simulator');

  // Change Impact Simulation State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('FACT-PRC-01');
  const [recordType, setRecordType] = useState<string>('PRICE');
  const [recordLabel, setRecordLabel] = useState<string>('Apex Connect Telematics Monthly Subscription');
  const [oldValue, setOldValue] = useState<string>('₹499');
  const [proposedValue, setProposedValue] = useState<string>('₹599');
  const [rationale, setRationale] = useState<string>('Global 5G bandwidth upgrade & satellite fallback network incorporation.');
  const [proposedBy, setProposedBy] = useState<string>('Commercial Operations Lead');

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

  // Quick Preset Scenarios for Change Impact Simulation
  const SIMULATION_PRESETS = [
    {
      id: 'FACT-PRC-01',
      type: 'PRICE',
      label: 'Apex Connect Telematics Monthly Subscription',
      oldVal: '₹499',
      newVal: '₹599',
      rationale: 'Global 5G bandwidth upgrade & satellite fallback network incorporation across all models.'
    },
    {
      id: 'FACT-SPEC-01',
      type: 'SPECIFICATION',
      label: 'Supercharger Peak Inverter Output',
      oldVal: '350kW',
      newVal: '400kW',
      rationale: 'Thermal management upgrade in Gen-4 liquid-cooled charging architecture.'
    },
    {
      id: 'AC-01',
      type: 'CLAIM',
      label: 'EPA-Estimated Driving Range',
      oldVal: '520 miles',
      newVal: '540 miles',
      rationale: 'EPA recertification with Gen-3 silicon-carbide motor inverters (Cert #EV-APX-982-R1).'
    },
    {
      id: 'PC-01',
      type: 'CLAIM',
      label: 'Environmental Sustainability Positioning',
      oldVal: '100% Eco-Friendly Zero-Carbon',
      newVal: 'Certified Carbon-Neutral Production Lifecycle',
      rationale: 'FTC 16 CFR §260 & EU Directive 2024/825 enforcement prohibits unverified broad green claims.'
    },
    {
      id: 'PC-02',
      type: 'TERMINOLOGY',
      label: 'Driver Assistance Terminology',
      oldVal: 'Hands-Free Autonomous Driving',
      newVal: 'Driver-Supervised Level 2 Highway Assist',
      rationale: 'NHTSA Standing General Order 2021-01 alignment; explicit driver attention mandated.'
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
          brand_id: brandId,
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
          brand_id: brandId,
          simulation_id: simulationReport.simulation_id,
          decision: decision,
          authorized_reviewer: 'Chief Brand Governance Officer'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Commit failed');
      }

      const data = await res.json();
      setSimulationReport(data.report);
      setCommitMessage({
        status: 'success',
        text: `Change ${decision.toLowerCase()}! Cryptographic release seal: ${data.report.audit_hash || 'BT-SEAL-VERIFIED'}`
      });
    } catch (e: any) {
      console.error(e);
      setCommitMessage({ status: 'error', text: e.message || 'Commit decision failed' });
    } finally {
      setIsCommitting(false);
    }
  };

  const handlePolicySimulate = async () => {
    setIsCascadeLoading(true);
    setBlastResult(null);

    try {
      const res = await fetch('/api/blast-radius', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          mutated_node_id: mutatedNodeId,
          mutation_type: mutationType,
          mutation_notes: notes
        })
      });
      if (!res.ok) throw new Error('Simulation failed');
      const data: BlastRadiusResponse = await res.json();
      setBlastResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCascadeLoading(false);
    }
  };

  const POLICY_OPTIONS = [
    { id: 'PC-01', label: 'PC-01: Zero-Carbon / 100% Eco-Friendly (FTC & EU Green Claims)' },
    { id: 'AC-01', label: 'AC-01: 520 miles EPA-estimated range (Certificate #EV-APX-982)' },
    { id: 'PC-02', label: 'PC-02: Fully Autonomous / Hands-Free Driving (NHTSA SGO 2021-01)' },
    { id: 'TM-01', label: 'TM-01: QuantumCell™ Trademark Guideline' },
    { id: 'REG-01', label: 'REG-01: FTC Green Guides 16 CFR §260' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Change Impact Simulator &amp; Blast Radius Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Propose amendments to product prices, technical specifications, claims, and guidelines. Traverses the Brand Dependency Intelligence Graph to calculate blast radius and enforce human commit gates.
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
            Change Impact Simulator (Propose &amp; Commit)
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
            Policy Mutation Cascade
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
                Quick Benchmark Scenarios
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
                Proposed Amendment Specification
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
                    <option value="PRICE">PRICE</option>
                    <option value="SPECIFICATION">SPECIFICATION</option>
                    <option value="CLAIM">CLAIM</option>
                    <option value="TERMINOLOGY">TERMINOLOGY</option>
                    <option value="GUIDELINE">GUIDELINE</option>
                    <option value="LOGO">LOGO</option>
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
                  <label className="text-xs text-emerald-400 font-medium block mb-1">Proposed New Value</label>
                  <input
                    type="text"
                    value={proposedValue}
                    onChange={(e) => setProposedValue(e.target.value)}
                    className="w-full bg-emerald-950/20 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Change Rationale</label>
                <textarea
                  rows={2}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Proposed By</label>
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
                    Simulating Graph Traversal...
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    Simulate Change Impact
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Visual Impact Report (7 Cols) */}
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
              <div className="space-y-4">
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
                        Status: <strong className="text-amber-300 font-mono">{simulationReport.status}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-black font-mono text-red-400">
                          {simulationReport.overall_risk_score.toFixed(0)}/100
                        </div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">Risk Tier: {simulationReport.risk_tier}</div>
                      </div>
                    </div>
                  </div>

                  {/* Dependency Breakdown Metrics */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-lg font-bold font-mono text-cyan-400">
                        {simulationReport.direct_dependencies_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Direct Graph Dependencies
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Explicit DAG Edges</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-lg font-bold font-mono text-purple-400">
                        {simulationReport.indirect_dependencies_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Inferred Lexical Mentions
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Discovered via Content AST</div>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <div className="text-lg font-bold font-mono text-amber-400">
                        {simulationReport.outdated_campaigns_count}
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Outdated Campaigns
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Requires Revision Flighting</div>
                    </div>
                  </div>
                </div>

                {/* Affected Touchpoints Table */}
                <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Affected Brand Touchpoints &amp; Human Actions Required
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {simulationReport.affected_touchpoints.length} Touchpoint(s)
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
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              t.relationship_kind === 'DIRECT_GRAPH_DEPENDENCY'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            }`}>
                              {t.relationship_kind}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {t.exposure_tier}
                          </span>
                        </div>

                        {/* Content Before & After Remediated Preview */}
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

                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 font-medium">Required Action: </span>
                            {t.required_human_action}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manager Commitment Decision Gate */}
                <div className="bg-[#0B0F19] border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Authorized Manager Approval Gate (Zero Silent Overwrites)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded">
                      Role: BRAND_MANAGER or ADMIN
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Live assets will NOT be modified until an authorized manager executes explicit sign-off. Committing will promote the approved version to active in the Brand Knowledge Graph and register tamper-evident revision tasks.
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleCommitChange('APPROVED')}
                      disabled={isCommitting || simulationReport.status === 'APPROVED_ACTIVE'}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {simulationReport.status === 'APPROVED_ACTIVE'
                        ? 'Amendment Approved & Active in Graph'
                        : 'Approve & Commit to Knowledge Graph'}
                    </button>
                    <button
                      onClick={() => handleCommitChange('REJECTED')}
                      disabled={isCommitting || simulationReport.status === 'REJECTED'}
                      className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Revision
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
                <GitCompare className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-white">No Simulation Loaded</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a target record or benchmark scenario on the left and click <strong>Simulate Change Impact</strong> to execute live graph traversal.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Policy Mutation Blast Radius Mode */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Simulation Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Policy Mutation Parameter
              </h3>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Target Policy / Claim Node</label>
                <select
                  value={mutatedNodeId}
                  onChange={(e) => setMutatedNodeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {POLICY_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Mutation Type</label>
                <select
                  value={mutationType}
                  onChange={(e) => setMutationType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="REGULATORY_AMENDMENT">Regulatory Amendment (FTC / EU / NHTSA)</option>
                  <option value="POLICY_REVISION">Brand Guideline Revocation</option>
                  <option value="EXPIRATION">Claim Evidence Expiration</option>
                  <option value="RESTRICTION_TIGHTENING">Channel Distribution Ban</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Amendment Detail / Context</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none font-mono"
                />
              </div>

              <button
                onClick={handlePolicySimulate}
                disabled={isCascadeLoading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                {isCascadeLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traversing Graph Topologically...
                  </>
                ) : (
                  <>
                    <Flame className="w-3.5 h-3.5" />
                    Calculate Cascading Blast Radius
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Cascading Results (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {blastResult ? (
              <div className="space-y-4">
                {/* Blast Radius Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <div className="text-2xl font-black text-red-400 font-mono">
                      {blastResult.total_affected_assets}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      Directly Impacted Assets
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {blastResult.affected_campaigns.length}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      Campaigns at Risk
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
                    <div className="text-2xl font-black text-cyan-400 font-mono">
                      ${((blastResult.total_affected_assets * 28500) / 1000).toFixed(0)}k
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                      Estimated Media Flight at Risk
                    </div>
                  </div>
                </div>

                {/* Immediate Action Notice */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-red-400">
                    <ShieldAlert className="w-4 h-4" />
                    Topological Blast Radius Traversal Verified
                  </div>
                  <p className="text-slate-300">
                    Traversed DAG depth of 3 hops. All downstream content assets referencing node{' '}
                    <span className="font-mono text-cyan-300">{blastResult.mutated_node_id}</span> are flagged as{' '}
                    <span className="font-bold text-red-300">REVISION_REQUIRED</span>.
                  </p>
                </div>

                {/* Impacted Assets List */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Downstream Content Dependencies</span>
                    <span className="text-slate-400 font-mono font-normal">
                      {blastResult.impacted_assets.length} assets
                    </span>
                  </h4>

                  <div className="space-y-2">
                    {blastResult.impacted_assets.map((asset, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{asset.asset_title}</span>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {asset.asset_id}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400">{asset.channel}</span>
                          </div>
                          <p className="text-slate-400 text-[11px] truncate max-w-md">{asset.content_snippet}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold block mb-1">
                            {asset.exposure_level}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end font-mono">
                            Hops: {asset.dependency_path.length - 1}
                            <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <Network className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-white">No Policy Simulation Active</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select a policy on the left and run simulation to trace downstream marketing dependencies across print, digital, and social channels.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
