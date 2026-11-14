import React, { useEffect, useState } from 'react';
import { Lock, CheckCircle2, ShieldCheck, ArrowRight, UserCheck, Check, AlertTriangle } from 'lucide-react';
import { RevisionTask } from '../types';
import { PageHeader } from './ui/PageHeader';
import { WorkflowBanner } from './ui/WorkflowBanner';
import { EmptyState } from './ui/EmptyState';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { useToast } from './ui/ToastContext';

interface ApprovalCenterViewProps {
  brandId: string;
  onNavigate?: (tab: any) => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({ brandId, onNavigate }) => {
  const toast = useToast();
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<RevisionTask | null>(null);
  const [reviewerName, setReviewerName] = useState<string>('Chief Governance Officer');
  const [resolutionNotes, setResolutionNotes] = useState<string>('Approved revision for live release flighting.');
  const [isResolving, setIsResolving] = useState<boolean>(false);

  const loadTasks = () => {
    setIsLoading(true);
    fetch(`/api/tasks?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data: RevisionTask[]) => {
        setTasks(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
        toast.error('Failed to load approval tasks.');
      });
  };

  useEffect(() => {
    loadTasks();
  }, [brandId]);

  const handleResolve = async () => {
    if (!selectedTask) return;
    setIsResolving(true);
    const token = localStorage.getItem('brandtrace_jwt_token');
    try {
      const res = await fetch(`/api/tasks/${selectedTask.task_id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reviewer_name: reviewerName,
          decision: 'APPROVED',
          final_content: selectedTask.proposed_content,
          resolution_notes: resolutionNotes
        })
      });
      if (!res.ok) throw new Error('Resolution failed');
      const data = await res.json();
      toast.success(`Task ${selectedTask.task_id} approved & sealed with audit proof: ${data.task.audit_proof}`);
      loadTasks();
      setSelectedTask(null);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to resolve task: ' + (e.message || 'Server error'));
    } finally {
      setIsResolving(false);
    }
  };

  const pendingCount = tasks.filter((t) => t.status === 'PENDING_REVIEW' || t.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Approval Center"
        description="Review findings and record authorised decisions."
        category="Governance"
        workspaceName={brandId === 'aurelle-tech' ? 'Aurelle Technologies Inc.' : brandId}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Governance' },
          { label: 'Approval Center', active: true }
        ]}
        helpContext={{
          summary: "The Approval Center enforces Human-in-the-Loop (HITL) governance. Content identified with policy defects or generated via graph simulation is staged here for formal review. Content is never automatically republished without human authorization.",
          terms: [
            { term: "Authorized Roles", definition: "Only BRAND_MANAGER, COMPLIANCE_REVIEWER, and ADMIN have server-side authority to resolve tasks and commit releases." },
            { term: "Decision Consequences", definition: "Approving a task updates the live approved content version and records an immutable cryptographic SHA-256 seal in the Trust Ledger." },
            { term: "Revision Routing", definition: "Tasks are automatically routed to specific departments (Performance Marketing, Legal, Creative) based on graph dependency rules." }
          ]
        }}
        primaryAction={{
          label: "View Trust Ledger",
          onClick: () => onNavigate && onNavigate('audit-trust'),
          icon: <Lock className="w-3.5 h-3.5" />
        }}
        secondaryAction={{
          label: "Simulate New Mutation",
          onClick: () => onNavigate && onNavigate('impact-simulator'),
          icon: <ArrowRight className="w-3.5 h-3.5" />
        }}
      >
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-mono text-amber-900">
          <Lock className="w-4 h-4 text-amber-600" />
          Pending Approvals: <span className="font-bold">{pendingCount}</span>
        </div>
      </PageHeader>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading governance approval tasks...
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="All Governance Tasks Cleared"
          description="Zero pending revision tasks. To generate live tasks, run the Change Impact Simulator to model prospective mutations (such as increasing subscription price from ₹499 to ₹599)."
          actionLabel="Launch Change Impact Simulator"
          onAction={() => onNavigate && onNavigate('impact-simulator')}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
        />
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Task ID &amp; Resource</TableHead>
              <TableHead>Department &amp; Reviewer</TableHead>
              <TableHead>Content Diff Preview</TableHead>
              <TableHead>Status &amp; Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.task_id}>
                <TableCell className="align-top">
                  <div className="font-bold text-slate-900 text-xs mb-0.5">{task.asset_name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{task.task_id}</div>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    {task.asset_type}
                  </span>
                </TableCell>

                <TableCell className="align-top">
                  <div className="font-semibold text-slate-900">{task.department}</div>
                  <div className="text-[11px] text-slate-600">{task.assigned_reviewer_role}</div>
                  <div className="mt-1">
                    <Badge variant={task.priority === 'CRITICAL' ? 'error' : 'warning'} size="sm">
                      {task.priority || 'HIGH'}
                    </Badge>
                  </div>
                </TableCell>

                <TableCell className="align-top max-w-md">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] leading-relaxed space-y-1">
                    <div className="text-slate-500 line-through text-[10px]">
                      Old: {task.current_content}
                    </div>
                    <div className="text-emerald-800 font-semibold">
                      Proposed: {task.proposed_content}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  {task.status === 'APPROVED_SEALED' || task.status === 'RESOLVED' ? (
                    <div className="space-y-1">
                      <Badge variant="success" size="sm" dot>
                        Approved &amp; Sealed
                      </Badge>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                        {task.audit_proof || 'BT-SEAL-VERIFIED'}
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => {
                        setSelectedTask(task);
                        setReviewerName(task.assigned_reviewer_role || 'Chief Governance Officer');
                      }}
                      icon={<Lock className="w-3.5 h-3.5" />}
                    >
                      Review &amp; Authorize
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Resolution & Sealing Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Authorize Content Revision & Seal Release"
        subtitle={`Reviewing ${selectedTask?.asset_name || selectedTask?.task_id}`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedTask(null)} disabled={isResolving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResolve} isLoading={isResolving} icon={<Check className="w-3.5 h-3.5" />}>
              Sign &amp; Seal into Ledger
            </Button>
          </>
        }
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Proposed Revision Copy (Diff)
              </span>
              <div className="font-mono text-xs text-emerald-800 font-medium bg-white p-2.5 rounded-lg border border-emerald-200">
                {selectedTask.proposed_content}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Authorized Reviewer Signature Identity
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-800">
                Resolution &amp; Compliance Notes
              </label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-200 p-2 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <span>
                Authorizing this task generates a deterministic SHA-256 release seal (`BT-SEAL-...`) and records it in the immutable Trust &amp; Audit Ledger.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* Workflow Banner: Next Step in Governance Journey */}
      <WorkflowBanner
        currentStage="Approval Center"
        nextStageTitle="Trust & Audit Ledger"
        nextStageDescription="Verify the cryptographic integrity of signed releases and test tampering detection across all 5 deterministic states."
        nextStageActionLabel="Go to Trust & Audit Ledger"
        onNavigateNext={() => onNavigate && onNavigate('audit-trust')}
        governanceHint="Every approved decision is immutably recorded with reviewer identity, timestamp ISO-8601, and parent block hash."
      />
    </div>
  );
};
