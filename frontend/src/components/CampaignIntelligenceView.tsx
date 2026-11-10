import React, { useEffect, useState } from 'react';
import { FileText, DollarSign, Layers, CheckCircle2 } from 'lucide-react';

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
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Campaign Intelligence Portfolio
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time visibility into multi-channel marketing initiatives, budget distribution, and omnichannel compliance health.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading campaign portfolio...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((camp) => (
            <div
              key={camp.campaign_id}
              className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-cyan-400 border border-blue-500/30">
                    {camp.quarter}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{camp.campaign_id}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {camp.compliance_rate}% Health
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1">{camp.campaign_name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{camp.description}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Budget</div>
                  <div className="font-bold text-white font-mono flex items-center">
                    <DollarSign className="w-3 h-3 text-slate-400" />
                    {(camp.budget_usd / 1000000).toFixed(1)}M USD
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Touchpoints</div>
                  <div className="font-bold text-white font-mono flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    {camp.assets_count} Assets
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Division</div>
                  <div className="font-bold text-slate-200 truncate">{camp.department}</div>
                </div>
              </div>

              {/* Channels */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Active Channels</div>
                <div className="flex flex-wrap gap-1.5">
                  {(camp.channels || ['Digital', 'OOH', 'Social']).map((ch: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 text-[11px]"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Connected Assets List */}
              {camp.assets && camp.assets.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Associated Releases</div>
                  <div className="space-y-1">
                    {camp.assets.map((ast: any) => (
                      <div
                        key={ast.id}
                        className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-300 truncate max-w-[240px]">{ast.label}</span>
                        <span className="text-[9px] font-mono uppercase text-brand-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
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
