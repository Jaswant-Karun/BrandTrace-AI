import React, { useEffect, useState } from 'react';
import { DollarSign, Layers, CheckCircle2 } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { WorkflowBanner } from './ui/WorkflowBanner';
import { ArrowRight } from 'lucide-react';

interface CampaignIntelligenceViewProps {
  brandId: string;
  onNavigate?: (tab: any) => void;
}

export const CampaignIntelligenceView: React.FC<CampaignIntelligenceViewProps> = ({ brandId, onNavigate }) => {
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
        title="Campaign Intelligence"
        description="Track and govern multi-channel marketing campaigns connected to your brand knowledge graph."
        category="Intelligence"
        workspaceName={brandId === 'aurelle-tech' ? 'Aurelle Technologies Inc.' : brandId}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Intelligence' },
          { label: 'Campaign Intelligence', active: true }
        ]}
        helpContext={{
          summary: "Campaign Intelligence groups governed marketing assets into flighted commercial initiatives, tracking associated budget exposure and channel distributions.",
          terms: [
            { term: "Active Campaign Flight", definition: "A time-bounded commercial push spanning multiple channels (OOH, Social, Search, PR)." },
            { term: "Connected Touchpoints", definition: "Individual marketing assets whose copy and design tokens reference brand truth nodes." },
            { term: "Channel Guardrails", definition: "Specific regulatory requirements per channel (e.g., FTC disclosure size for social vs print)." }
          ]
        }}
        primaryAction={{
          label: "View Risk Intelligence",
          onClick: () => onNavigate && onNavigate('risks'),
          icon: <ArrowRight className="w-3.5 h-3.5" />
        }}
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

      {/* Workflow Banner: Next Step in Governance Journey */}
      <WorkflowBanner
        currentStage="Campaign Intelligence"
        nextStageTitle="Risk Intelligence & Taxonomy"
        nextStageDescription="Examine enterprise brand risk categories, prohibited claims guardrails, and statutory exposure ratings."
        nextStageActionLabel="Go to Risk Intelligence"
        onNavigateNext={() => onNavigate && onNavigate('risks')}
        governanceHint="Campaigns reference risk guardrails to ensure cross-channel advertising compliance before launch."
      />
    </div>
  );
};
