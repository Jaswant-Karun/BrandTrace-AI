import React, { useEffect, useState } from 'react';
import { ShieldCheck, Scale } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';

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
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Enterprise Risk Intelligence & Taxonomy"
        description="Categorized statutory liabilities, FTC claim substantiation doctrine, FDA wellness standards, and institutional risk rankings."
        category="Risk Taxonomy"
        workspaceName={brandId}
      >
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-mono text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Posture: <span className="font-bold">Defended (Low Liability)</span>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
          Loading risk taxonomy...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Risk Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {riskData?.categories.map((cat: any, idx: number) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{cat.category}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {cat.active_guardrails.length} Active Rules
                  </span>
                </div>

                <div className="space-y-3">
                  {cat.active_guardrails.map((rule: any) => (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{rule.label}</span>
                        <span className="text-[9px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">
                          {rule.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{rule.description}</p>
                      <div className="pt-1 text-[10px] text-slate-500 font-mono">
                        Policy: <span className="text-slate-800 font-semibold">{rule.governing_policy}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Governing Regulations Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Scale className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Governing Regulatory Frameworks
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {riskData?.regulations.map((reg: any) => (
                <div
                  key={reg.id}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{reg.label}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {reg.jurisdiction}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{reg.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
