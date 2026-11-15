import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, ArrowRight, TrendingUp,
  Lock, Sparkles, CheckCircle2,
  BookOpen, GitFork, Flame, CheckSquare,
  Clock
} from 'lucide-react';
import { NavigationTab } from './Sidebar';
import { PageHeader } from './ui/PageHeader';
import { WorkflowBanner } from './ui/WorkflowBanner';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface CommandCenterProps {
  brandId: string;
  onNavigate: (tab: NavigationTab) => void;
  onStartTour?: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  brandId,
  onNavigate,
  onStartTour
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [releases, setReleases] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [facts, setFacts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      const [analyticsRes, releasesRes, tasksRes, factsRes, eventsRes] = await Promise.all([
        fetch(`/api/analytics/governance?brand_id=${brandId}`).then((r) => r.ok ? r.json() : null),
        fetch(`/api/releases?brand_id=${brandId}`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/tasks`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/facts?brand_id=${brandId}`).then((r) => r.ok ? r.json() : []),
        fetch(`/api/collaboration/events?limit=5`).then((r) => r.ok ? r.json() : []),
      ]);

      setAnalytics(analyticsRes);
      setReleases(releasesRes || []);
      setTasks(tasksRes || []);
      setFacts(factsRes || []);
      setEvents(eventsRes || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [brandId]);

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING_REVIEW' || t.status === 'PENDING');

  const LIFECYCLE_STEPS = [
    {
      tab: 'knowledge-base' as NavigationTab,
      label: '1. Brand Knowledge',
      sub: `${facts.length} Certified Truth Nodes`,
      icon: <BookOpen className="w-3.5 h-3.5" />
    },
    {
      tab: 'content-studio' as NavigationTab,
      label: '2. Content Intelligence',
      sub: 'Multi-Agent Inspection (<800ms)',
      icon: <Sparkles className="w-3.5 h-3.5" />
    },
    {
      tab: 'bdig' as NavigationTab,
      label: '3. Knowledge Graph',
      sub: 'Persistent Asset Dependencies',
      icon: <GitFork className="w-3.5 h-3.5" />
    },
    {
      tab: 'impact-simulator' as NavigationTab,
      label: '4. Impact Simulator',
      sub: 'Simulate ₹499 ➔ ₹599 Ripple',
      icon: <Flame className="w-3.5 h-3.5 text-amber-600" />
    },
    {
      tab: 'approvals' as NavigationTab,
      label: '5. Approval Center',
      sub: `${pendingTasks.length} Awaiting Sign-off`,
      icon: <CheckSquare className="w-3.5 h-3.5" />
    },
    {
      tab: 'audit-trust' as NavigationTab,
      label: '6. Trust Ledger',
      sub: `${releases.length} Sealed SHA-256 Blocks`,
      icon: <Lock className="w-3.5 h-3.5" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header with One-Sentence Purpose & Contextual Help */}
      <PageHeader
        title="Overview"
        description="Your brand governance workspace at a glance. Monitor certified truth nodes, pending approvals, recent inspections, and active compliance guardrails."
        icon={<ShieldCheck className="w-4 h-4 text-white" />}
        category="Workspace"
        workspaceName={brandId === 'aurelle-tech' ? 'Aurelle Technologies Inc.' : brandId}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Workspace' },
          { label: 'Overview', active: true }
        ]}
        helpContext={{
          summary: "BrandTrace AI acts as the single source of brand truth. Approved facts govern all marketing copy, simulations sandbox prospective mutations before commit, and all releases are sealed with cryptographic SHA-256 proofs.",
          terms: [
            { term: "Brand Truth Node", definition: "An officially certified fact, pricing tier, claim, or guideline stored in the brand graph." },
            { term: "Blast Radius", definition: "The complete set of downstream marketing assets, web pages, and documents affected when a brand fact mutates." },
            { term: "Cryptographic Seal", definition: "A deterministic SHA-256 Merkle block digest binding content, reviewer identity, and timestamp into an immutable audit record." },
            { term: "Reverse-Offset Remediation", definition: "Right-to-left string replacement repairing policy defects without corrupting character indices." }
          ]
        }}
        primaryAction={{
          label: "Simulate Price Mutation",
          onClick: () => onNavigate('impact-simulator'),
          icon: <Flame className="w-3.5 h-3.5 text-amber-400" />
        }}
        secondaryAction={{
          label: "Inspect New Copy",
          onClick: () => onNavigate('content-studio'),
          icon: <Sparkles className="w-3.5 h-3.5 text-sky-600" />
        }}
      >
        {onStartTour && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onStartTour}
            icon={<Sparkles className="w-3.5 h-3.5 text-slate-700" />}
          >
            Quick Tour
          </Button>
        )}
      </PageHeader>

      {/* 1. Governance Posture & Quantitative Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Certified Truth Nodes</span>
            <BookOpen className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {facts.length} Facts
          </div>
          <p className="text-[11px] text-slate-500">Approved pricing, specs &amp; claims</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Sealed Releases</span>
            <Lock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {releases.length} Sealed
          </div>
          <p className="text-[11px] text-slate-500">Immutable SHA-256 ledger blocks</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Compliance Index</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {analytics?.compliance_rate_percent || 94.2}%
          </div>
          <p className="text-[11px] text-slate-500">{analytics?.prevented_violations_count || 56} prevented violations</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono text-amber-700">
            {pendingTasks.length} Tasks
          </div>
          <p className="text-[11px] text-slate-500">Awaiting authorized sign-off</p>
        </div>
      </div>

      {/* 2. Visual "How BrandTrace Operates" Journey Stepper */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="sm">Product Journey</Badge>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Connected Brand Governance Loop
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Click any step to inspect module
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {LIFECYCLE_STEPS.map((step, idx) => (
            <button
              key={step.tab}
              onClick={() => onNavigate(step.tab)}
              className="p-2.5 sm:p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-left transition-all group cursor-pointer shadow-2xs space-y-1"
            >
              <div className="flex items-center justify-between text-slate-500 group-hover:text-slate-900">
                <span className="text-slate-700">{step.icon}</span>
                <span className="text-[10px] font-mono font-semibold">0{idx + 1}</span>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-900 leading-tight">
                {step.label}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {step.sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Operational Split Grid: Pending Approvals & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Pending Approvals & Tasks (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pending Governance Tasks
              </h3>
              <Badge variant={pendingTasks.length > 0 ? "warning" : "success"} size="sm" dot>
                {pendingTasks.length} Active
              </Badge>
            </div>
            <button
              onClick={() => onNavigate('approvals')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingTasks.length > 0 ? (
            <div className="space-y-2.5">
              {pendingTasks.slice(0, 4).map((task: any, idx: number) => (
                <div
                  key={task.task_id || idx}
                  className="p-3.5 rounded-lg bg-slate-50/70 border border-slate-200 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {task.asset_name || task.asset_id || `Task #${idx + 1}`}
                      </span>
                      <Badge variant="warning" size="sm">
                        {task.change_type || 'PRICE_MUTATION'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {task.current_content || task.proposed_content || 'Revision required due to brand truth update.'}
                    </p>
                  </div>

                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => onNavigate('approvals')}
                    icon={<ArrowRight className="w-3 h-3" />}
                    iconPosition="right"
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-50/50 border border-slate-200 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <div className="text-xs font-semibold text-slate-900">
                All Touchpoints Aligned
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                No active revision tasks are pending. Run the Change Impact Simulator to model prospective mutations and generate review tasks.
              </p>
              <Button
                variant="primary"
                size="xs"
                onClick={() => onNavigate('impact-simulator')}
                icon={<Flame className="w-3.5 h-3.5 text-amber-400" />}
              >
                Launch Price Simulation (₹499 ➔ ₹599)
              </Button>
            </div>
          )}
        </div>

        {/* Right: Recent Governance Activity (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Activity &amp; Audit Trail
              </h3>
            </div>
            <button
              onClick={() => onNavigate('audit-trust')}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {events.length > 0 ? (
              events.map((evt: any, idx: number) => (
                <div
                  key={evt.id || idx}
                  className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-900 font-mono">
                      {evt.action || evt.action_type || 'GOVERNANCE_CHECK'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {evt.time_ago || 'Recent'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">
                    {evt.description || evt.summary || `Resource ${evt.resource_id || 'AST-01'} audited.`}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500">
                No recent governance events recorded.
              </div>
            )}

            {/* Quick Action Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                <span>Next Recommended Action</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Inspect a marketing copy sample in Content Intelligence to see autonomous agents detect compliance risks in &lt;800ms.
              </p>
              <Button
                variant="secondary"
                size="xs"
                fullWidth
                onClick={() => onNavigate('content-studio')}
                icon={<ArrowRight className="w-3 h-3" />}
                iconPosition="right"
              >
                Open Content Intelligence
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Banner: Next Step in Governance Journey */}
      <WorkflowBanner
        currentStage="Overview"
        nextStageTitle="Brand Knowledge (Certified Truth Set)"
        nextStageDescription="Examine the certified truth nodes, approved pricing facts (₹499), and brand voice rules that govern all marketing copy."
        nextStageActionLabel="Go to Brand Knowledge"
        onNavigateNext={() => onNavigate('knowledge-base')}
        governanceHint="Every asset evaluated by BrandTrace AI is cross-checked against certified facts in the knowledge graph."
      />
    </div>
  );
};
