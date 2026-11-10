import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, ArrowRight,
  TrendingUp,
  Lock, Sparkles, Building2, Activity, Layers
} from 'lucide-react';
import { NavigationTab } from './Sidebar';

interface CommandCenterProps {
  brandId: string;
  onNavigate: (tab: NavigationTab) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ brandId, onNavigate }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [releases, setReleases] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/analytics/governance?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch((err) => console.error(err));

    fetch(`/api/releases?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => setReleases(data || []))
      .catch((err) => console.error(err));
  }, [brandId]);

  return (
    <div className="space-y-6">
      {/* Executive Posture Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Governance Posture
            </span>
            <span className="text-xs font-mono text-slate-500">Workspace: {brandId}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Enterprise Governance Control Plane
          </h2>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            All 4 verification agents operating in live DAG topological traversal mode. Real-time grounding against certified truth-set with zero unaddressed regulatory violations.
          </p>
        </div>

        {/* Global Compliance Health Score */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <div className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {analytics?.compliance_rate_percent || 94.2}%
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Enterprise Compliance Index
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 4 Quantitative Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Governed Touchpoints</span>
            <Layers className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {analytics?.total_assets_governed || 142}
          </div>
          <p className="text-[11px] text-slate-500">Ads, Websites, PDFs, Packaging</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Sealed Releases</span>
            <Lock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {releases.length > 0 ? releases.length : analytics?.releases_sealed_count || 86}
          </div>
          <p className="text-[11px] text-slate-500">Tamper-evident audit signatures</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Prevented Violations</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {analytics?.prevented_violations_count || 56}
          </div>
          <p className="text-[11px] text-slate-500">Intercepted pre-release risks</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Mean Release Velocity</span>
            <Activity className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {analytics?.average_release_time_hours || 1.8}h
          </div>
          <p className="text-[11px] text-slate-500">Down from 14 days manual review</p>
        </div>
      </div>

      {/* Middle Section: Direct Operations & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Operations (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-700" />
              Direct Control Plane Shortcuts
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('content-studio')}
                className="w-full p-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left flex items-center justify-between transition-colors group cursor-pointer shadow-2xs"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-black">
                    Run Content Intelligence Inspection
                  </div>
                  <div className="text-[11px] text-slate-500">Verify marketing copy, claims &amp; regulatory compliance</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('impact-simulator')}
                className="w-full p-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left flex items-center justify-between transition-colors group cursor-pointer shadow-2xs"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-black">
                    Simulate Fact Mutation (₹499 ➔ ₹599)
                  </div>
                  <div className="text-[11px] text-slate-500">Predict cross-departmental blast radius before commit</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('multimodal')}
                className="w-full p-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left flex items-center justify-between transition-colors group cursor-pointer shadow-2xs"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-black">
                    Multimodal Creative Inspector
                  </div>
                  <div className="text-[11px] text-slate-500">Verify logo clear space &amp; WCAG AA contrast ratio</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => onNavigate('approvals')}
                className="w-full p-3.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-left flex items-center justify-between transition-colors group cursor-pointer shadow-2xs"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-black">
                    Review Pending Approval Tasks
                  </div>
                  <div className="text-[11px] text-slate-500">Authorized human sign-off on staged revisions</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        </div>

        {/* Department Compliance Matrix (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                Cross-Departmental Compliance Breakdown
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">4 Active Divisions</span>
            </div>

            <div className="space-y-3">
              {(analytics?.department_breakdown || [
                { department: 'Performance Marketing', total_assets: 52, compliance_rate: 91.2, active_revisions: 2 },
                { department: 'Brand & Creative Marketing', total_assets: 38, compliance_rate: 96.8, active_revisions: 0 },
                { department: 'E-Commerce & Digital Products', total_assets: 28, compliance_rate: 95.0, active_revisions: 1 },
                { department: 'Commercial B2B Sales', total_assets: 24, compliance_rate: 94.5, active_revisions: 1 },
              ]).map((dept: any) => (
                <div key={dept.department} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{dept.department}</span>
                    <span className="font-mono text-slate-900 font-bold">{dept.compliance_rate}% Compliance</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${dept.compliance_rate}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{dept.total_assets} Touchpoints Governed</span>
                    <span>{dept.active_revisions} Pending Revisions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
