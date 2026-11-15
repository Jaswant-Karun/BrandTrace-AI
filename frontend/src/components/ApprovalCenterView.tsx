import React, { useEffect, useState } from 'react';
import { CheckSquare, Lock, CheckCircle2 } from 'lucide-react';
import { RevisionTask } from '../types';
import { PageHeader } from './ui/PageHeader';

interface ApprovalCenterViewProps {
  brandId: string;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({ brandId }) => {
  const [tasks, setTasks] = useState<RevisionTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTask, setSelectedTask] = useState<RevisionTask | null>(null);
  const [reviewerName, setReviewerName] = useState<string>('Chief Governance Officer');
  const [resolutionNotes, setResolutionNotes] = useState<string>('Approved revision for live release flighting.');
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      });
  };

  useEffect(() => {
    loadTasks();
  }, [brandId]);

  const handleResolve = async () => {
    if (!selectedTask) return;
    setIsResolving(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.task_id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: reviewerName,
          decision: 'APPROVED',
          final_content: selectedTask.proposed_content,
          resolution_notes: resolutionNotes
        })
      });
      if (!res.ok) throw new Error('Resolution failed');
      const data = await res.json();
      setSuccessMsg(`Task ${selectedTask.task_id} approved & sealed with audit proof: ${data.task.audit_proof}`);
      loadTasks();
      setTimeout(() => {
        setSelectedTask(null);
        setSuccessMsg(null);
      }, 1600);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  const pendingCount = tasks.filter((t) => t.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-5 h-5 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Governance Approval Center
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Authorized sign-off routing: Review and approve staged content revisions triggered by Brand Dependency Intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-mono text-amber-900">
          <Lock className="w-4 h-4 text-amber-600" />
          Pending Approvals: <span className="font-bold">{pendingCount}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
          Loading approval tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          <h4 className="text-sm font-bold text-slate-900">All Governance Tasks Cleared</h4>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Zero pending revision tasks. To generate tasks, mutate a product price or claim in the <strong>Brand Intelligence Graph</strong> tab.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Task ID &amp; Resource</th>
                  <th className="py-3.5 px-4">Department &amp; Reviewer</th>
                  <th className="py-3.5 px-4">Content Diff Preview</th>
                  <th className="py-3.5 px-4">Status &amp; Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {tasks.map((task) => (
                  <tr key={task.task_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-900 text-xs mb-0.5">{task.asset_name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{task.task_id}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {task.asset_type}
                      </span>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="font-semibold text-slate-900">{task.department}</div>
                      <div className="text-[11px] text-slate-600 font-medium">{task.assigned_reviewer_role}</div>
                      <div className="text-[10px] font-bold text-rose-700 mt-1 uppercase">
                        Priority: {task.priority}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top max-w-md">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] leading-relaxed space-y-1">
                        <div className="text-slate-500 line-through text-[10px]">
                          Old: {task.current_content}
                        </div>
                        <div className="text-emerald-800 font-semibold">
                          Proposed: {task.proposed_content}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      {task.status === 'APPROVED_SEALED' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved
                          </span>
                          <div className="text-[10px] font-mono text-slate-500">{task.audit_proof}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setReviewerName(task.assigned_reviewer_role);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          Review &amp; Authorize
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sign-Off Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-800" />
                  Sign-Off Release v2.0
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Task ID: {selectedTask.task_id}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs space-y-2">
              <div>
                <span className="text-rose-700 font-bold block text-[10px] uppercase">Original Approved Content:</span>
                <p className="text-slate-500 line-through">{selectedTask.current_content}</p>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-emerald-700 font-bold block text-[10px] uppercase">Proposed Content:</span>
                <p className="text-emerald-800 font-semibold">{selectedTask.proposed_content}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Authorizing Reviewer Identity</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium shadow-xs"
              />
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Approval Notes</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 resize-none font-mono shadow-xs"
              />
            </div>

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {successMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isResolving}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {isResolving ? 'Sealing...' : 'Authorize & Seal Release'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
