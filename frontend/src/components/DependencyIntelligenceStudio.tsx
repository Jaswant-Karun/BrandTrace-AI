import React, { useState, useEffect } from 'react';
import {
  GitFork, CheckCircle2,
  Users, Building, FileSpreadsheet, Lock, Sparkles,
  ShieldAlert, History
} from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BrandNode } from './BrandNode';
import {
  ApprovedFact, DependencyIntelligenceResult, RevisionTask, AssetVersionRecord
} from '../types';
import { PageHeader } from './ui/PageHeader';

interface DependencyIntelligenceStudioProps {
  brandId: string;
}

const nodeTypes = {
  brandNode: BrandNode,
};

export const DependencyIntelligenceStudio: React.FC<DependencyIntelligenceStudioProps> = ({ brandId }) => {
  const [facts, setFacts] = useState<ApprovedFact[]>([]);
  const [selectedFactId, setSelectedFactId] = useState<string>('FACT-PRC-01');
  const [oldValue, setOldValue] = useState<string>('₹499');
  const [newValue, setNewValue] = useState<string>('₹599');
  const [reason, setReason] = useState<string>(
    'Q1 Inflationary Indexing and Cloud Infrastructure Cost Adjustments'
  );
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<DependencyIntelligenceResult | null>(null);

  // ReactFlow state for the dependency graph
  const [depNodes, setDepNodes, onNodesChange] = useNodesState<Node>([]);
  const [depEdges, setDepEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Task Review & Resolution Modal State
  const [selectedTask, setSelectedTask] = useState<RevisionTask | null>(null);
  const [reviewerName, setReviewerName] = useState<string>('Chief Governance Officer');
  const [resolutionNotes, setResolutionNotes] = useState<string>(
    'Approved updated price for live campaign flighting.'
  );
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);

  // Version History Drawer State
  const [versionHistoryAssetId, setVersionHistoryAssetId] = useState<string | null>(null);
  const [versionRecords, setVersionRecords] = useState<AssetVersionRecord[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);

  // Task Filter
  const [taskFilter, setTaskFilter] = useState<string>('ALL');

  // Load Facts
  useEffect(() => {
    fetch(`/api/facts?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data: ApprovedFact[]) => {
        setFacts(data || []);
        if (data.length > 0) {
          const defaultFact = data.find((f) => f.id === 'FACT-PRC-01') || data[0];
          setSelectedFactId(defaultFact.id);
          setOldValue(defaultFact.current_value);
          setNewValue(defaultFact.id === 'FACT-PRC-01' ? '₹599' : defaultFact.current_value);
        }
      })
      .catch((err) => console.error(err));
  }, [brandId]);

  // Handle Fact selection change
  const handleFactChange = (factId: string) => {
    setSelectedFactId(factId);
    const fact = facts.find((f) => f.id === factId);
    if (fact) {
      setOldValue(fact.current_value);
      if (fact.id === 'FACT-PRC-01') {
        setNewValue('₹599');
        setReason('Q1 Inflationary Indexing and Cloud Infrastructure Cost Adjustments');
      } else if (fact.id === 'FACT-SPEC-01') {
        setNewValue('400kW');
        setReason('Silicon-Carbide Gen-3 Inverter Upgrade certification');
      } else {
        setNewValue(fact.current_value);
        setReason('Scheduled commercial policy revision');
      }
    }
  };

  // Run Dependency Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setResolutionSuccess(null);

    try {
      const res = await fetch('/api/facts/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          fact_id: selectedFactId,
          old_value: oldValue,
          new_value: newValue,
          mutation_reason: reason,
          initiated_by: 'Commercial Operations Director'
        })
      });
      if (!res.ok) throw new Error('Analysis failed');
      const data: DependencyIntelligenceResult = await res.json();
      setResult(data);

      // Populate ReactFlow graph
      if (data.dependency_graph) {
        setDepNodes(data.dependency_graph.nodes || []);
        setDepEdges(data.dependency_graph.edges || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Resolve a Revision Task (Human Reviewer Sign-off)
  const handleResolveTask = async () => {
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
      if (!res.ok) throw new Error('Failed to resolve task');
      const resData = await res.json();

      setResolutionSuccess(
        `Task ${selectedTask.task_id} approved & sealed with audit proof: ${resData.task.audit_proof}`
      );

      // Update local task list
      if (result) {
        const updatedTasks = result.revision_tasks.map((t) =>
          t.task_id === selectedTask.task_id ? { ...t, status: 'APPROVED_SEALED' as const } : t
        );
        setResult({ ...result, revision_tasks: updatedTasks });
      }

      setTimeout(() => {
        setSelectedTask(null);
        setResolutionSuccess(null);
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setIsResolving(false);
    }
  };

  // Load Version History for an asset
  const handleViewVersionHistory = async (assetId: string) => {
    setVersionHistoryAssetId(assetId);
    setIsLoadingVersions(true);
    try {
      const res = await fetch(`/api/assets/${assetId}/history`);
      if (res.ok) {
        const data: AssetVersionRecord[] = await res.json();
        setVersionRecords(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // Filtered tasks
  const filteredTasks = result?.revision_tasks.filter((t) => {
    if (taskFilter === 'ALL') return true;
    return t.status === taskFilter;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Fact Mutation & Dependency Intelligence Studio"
        description="Traverse cross-departmental dependencies, simulate asset blast radius, and safely dispatch revision tasks to authorized reviewers without silent overwrites."
        category="Dependency Intelligence"
        workspaceName={brandId}
      >
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Lock className="w-3.5 h-3.5 text-slate-700" />
          Zero-Silent-Overwrite Policy Active
        </div>
      </PageHeader>

      {/* Main Grid: Fact Mutation & Impact Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mutation Studio (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-slate-700" />
                Approved Fact Mutation Studio
              </h3>
            </div>

            {/* Fact Selector */}
            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Select Approved Fact</label>
              <select
                value={selectedFactId}
                onChange={(e) => handleFactChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium shadow-xs"
              >
                {facts.map((f) => (
                  <option key={f.id} value={f.id}>
                    [{f.category}] {f.name} ({f.current_value})
                  </option>
                ))}
              </select>
            </div>

            {/* Old Value vs New Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Current Approved</label>
                <input
                  type="text"
                  value={oldValue}
                  onChange={(e) => setOldValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono"
                  placeholder="e.g. ₹499"
                />
              </div>
              <div>
                <label className="text-xs text-slate-900 font-bold block mb-1">New Proposed</label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900 shadow-xs"
                  placeholder="e.g. ₹599"
                />
              </div>
            </div>

            {/* Mutation Rationale */}
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Business Context & Authority</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for change..."
                className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-mono resize-none leading-relaxed shadow-xs"
              />
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || !oldValue || !newValue}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Traversing Cross-Departmental Dependencies...
                </>
              ) : (
                <>
                  <GitFork className="w-4 h-4 stroke-[2.2]" />
                  Execute Dependency Impact Analysis
                </>
              )}
            </button>
          </div>

          {/* Quick Scenario Preset Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Flagship Scenario Loaded
            </span>
            <div className="text-slate-900 font-semibold">
              Product Price Change: <span className="text-slate-600 font-mono line-through">₹499</span> ➔{' '}
              <span className="text-emerald-700 font-mono font-bold">₹599</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Demonstrates automatic discovery of connected Meta ads, Google PPC ads, checkout pricing pages, and B2B sales PDFs without blind keyword search.
            </p>
          </div>
        </div>

        {/* Right Column: Visual Dependency Canvas & Impact Metrics (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!result && !isAnalyzing && (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 text-slate-700 border border-slate-200">
                <GitFork className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Brand Dependency Intelligence Ready</h4>
              <p className="text-xs text-slate-500 max-w-md">
                Click <strong>Execute Dependency Impact Analysis</strong> to trace all marketing assets, campaigns, and documents dependent on this approved fact.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Impact Banner Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        result.risk_level === 'CRITICAL' || result.risk_level === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {result.risk_level} Impact
                      </span>
                      <span className="text-xs font-mono text-slate-600">
                        Fact: {result.fact_name} ({result.old_value} ➔ {result.new_value})
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                      {result.impact_summary}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">{result.commercial_risk_score}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Exposure Index
                    </div>
                  </div>
                </div>

                {/* 3 Metric Pills */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[10px] font-bold uppercase">Affected Assets</span>
                      <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">{result.total_affected_assets}</div>
                    <div className="text-[10px] text-slate-500">Ads, Websites, PDFs</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[10px] font-bold uppercase">Connected Campaigns</span>
                      <Building className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">{result.total_affected_campaigns}</div>
                    <div className="text-[10px] text-slate-500">Active Campaign Initiatives</div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-[10px] font-bold uppercase">Departments Involved</span>
                      <Users className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                    <div className="text-lg font-bold text-slate-900">{result.total_departments}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {result.affected_departments.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* ReactFlow Interactive Dependency Canvas */}
              <div className="bg-white border border-slate-200 rounded-xl h-[340px] overflow-hidden relative shadow-xs">
                <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-800 flex items-center gap-2 shadow-xs">
                  <GitFork className="w-3.5 h-3.5 text-slate-700" />
                  Live Dependency Tree: {result.fact_name}
                </div>
                <ReactFlow
                  nodes={depNodes}
                  edges={depEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={nodeTypes}
                  fitView
                  minZoom={0.3}
                  maxZoom={1.5}
                  className="bg-white"
                >
                  <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E2E8F0" />
                  <Controls className="!bg-white !border-slate-200 !fill-slate-700 !shadow-xs" />
                </ReactFlow>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actionable Revision Tasks & Reviewer Routing Center */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-800" />
                Revision Tasks & Authorized Reviewer Routing ({result.revision_tasks.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                BrandTrace routes each affected asset to its designated department reviewer. No content is silently altered.
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setTaskFilter('ALL')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  taskFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setTaskFilter('PENDING_REVIEW')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  taskFilter === 'PENDING_REVIEW'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setTaskFilter('APPROVED_SEALED')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  taskFilter === 'APPROVED_SEALED'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Approved & Sealed
              </button>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Task & Resource</th>
                  <th className="py-3 px-4">Department & Reviewer Role</th>
                  <th className="py-3 px-4">Proposed Content Revision</th>
                  <th className="py-3 px-4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredTasks.map((task) => (
                  <tr key={task.task_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-xs">{task.asset_name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {task.asset_type}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mb-1">{task.task_id}</div>
                      <button
                        onClick={() => handleViewVersionHistory(task.asset_id)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-mono cursor-pointer underline"
                      >
                        <History className="w-3 h-3" />
                        View Version Audit Trail
                      </button>
                    </td>

                    <td className="py-4 px-4 align-top">
                      <div className="font-semibold text-slate-900">{task.department}</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-0.5">
                        Assignee: {task.assigned_reviewer_role}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mt-1">
                        Priority: {task.priority}
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top max-w-md">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] leading-relaxed text-slate-800 space-y-1">
                        <div className="text-slate-400 line-through text-[10px]">
                          Old: {task.current_content}
                        </div>
                        <div className="text-emerald-700 font-semibold">
                          Proposed: {task.proposed_content}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top">
                      {task.status === 'APPROVED_SEALED' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved & Sealed
                          </span>
                          {task.audit_proof && (
                            <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                              {task.audit_proof}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setReviewerName(task.assigned_reviewer_role);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Lock className="w-3 h-3" />
                          Review & Authorize
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

      {/* Human Review & Sign-Off Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-800" />
                  Authorized Governance Sign-Off Gate
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Task ID: {selectedTask.task_id} | Asset: {selectedTask.asset_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Zero Silent Overwrite Callout */}
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Human-Controlled Decision Making:</strong> BrandTrace does not silently overwrite approved releases. This action explicitly promotes version v1.1 to v2.0 and generates an immutable audit hash.
              </div>
            </div>

            {/* Diff View */}
            <div className="space-y-2">
              <label className="text-xs text-slate-600 font-semibold block">Approved Content Diff</label>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2 leading-relaxed">
                <div>
                  <span className="text-rose-700 font-bold block text-[10px] uppercase">Original Live Content:</span>
                  <p className="text-slate-500 line-through">{selectedTask.current_content}</p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-emerald-700 font-bold block text-[10px] uppercase">
                    Proposed Remediated Content:
                  </span>
                  <p className="text-emerald-800 font-semibold">{selectedTask.proposed_content}</p>
                </div>
              </div>
            </div>

            {/* Reviewer Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Authorizing Reviewer</label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium shadow-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">Department</label>
                <input
                  type="text"
                  readOnly
                  value={selectedTask.department}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600 font-medium"
                />
              </div>
            </div>

            {/* Resolution Notes */}
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Compliance & Resolution Notes</label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 resize-none font-mono shadow-xs"
              />
            </div>

            {/* Success Message */}
            {resolutionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {resolutionSuccess}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveTask}
                disabled={isResolving}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {isResolving ? 'Sealing in Release Ledger...' : 'Approve & Seal Release v2.0'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Drawer Modal */}
      {versionHistoryAssetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-800" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Immutable Version History</h3>
                  <p className="text-xs text-slate-500">Asset ID: {versionHistoryAssetId}</p>
                </div>
              </div>
              <button
                onClick={() => setVersionHistoryAssetId(null)}
                className="text-xs text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoadingVersions ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading version records...</div>
              ) : versionRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No version history recorded yet.</div>
              ) : (
                versionRecords.map((ver, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      ver.status === 'ACTIVE_APPROVED'
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : ver.status === 'FLAGGED_NEEDS_REVISION'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ver.version_number}</span>
                      <span className="text-[10px] font-mono text-slate-500">{ver.timestamp_iso}</span>
                    </div>

                    <div className="p-2 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-800">
                      {ver.content}
                    </div>

                    <div className="text-[10px] text-slate-500 italic">
                      Change notes: {ver.change_notes}
                    </div>

                    {ver.approval_record && (
                      <div className="pt-1 border-t border-slate-200 text-[10px] text-emerald-700 font-mono flex items-center justify-between">
                        <span>Reviewer: {ver.approval_record.reviewer}</span>
                        <span>Audit: {ver.approval_record.audit_hash.substring(0, 10)}...</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
