import React, { useEffect, useState } from 'react';
import { BarChart3, ArrowUpRight } from 'lucide-react';
import { PageHeader } from './ui/PageHeader';

interface GovernanceAnalyticsViewProps {
  brandId: string;
}

export const GovernanceAnalyticsView: React.FC<GovernanceAnalyticsViewProps> = ({ brandId }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/analytics/governance?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => {
        setAnalytics(data);
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
        title="Governance Analytics & Velocity Telemetry"
        description="Quantitative compliance indices, gate release velocity, violation distribution, and department-level adherence metrics."
        category="Governance Telemetry"
        workspaceName={brandId}
      />

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
          Loading analytics telemetry...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Overall Brand Compliance Rate
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono flex items-center gap-2">
                {analytics?.compliance_rate_percent}%
                <span className="text-xs font-sans font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center border border-emerald-200">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +2.4% MoM
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Governing 142 digital and print releases</p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Release Gate Latency
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                {analytics?.average_release_time_hours} Hours
              </div>
              <p className="text-[11px] text-slate-500">Autonomous gating vs 14-day manual PR reviews</p>
            </div>

            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Prevented Statutory Violations
              </div>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                {analytics?.prevented_violations_count}
              </div>
              <p className="text-[11px] text-slate-500">Pre-release claims remediated before public launch</p>
            </div>
          </div>

          {/* Violation Distribution & Weekly Velocity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Violation Types Distribution (6 Cols) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Violation Types Intercepted
              </h3>

              <div className="space-y-3">
                {analytics?.violation_types_distribution.map((v: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium">{v.category}</span>
                      <span className="font-mono text-slate-900 font-bold">{v.frequency}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-slate-900 h-full rounded-full"
                        style={{ width: `${v.frequency}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Velocity Trend (6 Cols) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                Weekly Release Velocity &amp; Remediations
              </h3>

              <div className="grid grid-cols-5 gap-2 pt-4">
                {analytics?.weekly_velocity_trend.map((w: any, idx: number) => (
                  <div key={idx} className="text-center space-y-2">
                    <div className="h-32 flex flex-col justify-end items-center gap-1">
                      <div
                        className="w-full bg-slate-900 rounded-t transition-all hover:bg-slate-800"
                        style={{ height: `${(w.scanned / 40) * 100}%` }}
                        title={`Scanned: ${w.scanned}`}
                      />
                      <div
                        className="w-full bg-rose-500 rounded-t"
                        style={{ height: `${(w.remediated / 40) * 100}%` }}
                        title={`Remediated: ${w.remediated}`}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">{w.week}</div>
                    <div className="text-[10px] font-bold text-slate-900 font-mono">{w.approved} pass</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-500 font-sans border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-900" /> Total Releases
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Remediations Applied
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
