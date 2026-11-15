import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, CheckCircle2, ShieldAlert, ArrowUpRight } from 'lucide-react';

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
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Governance Analytics &amp; Velocity Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Quantitative metrics: Compliance rate trends, release gate velocity, and violation type distribution across brand assets.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading analytics telemetry...</div>
      ) : (
        <div className="space-y-6">
          {/* Top 3 KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Overall Brand Compliance Rate
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono flex items-center gap-2">
                {analytics?.compliance_rate_percent}%
                <span className="text-xs font-sans font-semibold text-emerald-400 flex items-center">
                  <ArrowUpRight className="w-4 h-4" /> +2.4% MoM
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Governing 142 digital and print releases</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Release Gate Latency
              </div>
              <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                {analytics?.average_release_time_hours} Hours
              </div>
              <p className="text-[11px] text-slate-400">Autonomous gating vs 14-day manual PR reviews</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B0F19] border border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Prevented Statutory Violations
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                {analytics?.prevented_violations_count}
              </div>
              <p className="text-[11px] text-slate-400">Pre-release claims remediated before public launch</p>
            </div>
          </div>

          {/* Violation Distribution & Weekly Velocity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Violation Types Distribution (6 Cols) */}
            <div className="lg:col-span-6 bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Violation Types Intercepted
              </h3>

              <div className="space-y-3">
                {analytics?.violation_types_distribution.map((v: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{v.category}</span>
                      <span className="font-mono text-cyan-400 font-bold">{v.frequency}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full"
                        style={{ width: `${v.frequency}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Velocity Trend (6 Cols) */}
            <div className="lg:col-span-6 bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Weekly Release Velocity &amp; Remediations
              </h3>

              <div className="grid grid-cols-5 gap-2 pt-4">
                {analytics?.weekly_velocity_trend.map((w: any, idx: number) => (
                  <div key={idx} className="text-center space-y-2">
                    <div className="h-32 flex flex-col justify-end items-center gap-1">
                      <div
                        className="w-full bg-cyan-500/80 rounded-t transition-all hover:bg-cyan-400"
                        style={{ height: `${(w.scanned / 40) * 100}%` }}
                        title={`Scanned: ${w.scanned}`}
                      />
                      <div
                        className="w-full bg-rose-500/80 rounded-t"
                        style={{ height: `${(w.remediated / 40) * 100}%` }}
                        title={`Remediated: ${w.remediated}`}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">{w.week}</div>
                    <div className="text-[10px] font-bold text-white font-mono">{w.approved} pass</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-slate-400 font-sans">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500" /> Total Releases
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
