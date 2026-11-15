import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, Clock, RefreshCw, 
  Edit3, ShieldCheck, ChevronDown, ChevronUp, FileText,
  Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye, X, Image as ImageIcon
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';

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
  attachment_ids?: string[];
  inspection_report?: any;
  extracted_text?: string;
  status: string;
  submitted_at: string;
  updated_at: string;
  reviewer_feedback?: string;
  compliance_notes?: string;
  rejection_reason?: string;
  approval_history: any[];
  release_seal?: string;
  release_id?: string;
}

interface CreatorSubmissionsViewProps {
  role?: 'creator' | 'agency';
  userId?: string;
  userName?: string;
  orgId?: string;
  brandName?: string;
  onEditAndResubmit?: (submission: SubmissionItem) => void;
}

export type SubmissionFilter = 
  | 'ALL' 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'CHANGES_REQUESTED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'RELEASED';

export type SortOrder = 'NEWEST' | 'OLDEST' | 'VERSION' | 'RISK';

export const CreatorSubmissionsView: React.FC<CreatorSubmissionsViewProps> = ({
  role = 'creator',
  userId,
  userName,
  orgId,
  brandName = 'Aurelle Skin',
  onEditAndResubmit,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [filter, setFilter] = useState<SubmissionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailModalSubmission, setDetailModalSubmission] = useState<SubmissionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Resolve effective identity from auth context, falling back to props
  const effectiveUserId = userId || user?.email || '';
  const effectiveUserName = userName || user?.name || 'Creator';
  const effectiveOrgId = orgId || user?.org_id || 'ORG-AURELLE';

  // Map backend role to the correct API role param
  const getApiRole = (): string => {
    // If the component was explicitly given a role (e.g. 'creator' or 'agency'), honor it
    if (role) return role;
    const backendRole = user?.role || '';
    if (backendRole === 'REVIEWER') return 'reviewer';
    if (backendRole === 'COMPLIANCE_REVIEWER') return 'compliance';
    if (backendRole === 'BRAND_MANAGER' || backendRole === 'ADMIN') return 'brand-owner';
    return 'creator';
  };

  const loadSubmissions = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const apiRole = getApiRole();
      const params = new URLSearchParams({ role: apiRole });
      const brandId = user?.workspace_id || 'aurelle-tech';
      params.set('brand_id', brandId);

      // Only restrict by creator_id if the user is strictly logged in as a Creator.
      // Brand Owners, Admins, or Reviewers exploring the Creator Studio can see all submissions for the brand.
      const isActualCreator = user?.role === 'CREATOR';
      if (isActualCreator && effectiveUserId) {
        params.set('creator_id', effectiveUserId);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      const data = await apiClient.request<SubmissionItem[]>(`/api/submissions?${params.toString()}`, { skipCache: true });
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (error: any) {
      if (error?.status === 403) {
        setLoadError('Your account role does not have access to this submission workspace. Please sign in with a Creator account.');
      } else if (error?.status === 0 || error?.status === 503) {
        setLoadError(error?.message || 'Backend is unreachable. Please verify that the backend server is running on http://127.0.0.1:8000.');
      } else {
        setLoadError(error?.message || 'Unable to load submissions. Please try refreshing.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, effectiveUserId, user?.role]);

  // Compute filter counts
  const filterCounts = useMemo(() => {
    return {
      ALL: submissions.length,
      DRAFT: submissions.filter((s) => s.status === 'DRAFT').length,
      SUBMITTED: submissions.filter((s) => s.status === 'SUBMITTED').length,
      UNDER_REVIEW: submissions.filter((s) => s.status === 'PENDING_REVIEW' || s.status === 'IN_REVIEW' || s.status === 'SUBMITTED').length,
      CHANGES_REQUESTED: submissions.filter((s) => 
        s.status === 'CHANGES_REQUESTED' || s.status === 'RETURNED_TO_CREATOR' || s.status === 'RETURNED_TO_AGENCY'
      ).length,
      APPROVED: submissions.filter((s) => 
        s.status === 'APPROVED' || s.status === 'REVIEW_APPROVED' || s.status === 'COMPLIANCE_APPROVED'
      ).length,
      REJECTED: submissions.filter((s) => s.status === 'REJECTED').length,
      RELEASED: submissions.filter((s) => s.status === 'RELEASED').length,
    };
  }, [submissions]);

  // Filter and Search logic
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Status Filter
      if (filter === 'DRAFT' && sub.status !== 'DRAFT') return false;
      if (filter === 'SUBMITTED' && sub.status !== 'SUBMITTED') return false;
      if (filter === 'UNDER_REVIEW' && !['PENDING_REVIEW', 'IN_REVIEW', 'SUBMITTED'].includes(sub.status)) return false;
      if (filter === 'CHANGES_REQUESTED' && !['CHANGES_REQUESTED', 'RETURNED_TO_CREATOR', 'RETURNED_TO_AGENCY'].includes(sub.status)) return false;
      if (filter === 'APPROVED' && !['APPROVED', 'REVIEW_APPROVED', 'COMPLIANCE_APPROVED'].includes(sub.status)) return false;
      if (filter === 'REJECTED' && sub.status !== 'REJECTED') return false;
      if (filter === 'RELEASED' && sub.status !== 'RELEASED') return false;

      // 2. Client-side Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = sub.title?.toLowerCase().includes(q);
        const matchesContent = sub.current_content?.toLowerCase().includes(q) || sub.original_content?.toLowerCase().includes(q);
        const matchesId = sub.submission_id?.toLowerCase().includes(q);
        const matchesBrand = sub.brand_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesContent && !matchesId && !matchesBrand) return false;
      }

      return true;
    });
  }, [submissions, filter, searchQuery]);

  // Sorting logic
  const sortedSubmissions = useMemo(() => {
    const list = [...filteredSubmissions];
    if (sortOrder === 'NEWEST') {
      list.sort((a, b) => (b.updated_at || b.submitted_at || '').localeCompare(a.updated_at || a.submitted_at || ''));
    } else if (sortOrder === 'OLDEST') {
      list.sort((a, b) => (a.submitted_at || '').localeCompare(b.submitted_at || ''));
    } else if (sortOrder === 'VERSION') {
      list.sort((a, b) => (b.version || 1) - (a.version || 1));
    } else if (sortOrder === 'RISK') {
      const getBlocking = (s: SubmissionItem) => (s.findings || []).filter((f: any) => f.severity === 'BLOCKING').length;
      list.sort((a, b) => getBlocking(b) - getBlocking(a));
    }
    return list;
  }, [filteredSubmissions, sortOrder]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedSubmissions.length / pageSize));
  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSubmissions.slice(start, start + pageSize);
  }, [sortedSubmissions, currentPage, pageSize]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortOrder]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* 1. Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
            BRANDTRACE · {brandName.toUpperCase()} · {effectiveUserName.toUpperCase()} ({effectiveOrgId})
          </div>
          <button
            onClick={loadSubmissions}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
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

      {loadError && (
        <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-4 text-sm text-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-mono font-bold text-rose-300 text-xs uppercase tracking-wider mb-1">Unable to load submissions</div>
            <div className="text-rose-200/80">{loadError}</div>
            <button
              onClick={loadSubmissions}
              className="mt-2 text-xs font-mono text-rose-300 hover:text-white underline underline-offset-2 cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* 2. Search & Sort Controls Bar */}
      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ID (e.g. SUB-001), or copy keywords..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-sans text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sort:</span>
          </div>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="VERSION">Highest Version</option>
            <option value="RISK">Highest Risk</option>
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>

      </div>

      {/* 3. Comprehensive Filter Tabs */}
      <div className="flex items-center gap-1.5 pt-1 border-b border-neutral-800 pb-3 overflow-x-auto no-scrollbar flex-nowrap">
        
        {/* All */}
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap shrink-0 ${
            filter === 'ALL'
              ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          All ({filterCounts.ALL})
        </button>

        {/* Changes Requested */}
        <button
          onClick={() => setFilter('CHANGES_REQUESTED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            filter === 'CHANGES_REQUESTED'
              ? 'bg-amber-950 border-amber-600 text-amber-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-amber-400 hover:border-amber-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Changes Requested ({filterCounts.CHANGES_REQUESTED})</span>
        </button>

        {/* Under Review */}
        <button
          onClick={() => setFilter('UNDER_REVIEW')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap shrink-0 ${
            filter === 'UNDER_REVIEW'
              ? 'bg-purple-950 border-purple-600 text-purple-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Under Review ({filterCounts.UNDER_REVIEW})
        </button>

        {/* Submitted */}
        <button
          onClick={() => setFilter('SUBMITTED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap shrink-0 ${
            filter === 'SUBMITTED'
              ? 'bg-blue-950 border-blue-600 text-blue-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Submitted ({filterCounts.SUBMITTED})
        </button>

        {/* Approved */}
        <button
          onClick={() => setFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap shrink-0 ${
            filter === 'APPROVED'
              ? 'bg-emerald-950 border-emerald-600 text-emerald-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Approved ({filterCounts.APPROVED})
        </button>

        {/* Released */}
        <button
          onClick={() => setFilter('RELEASED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border flex items-center gap-1 whitespace-nowrap shrink-0 ${
            filter === 'RELEASED'
              ? 'bg-cyan-950 border-cyan-600 text-cyan-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Released ({filterCounts.RELEASED})</span>
        </button>

        {/* Rejected */}
        <button
          onClick={() => setFilter('REJECTED')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap shrink-0 ${
            filter === 'REJECTED'
              ? 'bg-rose-950 border-rose-600 text-rose-300 font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Rejected ({filterCounts.REJECTED})
        </button>

        {/* Drafts */}
        <button
          onClick={() => setFilter('DRAFT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border whitespace-nowrap shrink-0 ${
            filter === 'DRAFT'
              ? 'bg-neutral-800 border-neutral-600 text-white font-bold'
              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Drafts ({filterCounts.DRAFT})
        </button>

      </div>

      {/* 4. Submissions Feed */}
      <div className="space-y-4">
        {paginatedSubmissions.length === 0 ? (
          <div className="p-10 rounded-2xl bg-neutral-950 border border-neutral-800 text-center space-y-2.5">
            <FileText className="w-8 h-8 text-neutral-600 mx-auto" />
            <div className="text-sm font-mono font-bold text-white uppercase">No matching submissions</div>
            <p className="text-xs text-neutral-400 font-sans max-w-sm mx-auto">
              {searchQuery ? `No records match search "${searchQuery}".` : 'No submissions found under this filter.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-mono text-indigo-400 hover:underline cursor-pointer pt-1"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          paginatedSubmissions.map((sub, idx) => {
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
            const hasAttachments = Boolean(sub.attachment_ids && sub.attachment_ids.length > 0);

            const blockingCount = (sub.findings || []).filter((f: any) => f.severity === 'BLOCKING' && !f.resolved).length;
            const advisoryCount = (sub.findings || []).filter((f: any) => f.severity === 'ADVISORY' && !f.resolved).length;

            return (
              <motion.div
                key={sub.submission_id}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: shouldReduceMotion ? 0 : Math.min(idx * 0.04, 0.2) }}
                className={`bg-neutral-950 border rounded-2xl p-5 space-y-4 transition-all duration-200 shadow-xl ${
                  isChangesReq
                    ? 'border-amber-600/70 shadow-amber-950/20'
                    : isRejected
                    ? 'border-rose-600/60 shadow-rose-950/20'
                    : isApproved
                    ? 'border-emerald-700/50'
                    : 'border-neutral-800 hover:border-neutral-700 hover:bg-[#121217]'
                }`}
              >
                {/* Header Line */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Status Badge */}
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

                    {/* Version Badge */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-800 text-neutral-300 uppercase">
                      v{sub.version || 1}
                    </span>

                    {/* Channel */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 uppercase">
                      {sub.channel}
                    </span>

                    {/* Image Attachment indicator */}
                    {hasAttachments && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/50 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        <span>Image Attached</span>
                      </span>
                    )}

                    {/* Submission ID */}
                    <span className="text-[10px] font-mono text-neutral-400">
                      ID: {sub.submission_id}
                    </span>

                  </div>

                  {/* Submission Timestamp */}
                  <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>Submitted: {sub.submitted_at || 'Recently'}</span>
                  </div>
                </div>

                {/* Submitter & Organization Info */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-400">
                  <span>Submitter:</span>
                  <strong className="text-white">{sub.creator_name}</strong>
                  <span>·</span>
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-neutral-900 border border-neutral-700 text-neutral-300 uppercase">
                    {sub.org_id || orgId}
                  </span>
                  <span>·</span>
                  <span className="text-neutral-400">
                    Client: <strong className="text-neutral-200">{sub.brand_name}</strong>
                  </span>
                  {blockingCount > 0 && (
                    <span className="text-rose-400 text-[10.5px] font-mono">
                      ({blockingCount} blocking risk)
                    </span>
                  )}
                  {advisoryCount > 0 && (
                    <span className="text-neutral-400 text-[10.5px] font-mono">
                      ({advisoryCount} advisory)
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white font-sans leading-snug">
                  {sub.title}
                </h3>

                {/* Content Preview Box */}
                <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs sm:text-sm font-sans text-neutral-200 leading-relaxed whitespace-pre-wrap">
                  {(sub.current_content || sub.original_content || '').slice(0, 240)}
                  {(sub.current_content || sub.original_content || '').length > 240 ? '...' : ''}
                </div>

                {/* Cryptographic Release Seal Banner for Released Submissions */}
                {(sub.release_seal || sub.release_id) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="text-cyan-300 font-bold uppercase tracking-wider">CRYPTOGRAPHIC RELEASE SEAL:</span>
                      <span className="text-white font-bold">{sub.release_seal || sub.release_id}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-sans">
                      Verified against Brand Knowledge Graph & SHA-256 Digest
                    </span>
                  </div>
                )}

                {/* Reviewer Feedback Banner (Active when Changes Requested) */}
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

                    <p className="text-xs sm:text-sm text-amber-100 font-sans leading-relaxed">
                      "{sub.reviewer_feedback || "Changes requested on draft copy. Please update and re-submit."}"
                    </p>

                    <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <button
                        onClick={() => {
                          if (onEditAndResubmit) {
                            onEditAndResubmit(sub);
                          }
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit & Resubmit (v{(sub.version || 1) + 1})</span>
                      </button>
                      <span className="text-[11px] font-mono text-amber-300/80">
                        Loads into Check a Post editor to revise and re-verify.
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Action Controls */}
                <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDetailModalSubmission(sub)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Details</span>
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : sub.submission_id)}
                      className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{isExpanded ? 'Hide Approval Trail' : 'Approval Trail'}</span>
                    </button>
                  </div>

                  {isApproved && sub.release_seal && (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>SEAL: {sub.release_seal}</span>
                    </div>
                  )}

                  {!isChangesReq && onEditAndResubmit && (
                    <button
                      onClick={() => onEditAndResubmit(sub)}
                      className="text-neutral-400 hover:text-indigo-400 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Revise Content →
                    </button>
                  )}

                </div>

                {/* Inline Expanded Approval Trail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {(sub.approval_history || []).map((step: any, sIdx: number) => (
                          <div
                            key={sIdx}
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

      {/* 5. Pagination Controls */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="text-neutral-400">
            Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, sortedSubmissions.length)} of {sortedSubmissions.length} submissions
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 disabled:opacity-30 disabled:cursor-not-allowed text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Comprehensive Submission Detail Modal */}
      {detailModalSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-neutral-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                    SUBMISSION DETAILS · {detailModalSubmission.submission_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                    v{detailModalSubmission.version || 1}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold font-sans text-white">
                  {detailModalSubmission.title}
                </h2>
              </div>
              <button
                onClick={() => setDetailModalSubmission(null)}
                className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-0.5">
                <div className="text-[10px] text-neutral-500 uppercase">Workflow Status</div>
                <div className="font-bold text-white uppercase">{detailModalSubmission.status.replace(/_/g, ' ')}</div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-0.5">
                <div className="text-[10px] text-neutral-500 uppercase">Target Channel</div>
                <div className="font-bold text-white uppercase">{detailModalSubmission.channel}</div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-0.5">
                <div className="text-[10px] text-neutral-500 uppercase">Submitted By</div>
                <div className="font-bold text-white truncate">{detailModalSubmission.creator_name}</div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-0.5">
                <div className="text-[10px] text-neutral-500 uppercase">Submitted At</div>
                <div className="font-bold text-white">{detailModalSubmission.submitted_at || 'Recent'}</div>
              </div>
            </div>

            {/* Content Display: Original vs Current Content */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                  Post Copy (Version {detailModalSubmission.version || 1})
                </h4>
                {detailModalSubmission.original_content && detailModalSubmission.original_content !== detailModalSubmission.current_content && (
                  <span className="text-[10.5px] font-mono text-emerald-400">
                    Revised from original draft
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm font-sans text-white whitespace-pre-wrap leading-relaxed">
                {detailModalSubmission.current_content || detailModalSubmission.original_content}
              </div>

              {detailModalSubmission.original_content && detailModalSubmission.original_content !== detailModalSubmission.current_content && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Original Draft (v1):</div>
                  <p className="text-xs font-sans text-neutral-400 line-through opacity-75">
                    {detailModalSubmission.original_content}
                  </p>
                </div>
              )}
            </div>

            {/* Reviewer Feedback Box if present */}
            {detailModalSubmission.reviewer_feedback && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/70 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Reviewer Feedback</span>
                </div>
                <p className="text-xs sm:text-sm font-sans text-amber-100">
                  "{detailModalSubmission.reviewer_feedback}"
                </p>
              </div>
            )}

            {/* Finding-by-finding report */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                Audited Findings ({(detailModalSubmission.findings || []).length})
              </h4>
              {(detailModalSubmission.findings || []).length === 0 ? (
                <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>All policy, brand, and fact checks resolved.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(detailModalSubmission.findings || []).map((f: any, fIdx: number) => (
                    <div
                      key={fIdx}
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            f.severity === 'BLOCKING' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-neutral-800 text-neutral-300'
                          }`}>
                            {f.severity || 'BLOCKING'}
                          </span>
                          <span className="font-mono text-neutral-400 text-[10px]">{f.rule_id || f.id}</span>
                          <span className="font-bold text-white text-xs">{f.rule_title || 'Finding'}</span>
                        </div>
                        <div className="text-neutral-400 text-[11px]">
                          Flagged: <strong className="text-rose-300">"{f.flagged_text || f.sentence_text}"</strong>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono uppercase px-2 py-1 rounded shrink-0 ${
                        f.resolved ? 'bg-emerald-950 text-emerald-300' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {f.resolved ? '✓ Resolved' : (f.decision || 'Undecided')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approval Lifecycle Trail */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider">
                Governance Approval Lifecycle
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {(detailModalSubmission.approval_history || []).map((step: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                      step.status === 'COMPLETED'
                        ? 'bg-neutral-900 border-emerald-900/50 text-neutral-200'
                        : step.status === 'REJECTED'
                        ? 'bg-amber-950/30 border-amber-900/50 text-amber-200'
                        : 'bg-neutral-900/40 border-neutral-800 text-neutral-500'
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
                    <div className="text-[11px] font-bold text-white">{step.user}</div>
                    {step.comments && (
                      <div className="text-[10px] text-neutral-300 font-sans italic pt-0.5">
                        "{step.comments}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-3">
              <button
                onClick={() => setDetailModalSubmission(null)}
                className="px-4 py-2 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-xs font-mono uppercase cursor-pointer"
              >
                Close
              </button>

              {onEditAndResubmit && (
                <button
                  onClick={() => {
                    const subToEdit = detailModalSubmission;
                    setDetailModalSubmission(null);
                    onEditAndResubmit(subToEdit);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Revise in Check a Post</span>
                </button>
              )}
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
};
