import React, { useEffect, useState } from 'react';
import { DollarSign, Layers, CheckCircle2 } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';

interface CampaignIntelligenceViewProps {
  brandId: string;
}

export const CampaignIntelligenceView: React.FC<CampaignIntelligenceViewProps> = ({ brandId }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/campaigns?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data || []);
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
        title="Campaign Intelligence Portfolio"
        description="Real-time visibility into multi-channel marketing initiatives, commercial budgets, flight dates, and associated brand touchpoints."
        category="Campaign Governance"
        workspaceName={brandId}
      />

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
          Loading campaign portfolio...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp) => (
            <div
              key={camp.campaign_id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {camp.quarter}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{camp.campaign_id}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {camp.compliance_rate}% Health
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{camp.campaign_name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{camp.description}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Budget</div>
                  <div className="font-bold text-slate-900 font-mono flex items-center mt-0.5">
                    <DollarSign className="w-3 h-3 text-slate-500" />
                    {(camp.budget_usd / 1000000).toFixed(1)}M USD
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Touchpoints</div>
                  <div className="font-bold text-slate-900 font-mono flex items-center gap-1 mt-0.5">
                    <Layers className="w-3 h-3 text-slate-700" />
                    {camp.assets_count} Assets
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Division</div>
                  <div className="font-bold text-slate-800 truncate mt-0.5">{camp.department}</div>
                </div>
              </div>

              {/* Channels */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Channels</div>
                <div className="flex flex-wrap gap-1.5">
                  {(camp.channels || ['Digital', 'OOH', 'Social']).map((ch: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[11px] shadow-xs"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connected Assets List */}
              {camp.assets && camp.assets.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Associated Releases</div>
                  <div className="space-y-1">
                    {camp.assets.map((ast: any) => (
                      <div
                        key={ast.id}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-800 truncate max-w-[240px]">{ast.label}</span>
                        <span className="text-[9px] font-mono uppercase text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {ast.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
