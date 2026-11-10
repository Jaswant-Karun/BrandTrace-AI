import React, { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, ArrowRight, AlertTriangle,
  Sparkles, FileText, Stamp, Layers, Lock 
} from 'lucide-react';
import { VerificationResult, RiskSpan } from '../types';

interface AssetInspectorProps {
  brandId: string;
  onSignRelease: (result: VerificationResult, reviewerName: string) => Promise<void>;
}

export const AssetInspector: React.FC<AssetInspectorProps> = ({ brandId, onSignRelease }) => {
  const [content, setContent] = useState<string>(
    "520 miles EPA-estimated range with QuantumCell™ Architecture. The Apex GT arrives."
  );
  const [assetTitle, setAssetTitle] = useState<string>("Spring 2026 Fleet Billboard Headline");
  const [channel, setChannel] = useState<string>("OOH Billboard");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [selectedSpan, setSelectedSpan] = useState<RiskSpan | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [signedSuccess, setSignedSuccess] = useState<string | null>(null);

  // Preset Scenarios
  const PRESETS = [
    {
      title: "Compliant Range Copy (Passes Gate)",
      assetTitle: "Billboard: 520 Miles of Zero Compromise",
      channel: "OOH Billboard",
      brand: "apex-dynamics",
      text: "520 miles EPA-estimated range with QuantumCell™ Architecture. Precision engineering meets zero compromise."
    },
    {
      title: "Greenwashing & Banned Superlatives (Critical Violation)",
      assetTitle: "PR Wire: The 100% Eco-Friendly Super-Saloon",
      channel: "PR Newswire",
      brand: "apex-dynamics",
      text: "Apex unveils the completely green 100% eco-friendly zero-carbon footprint supercar that is undeniably the world's fastest EV on quantumcell."
    },
    {
      title: "Autonomous Driving Deception (NHTSA L2 Sanction)",
      assetTitle: "YouTube Ad: Hands-Free Highway Cruising",
      channel: "Digital Video",
      brand: "apex-dynamics",
      text: "Kick back and relax while HyperDrive pilots your commute hands-free without looking. Fully autonomous driving has finally arrived."
    },
    {
      title: "Novus CardioShield Clinical Study (Compliant)",
      assetTitle: "Patient Brochure: Understanding Lipid Health",
      channel: "Print & Web Brochure",
      brand: "novus-health",
      text: "Ask your physician about CardioShield™. In a Phase III clinical trial, CardioShield™ lowered ApoB by up to 38% alongside standard statin therapy."
    },
    {
      title: "Novus Miracle Cure Claim (FDA Fair Balance Rejection)",
      assetTitle: "Social Ad: The Guaranteed Heart Disease Cure",
      channel: "Social Media",
      brand: "novus-health",
      text: "CardioShield is an insane medical miracle that offers a guaranteed cure for cardiovascular disease and 100% eliminates all cholesterol."
    }
  ];

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setContent(preset.text);
    setAssetTitle(preset.assetTitle);
    setChannel(preset.channel);
    setResult(null);
    setSelectedSpan(null);
    setSignedSuccess(null);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setResult(null);
    setSelectedSpan(null);
    setSignedSuccess(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          content: content,
          asset_title: assetTitle,
          channel: channel
        })
      });
      if (!response.ok) throw new Error('Verification failed');
      const data: VerificationResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApplyRemediation = () => {
    if (result?.remediated_content) {
      setContent(result.remediated_content);
      // Auto re-verify to demonstrate instant compliance resolution
      setTimeout(() => {
        handleVerify();
      }, 100);
    }
  };

  const handleSignRelease = async () => {
    if (!result) return;
    setIsSigning(true);
    try {
      await onSignRelease(result, "Chief Brand Governance Officer");
      setSignedSuccess("Asset cryptographically sealed and recorded in MongoDB Release Ledger.");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigning(false);
    }
  };

  // Render text with interactive highlighted risk spans
  const renderHighlightedContent = () => {
    if (!result || result.all_risk_spans.length === 0) {
      return <span>{content}</span>;
    }

    // Sort spans by start_char
    const sorted = [...result.all_risk_spans].sort((a, b) => a.start_char - b.start_char);
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    sorted.forEach((span, idx) => {
      // Text before the span
      if (span.start_char > lastIdx) {
        elements.push(content.substring(lastIdx, span.start_char));
      }

      // Span highlight style
      let colorClass = 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-500';
      if (span.severity === 'CRITICAL') {
        colorClass = 'bg-red-500/30 text-red-200 border-b-2 border-red-500 animate-pulse';
      } else if (span.severity === 'HIGH') {
        colorClass = 'bg-orange-500/25 text-orange-200 border-b-2 border-orange-500';
      }

      elements.push(
        <button
          key={`span-${idx}`}
          onClick={() => setSelectedSpan(span)}
          className={`inline cursor-pointer px-1 rounded mx-0.5 transition-all text-left ${colorClass} hover:ring-2 hover:ring-brand-400`}
        >
          {content.substring(span.start_char, span.end_char)}
        </button>
      );

      lastIdx = span.end_char;
    });

    if (lastIdx < content.length) {
      elements.push(content.substring(lastIdx));
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Presets */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Autonomous Governance Scenarios
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Select pre-configured test scenarios to evaluate agents</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => applyPreset(p)}
              className="text-xs bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-all"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input & Agent Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Asset Drafting & Metadata (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" />
              Marketing Release Candidate
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Asset Title</label>
                <input
                  type="text"
                  value={assetTitle}
                  onChange={(e) => setAssetTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Deployment Channel</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="OOH Billboard">OOH Billboard (Print / High Visibility)</option>
                  <option value="Social Media">Social Media (Instagram / LinkedIn / X)</option>
                  <option value="Digital Video">Digital Video (YouTube / OTT Ads)</option>
                  <option value="PR Newswire">PR Newswire / Investor Release</option>
                  <option value="Product Packaging">Product Packaging & Spec Sheets</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400 font-medium">Marketing Copy / Script</label>
                  <span className="text-[10px] font-mono text-slate-400">{content.length} characters</span>
                </div>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste marketing copy, billboard text, or script..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-500 font-mono leading-relaxed resize-none"
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={isVerifying || !content.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Executing Multi-Agent Governance Pipeline...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    Run Autonomous Verification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Agent Analysis & Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !isVerifying && (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-4 text-slate-400">
                <ShieldCheck className="w-6 h-6 text-brand-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Awaiting Asset Verification</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Select a scenario or draft custom marketing copy on the left, then click <strong>Run Autonomous Verification</strong> to engage the multi-agent control plane.
              </p>
            </div>
          )}

          {isVerifying && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center min-h-[360px] flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Traversing Brand Knowledge Graph</p>
                <p className="text-xs text-slate-400">Cross-checking against statutory regulations, approved claims, and trademark registries...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Decision Header Card */}
              <div
                className={`p-5 rounded-2xl border flex flex-wrap items-center justify-between gap-4 shadow-xl ${
                  result.governance_decision === 'APPROVED_FOR_RELEASE'
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : result.governance_decision === 'STAGED_FOR_HUMAN_REVIEW'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-red-950/30 border-red-500/40'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                        result.governance_decision === 'APPROVED_FOR_RELEASE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : result.governance_decision === 'STAGED_FOR_HUMAN_REVIEW'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {result.governance_decision.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{result.verification_id}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {result.governance_decision === 'APPROVED_FOR_RELEASE'
                      ? 'Asset complies with all brand DNA guidelines, verified claims, and regulatory guardrails.'
                      : result.governance_decision === 'STAGED_FOR_HUMAN_REVIEW'
                      ? 'Asset contains minor stylistic or trademark caveats. Staged for compliance officer review.'
                      : 'Asset blocked by governance gate due to critical regulatory violations or unverified claims.'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-white">
                    {result.composite_risk_score}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Composite Risk</div>
                </div>
              </div>

              {/* 3 Specialized Agents Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Voice Agent */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                      Voice & Persona
                    </span>
                    <span className="text-xs font-bold font-mono text-white">
                      {result.agent_reports.voice_persona.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {result.agent_reports.voice_persona.summary}
                  </p>
                </div>

                {/* Claim Agent */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Claim Truth-Set
                    </span>
                    <span className="text-xs font-bold font-mono text-white">
                      {result.agent_reports.claim_substantiation.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {result.agent_reports.claim_substantiation.summary}
                  </p>
                </div>

                {/* Legal & Regulatory Agent */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Regulatory & Marks
                    </span>
                    <span className="text-xs font-bold font-mono text-white">
                      {result.agent_reports.regulatory_compliance.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {result.agent_reports.regulatory_compliance.summary}
                  </p>
                </div>
              </div>

              {/* Interactive Highlighted Risk Overlays */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-400" />
                    Token-Level Explainability View
                  </h4>
                  <span className="text-[11px] text-slate-400">Click highlighted tokens to inspect policy citations</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs font-mono leading-relaxed text-slate-200">
                  {renderHighlightedContent()}
                </div>

                {/* Selected Risk Span Detail Card */}
                {selectedSpan && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-brand-500/30 animate-fadeIn space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-400 uppercase tracking-wide">
                          Flagged Token: "{selectedSpan.matched_text}"
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                          {selectedSpan.severity}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedSpan(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        ✕ Close
                      </button>
                    </div>

                    <p className="text-xs text-slate-300">{selectedSpan.explanation}</p>

                    <div className="pt-1 text-[11px] text-slate-400">
                      <strong>Policy Citation:</strong> {selectedSpan.rule_citation}
                    </div>

                    {selectedSpan.suggested_fix && (
                      <div className="pt-1 text-[11px] text-emerald-400 font-mono">
                        <strong>Graph Compliant Replacement:</strong> {selectedSpan.suggested_fix}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Remediation Hub (If defects exist) */}
              {result.remediated_content && result.all_risk_spans.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      One-Click Graph-Preserving Remediation
                    </h4>
                    <button
                      onClick={handleApplyRemediation}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Apply & Re-Verify
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs font-mono text-emerald-200 leading-relaxed">
                    {result.remediated_content}
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    {result.remediation_rationale}
                  </p>
                </div>
              )}

              {/* Cryptographic Proof & Release Gate Sign-Off */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Immutable Release Ledger Gate
                    </span>
                  </div>
                  {result.release_proof && (
                    <div className="text-[11px] font-mono text-slate-400">
                      Proof Digest: <span className="text-brand-300">{result.release_proof.release_hash}</span> (SHA256-EDT-v1)
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {signedSuccess ? (
                    <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {signedSuccess}
                    </div>
                  ) : (
                    <button
                      onClick={handleSignRelease}
                      disabled={isSigning || result.governance_decision === 'REJECTED_GATED'}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-white text-slate-950 font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-md"
                    >
                      <Stamp className="w-4 h-4" />
                      {isSigning ? 'Sealing in MongoDB...' : 'Sign & Seal Release'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
