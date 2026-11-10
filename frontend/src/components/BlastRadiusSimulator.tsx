import React, { useState } from 'react';
import { Flame, ArrowRight, Network, Layers } from 'lucide-react';
import { BlastRadiusResponse } from '../types';

interface BlastRadiusSimulatorProps {
  brandId: string;
}

export const BlastRadiusSimulator: React.FC<BlastRadiusSimulatorProps> = ({ brandId }) => {
  const [mutatedNodeId, setMutatedNodeId] = useState<string>('PC-01');
  const [mutationType, setMutationType] = useState<string>('REGULATORY_AMENDMENT');
  const [notes, setNotes] = useState<string>(
    'EU Directive 2024/825 tightens green claims: blanket zero-carbon references banned without certified whole-lifecycle verification.'
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [blastResult, setBlastResult] = useState<BlastRadiusResponse | null>(null);

  const POLICY_OPTIONS = [
    { id: 'PC-01', label: 'PC-01: Zero-Carbon / 100% Eco-Friendly (FTC & EU Green Claims)' },
    { id: 'AC-01', label: 'AC-01: 520 miles EPA-estimated range (Certificate #EV-APX-982)' },
    { id: 'PC-02', label: 'PC-02: Fully Autonomous / Hands-Free Driving (NHTSA SGO 2021-01)' },
    { id: 'TM-01', label: 'TM-01: QuantumCell™ Trademark Guideline' },
    { id: 'REG-01', label: 'REG-01: FTC Green Guides 16 CFR §260' },
  ];

  const handleSimulate = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Omnichannel Cascading Blast Radius Simulator
          </h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl">
          Simulate what happens when a statutory regulation changes, a claim citation expires, or brand guidelines are revised.
          BRANDTRACE traverses the Brand Knowledge Graph to locate every dependent marketing asset across print, digital, and social channels.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulation Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              Policy Mutation Parameter
            </h3>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Target Policy / Claim Node</label>
              <select
                value={mutatedNodeId}
                onChange={(e) => setMutatedNodeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
              >
                {POLICY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Mutation Event Type</label>
              <select
                value={mutationType}
                onChange={(e) => setMutationType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500 font-medium"
              >
                <option value="REGULATORY_AMENDMENT">Regulatory Amendment (New Statutory Guideline)</option>
                <option value="CLAIM_REVOCATION">Claim Revocation (Expired Third-Party Lab Certificate)</option>
                <option value="LEGAL_SANCTION">Regulatory Injunction / Legal Notice</option>
                <option value="TONE_RESTRICTION">Brand Identity / Tone Constraint Update</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Regulatory Context / Rationale</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500 font-mono resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleSimulate}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Traversing Knowledge Graph Dependencies...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 fill-slate-950" />
                  Simulate Cascading Blast Radius
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Simulation Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!blastResult && !isLoading && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                <Network className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Ready to Simulate</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Select a target node and click <strong>Simulate Cascading Blast Radius</strong> to calculate downstream exposure paths.
              </p>
            </div>
          )}

          {blastResult && (
            <div className="space-y-4">
              {/* Summary Impact Banner */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                      Impact Tier: {blastResult.impact_tier}
                    </span>
                    <span className="text-xs font-mono text-slate-400">Node: {blastResult.mutated_node_id}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{blastResult.overall_risk_score}</span>
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Exposure Score</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-4">
                  {blastResult.summary_rationale}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-white">{blastResult.total_affected_assets}</div>
                    <div className="text-[11px] text-slate-400">Downstream Assets Affected</div>
                  </div>
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="text-lg font-bold text-white">{blastResult.total_affected_campaigns}</div>
                    <div className="text-[11px] text-slate-400">Active Campaigns Impacted</div>
                  </div>
                </div>
              </div>

              {/* Affected Touchpoints Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Impacted Release Touchpoints ({blastResult.affected_targets.length})
                </h4>

                {blastResult.affected_targets.map((target, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{target.asset_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">({target.asset_id})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-500/20 text-red-300 border border-red-500/30">
                        {target.exposure_level} EXPOSURE
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <div>
                        <strong>Campaign:</strong> <span className="text-slate-200">{target.campaign_name}</span>
                      </div>
                      <div>
                        <strong>Channel:</strong> <span className="text-slate-200">{target.channel}</span>
                      </div>
                      <div>
                        <strong>Status:</strong>{' '}
                        <span className="text-emerald-400 font-semibold">{target.current_status}</span>
                      </div>
                    </div>

                    {/* Traversal Path */}
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono flex items-center gap-1.5 overflow-x-auto text-slate-300">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">DAG Path:</span>
                      {target.traversal_path.map((node, i) => (
                        <React.Fragment key={i}>
                          <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-brand-300">
                            {node}
                          </span>
                          {i < target.traversal_path.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Required Remediation */}
                    <div className="text-[11px] text-amber-300/90 pt-1">
                      <strong>Remediation Action:</strong> {target.remediation_required}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
