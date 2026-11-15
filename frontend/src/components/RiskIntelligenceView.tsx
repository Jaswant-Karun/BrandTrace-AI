import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, Scale } from 'lucide-react';

interface RiskIntelligenceViewProps {
  brandId: string;
}

export const RiskIntelligenceView: React.FC<RiskIntelligenceViewProps> = ({ brandId }) => {
  const [riskData, setRiskData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/risks/taxonomy?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => {
        setRiskData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [brandId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Enterprise Risk Intelligence &amp; Taxonomy
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Categorized statutory liabilities, prohibited marketing phrasing, and proactive legal guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Rating: <span className="text-emerald-400 font-bold">Defended (Low Liability)</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading risk taxonomy...</div>
      ) : (
        <div className="space-y-6">
          {/* Risk Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {riskData?.categories.map((cat: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{cat.category}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-300 border border-rose-500/30">
                    {cat.active_guardrails.length} Active Rules
                  </span>
                </div>

                <div className="space-y-3">
                  {cat.active_guardrails.map((rule: any) => (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{rule.label}</span>
                        <span className="text-[9px] font-bold uppercase bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">
                          {rule.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{rule.description}</p>
                      <div className="pt-1 text-[10px] text-cyan-400 font-mono">
                        Policy: {rule.governing_policy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Governing Regulations Table */}
          <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Governing Regulatory Frameworks
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {riskData?.regulations.map((reg: any) => (
                <div
                  key={reg.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{reg.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">{reg.jurisdiction}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{reg.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
