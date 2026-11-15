import React, { useEffect, useState } from 'react';
import { CheckSquare, Lock, CheckCircle2 } from 'lucide-react';
import { RevisionTask } from '../types';

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
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Governance Approval Center
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Authorized sign-off routing: Review and approve staged content revisions triggered by Brand Dependency Intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
          <Lock className="w-4 h-4 text-amber-400" />
          Pending Approvals: <span className="text-amber-400 font-bold">{pendingCount}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading approval tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">All Governance Tasks Cleared</h4>
          <p className="text-xs text-slate-400 max-w-sm">
            Zero pending revision tasks. To generate tasks, mutate a product price or claim in the <strong>Brand Intelligence Graph</strong> tab.
          </p>
        </div>
      ) : (
        <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Task ID &amp; Resource</th>
                  <th className="py-3.5 px-4">Department &amp; Reviewer</th>
                  <th className="py-3.5 px-4">Content Diff Preview</th>
                  <th className="py-3.5 px-4">Status &amp; Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {tasks.map((task) => (
                  <tr key={task.task_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-white text-xs mb-0.5">{task.asset_name}</div>
                      <div className="text-[10px] font-mono text-cyan-400">{task.task_id}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300">
                        {task.asset_type}
                      </span>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="font-semibold text-slate-200">{task.department}</div>
                      <div className="text-[11px] text-amber-300 font-medium">{task.assigned_reviewer_role}</div>
                      <div className="text-[10px] font-bold text-rose-400 mt-1 uppercase">
                        Priority: {task.priority}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top max-w-md">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] leading-relaxed space-y-1">
                        <div className="text-slate-400 line-through text-[10px]">
                          Old: {task.current_content}
                        </div>
                        <div className="text-emerald-300 font-semibold">
                          Proposed: {task.proposed_content}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      {task.status === 'APPROVED_SEALED' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved
                          </span>
                          <div className="text-[10px] font-mono text-slate-400">{task.audit_proof}</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setReviewerName(task.assigned_reviewer_role);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  Sign-Off Release v2.0
                </h3>
                <p className="text-xs text-slate-400">Task ID: {selectedTask.task_id}</p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
              <div>
                <span className="text-red-400 font-bold block text-[10px] uppercase">Original Approved Content:</span>
                <p className="text-slate-400 line-through">{selectedTask.current_content}</p>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-emerald-400 font-bold block text-[10px] uppercase">Proposed Content:</span>
                <p className="text-emerald-300 font-semibold">{selectedTask.proposed_content}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Authorizing Reviewer Identity</label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Approval Notes</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none font-mono"
              />
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isResolving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
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
