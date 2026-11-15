import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, Clock, RefreshCw, 
  Edit3, ShieldCheck, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export interface SubmissionItem {
  submission_id: string;
  task_id?: string;
  brand_id: string;
  brand_name: string;
  title: string;
  channel: string;
  creator_id: string;
  creator_name: string;
  creator_type?: string;
  org_id?: string;
  analysis_id?: string;
  version: number;
  original_content: string;
  current_content: string;
  findings: any[];
  status: string;
  submitted_at: string;
  updated_at: string;
  reviewer_feedback?: string;
  compliance_notes?: string;
  rejection_reason?: string;
  approval_history: any[];
  release_seal?: string;
}

interface CreatorSubmissionsViewProps {
  role?: 'creator' | 'agency';
  userName?: string;
  orgId?: string;
  brandName?: string;
  onEditAndResubmit?: (submission: SubmissionItem) => void;
}

const DEFAULT_SUBMISSIONS: SubmissionItem[] = [
  {
    submission_id: 'SUB-AGENCY-001',
    task_id: 'REV-AGENCY-01',
    brand_id: 'aurelle-tech',
    brand_name: 'Aurelle Skin',
    title: 'Agency Teaser: Aurelle Next-Gen Environmental Defense Formulation',
    channel: 'instagram',
    creator_id: 'USR-AGENCY-001',
    creator_name: 'Agency Sana',
    creator_type: 'agency',
    org_id: 'ORG-AGENCY-PULSE',
    analysis_id: 'VRF-AGY-9021',
    version: 1,
    original_content: 'Something game-changing is dropping this Friday. Aurelle Skin is launching the ultimate defense against environmental pollution and premature aging. 100% natural, zero toxins, guaranteed glass skin in 7 days.',
    current_content: 'Something game-changing is dropping this Friday. Aurelle Skin is launching the ultimate defense against environmental pollution and premature aging. 100% natural, zero toxins, guaranteed glass skin in 7 days.',
    status: 'CHANGES_REQUESTED',
    submitted_at: 'Today, 11:20 am',
    updated_at: 'Today, 11:45 am',
    reviewer_feedback: "Reviewer Meera: '100% natural, zero toxins' violates REG-01 (Greenwashing). Please replace with approved 94% naturally derived ingredients and remove 'guaranteed in 7 days'.",
    findings: [
      {
        number: 1,
        rule_id: 'REG-01',
        rule_title: 'ASCI Greenwashing Directive',
        flagged_text: '100% natural, zero toxins',
        severity: 'BLOCKING',
        suggested_fix: 'formulated with 94% naturally derived ingredients',
        explanation: 'Absolute unquantified 100% natural claims are prohibited without lifecycle documentation.'
      },
      {
        number: 2,
        rule_id: 'GL-AUR-03',
        rule_title: 'Prohibited Absolute Guarantees',
        flagged_text: 'guaranteed glass skin in 7 days',
        severity: 'BLOCKING',
        suggested_fix: 'visibly brighter skin with daily use',
        explanation: 'Time-bound cosmetic outcome guarantees are prohibited by Aurelle Brand Book.'
      }
    ],
    approval_history: [
      {
        stage: 'CREATOR_SUBMISSION',
        label: 'Agency Submission',
        user: 'Agency Sana',
        role: 'Agency Partner',
        status: 'COMPLETED',
        timestamp: 'Today, 11:20 am',
        comments: 'Campaign teaser draft submitted for client Aurelle Skin.'
      },
      {
        stage: 'REVIEWER_APPROVAL',
        label: 'Reviewer Feedback',
        user: 'Reviewer Meera',
        role: 'Reviewer',
        status: 'REJECTED',
        timestamp: 'Today, 11:45 am',
        comments: 'Changes requested on greenwashing and outcome guarantee claims.'
      }
    ]
  },
  {
    submission_id: 'SUB-SEED-001',
    task_id: 'REV-SEED-01',
    brand_id: 'aurelle-tech',
    brand_name: 'Aurelle Skin',
    title: 'Meet the NEW Aurelle Vitamin-C serum! 100% natural, eco-friendly and clinically proven to fade dark spot...',
    channel: 'instagram',
    creator_id: 'asha@aurelle.com',
    creator_name: 'Creator Asha',
    creator_type: 'creator',
    org_id: 'ORG-AURELLE',
    analysis_id: 'VRF-F10B6DE0FB',
    version: 2,
    original_content: 'Meet the NEW Aurelle Vitamin-C serum! 100% natural, completely eco-friendly and clinically proven to fade dark spots by 60% in just 2 weeks. Doctor approved with zero side effects. Shop today!',
    current_content: 'Meet the NEW Aurelle Vitamin-C serum! Formulated with 94% naturally derived ingredients and clinically shown to fade dark spots by 32% in 8 weeks (FACT-014). Dermatologist tested with clean ingredients. Shop now!',
    status: 'APPROVED',
    submitted_at: '12 Nov 2026, 9:01 am',
    updated_at: '12 Nov 2026, 11:30 am',
    findings: [],
    approval_history: [
      {
        stage: 'CREATOR_SUBMISSION',
        label: 'Creator Submission',
        user: 'Creator Asha',
        role: 'Creator',
        status: 'COMPLETED',
        timestamp: '12 Nov 2026, 9:01 am',
        comments: 'Revision v2 submitted with approved clinical benchmark citations.'
      },
      {
        stage: 'REVIEWER_APPROVAL',
        label: 'Reviewer Approval',
        user: 'Reviewer Meera',
        role: 'Reviewer',
        status: 'COMPLETED',
        timestamp: '12 Nov 2026, 10:15 am',
        comments: 'Verified protocol AUR-LAB-014 citations. Approved.'
      },
      {
        stage: 'COMPLIANCE_APPROVAL',
        label: 'Compliance Sign-off',
        user: 'Compliance Arjun',
        role: 'Compliance Officer',
        status: 'COMPLETED',
        timestamp: '12 Nov 2026, 11:30 am',
        comments: 'Statutory fair-balance compliance verified.'
      }
    ],
    release_seal: 'BT-SEAL-78FA91'
  }
];

export const CreatorSubmissionsView: React.FC<CreatorSubmissionsViewProps> = ({
  role = 'agency',
  userName = 'Agency Sana',
  orgId = 'ORG-AGENCY-PULSE',
  brandName = 'Aurelle Skin',
  onEditAndResubmit,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(DEFAULT_SUBMISSIONS);
  const [filter, setFilter] = useState<'ALL' | 'CHANGES_REQUESTED' | 'PENDING' | 'APPROVED'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>('SUB-AGENCY-001');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.request<SubmissionItem[]>('/api/submissions');
      if (Array.isArray(data) && data.length > 0) {
        // Merge with defaults to ensure full richness
        const existingIds = new Set(data.map((d) => d.submission_id));
        const combined = [...data, ...DEFAULT_SUBMISSIONS.filter((dp) => !existingIds.has(dp.submission_id))];
        setSubmissions(combined);
      }
    } catch {
      // Fallback to in-memory state on offline or mock mode
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === 'ALL') return true;
    if (filter === 'CHANGES_REQUESTED') return sub.status === 'CHANGES_REQUESTED' || sub.status === 'RETURNED_TO_CREATOR' || sub.status === 'RETURNED_TO_AGENCY';
    if (filter === 'PENDING') return sub.status === 'PENDING_REVIEW' || sub.status === 'SUBMITTED' || sub.status === 'IN_REVIEW';
    if (filter === 'APPROVED') return sub.status === 'APPROVED' || sub.status === 'RELEASED' || sub.status === 'REVIEW_APPROVED' || sub.status === 'COMPLIANCE_APPROVED';
    return true;
  });

  const changesRequestedCount = submissions.filter(
    (s) => s.status === 'CHANGES_REQUESTED' || s.status === 'RETURNED_TO_CREATOR' || s.status === 'RETURNED_TO_AGENCY'
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            BRANDTRACE · {brandName.toUpperCase()} · {userName.toUpperCase()} ({orgId})
          </div>
          <button
            onClick={loadSubmissions}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Submissions</span>
          </button>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          {role === 'agency' ? 'CLIENT SUBMISSIONS' : 'MY SUBMISSIONS'}
        </h1>
        <p className="text-xs sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          {role === 'agency'
            ? 'Track content submitted on behalf of your client brands. Review feedback, make requested revisions, and resubmit for approval.'
            : 'Track the status of your submitted posts. View reviewer comments, revise drafts, and track releases.'}
        </p>
      </div>

      {/* Filter Tabs: Horizontal Swipe on Mobile */}
      <div className="flex items-center gap-2 pt-2 border-b border-neutral-800 pb-4 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap min-h-[40px] shrink-0 ${
            filter === 'ALL'
              ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          All Submissions ({submissions.length})
        </button>

        <button
          onClick={() => setFilter('CHANGES_REQUESTED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1.5 whitespace-nowrap min-h-[40px] shrink-0 ${
            filter === 'CHANGES_REQUESTED'
              ? 'bg-amber-950/80 border-amber-600 text-amber-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-amber-400 hover:border-amber-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Changes Requested ({changesRequestedCount})</span>
        </button>

        <button
          onClick={() => setFilter('PENDING')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap min-h-[40px] shrink-0 ${
            filter === 'PENDING'
              ? 'bg-purple-950/80 border-purple-600 text-purple-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Waiting for Review
        </button>

        <button
          onClick={() => setFilter('APPROVED')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap min-h-[40px] shrink-0 ${
            filter === 'APPROVED'
              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Approved & Released
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-2">
            <FileText className="w-8 h-8 text-neutral-500 mx-auto" />
            <div className="text-sm font-mono font-bold text-white uppercase">No matching submissions</div>
            <p className="text-xs text-neutral-400 font-sans">
              There are no submissions matching the selected filter state.
            </p>
          </div>
        ) : (
          filteredSubmissions.map((sub, idx) => {
            const isExpanded = expandedId === sub.submission_id;
            const isChangesReq =
              sub.status === 'CHANGES_REQUESTED' ||
              sub.status === 'RETURNED_TO_CREATOR' ||
              sub.status === 'RETURNED_TO_AGENCY';
            const isApproved =
              sub.status === 'APPROVED' ||
              sub.status === 'RELEASED' ||
              sub.status === 'COMPLIANCE_APPROVED' ||
              sub.status === 'REVIEW_APPROVED';
            const isRejected = sub.status === 'REJECTED';

            return (
              <motion.div
                key={sub.submission_id}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: shouldReduceMotion ? 0 : Math.min(idx * 0.05, 0.2) }}
                className={`bg-neutral-950 border rounded-2xl p-5 space-y-4 transition-all duration-200 ${
                  isChangesReq
                    ? 'border-amber-600/60 shadow-lg shadow-amber-950/20'
                    : isRejected
                    ? 'border-rose-600/60 shadow-lg shadow-rose-950/20'
                    : isApproved
                    ? 'border-emerald-700/50'
                    : 'border-neutral-800 hover:border-blue-500/40 hover:bg-[#121217]'
                }`}
              >
                {/* Header: Status, Channel, Version, ID, Date */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isChangesReq
                          ? 'bg-amber-950 border border-amber-500/50 text-amber-300'
                          : isRejected
                          ? 'bg-rose-950 border border-rose-500/50 text-rose-300'
                          : isApproved
                          ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                          : 'bg-purple-950 border border-purple-500/50 text-purple-300'
                      }`}
                    >
                      {sub.status.replace(/_/g, ' ')}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-300 uppercase">
                      VERSION {sub.version}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 uppercase">
                      {sub.channel}
                    </span>

                    <span className="text-[10px] font-mono text-neutral-500">
                      ID: {sub.submission_id}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>Submitted: {sub.submitted_at}</span>
                  </div>
                </div>

                {/* Submitter & Organization Info */}
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                  <span>Submitter:</span>
                  <strong className="text-white">{sub.creator_name}</strong>
                  <span>·</span>
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-neutral-900 border border-neutral-700 text-neutral-300 uppercase">
                    {sub.org_id || orgId}
                  </span>
                  <span>·</span>
                  <span className="text-neutral-500">
                    Client: <strong className="text-neutral-300">{sub.brand_name}</strong>
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white font-sans leading-snug">
                  {sub.title}
                </h3>

                {/* Content Box */}
                <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs sm:text-sm font-sans text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {sub.current_content || sub.original_content}
                </div>

                {/* CRITICAL REVISION WORKFLOW: Reviewer Feedback Box for CHANGES_REQUESTED */}
                {isChangesReq && (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>REVIEWER FEEDBACK (Action Required)</span>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400/80 shrink-0">
                        Reviewer Meera
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-amber-100 font-sans leading-relaxed pl-0 sm:pl-6">
                      {sub.reviewer_feedback ||
                        "Changes requested on draft claims. Please revise and align with certified brand facts before re-submission."}
                    </p>

                    {/* Action: Edit & Resubmit Button */}
                    <div className="pt-1 pl-0 sm:pl-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <button
                        onClick={() => {
                          if (onEditAndResubmit) {
                            onEditAndResubmit(sub);
                          }
                        }}
                        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 min-h-[46px] active:scale-[0.98]"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit & Resubmit (v{sub.version + 1})</span>
                      </button>
                      <span className="text-[11px] font-mono text-amber-300/80">
                        Loads draft in Content Checker to revise and re-verify.
                      </span>
                    </div>
                  </div>
                )}

                {/* Approval Lifecycle Accordion Toggle */}
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sub.submission_id)}
                    className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{isExpanded ? 'Hide Approval Trail' : 'View Approval Trail & Findings'}</span>
                  </button>

                  {isApproved && sub.release_seal && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>SEAL: {sub.release_seal}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Approval Trail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(sub.approval_history || []).map((step: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                              step.status === 'COMPLETED'
                                ? 'bg-neutral-900/90 border-emerald-900/50 text-neutral-200'
                                : step.status === 'REJECTED'
                                ? 'bg-amber-950/30 border-amber-900/50 text-amber-200'
                                : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold">{step.label}</span>
                              {step.status === 'COMPLETED' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : step.status === 'REJECTED' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="text-[11px] font-semibold text-white">{step.user}</div>
                            {step.timestamp && <div className="text-[9px] text-neutral-400">{step.timestamp}</div>}
                            {step.comments && (
                              <div className="text-[10px] text-neutral-300 font-sans italic pt-1">
                                "{step.comments}"
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
};
