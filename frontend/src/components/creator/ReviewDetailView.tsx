import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, 
  Clock, Check, X
} from 'lucide-react';

export interface FindingDetail {
  id: string;
  number: number;
  severity: 'BLOCKING' | 'MAJOR' | 'MINOR' | 'NEEDS_HUMAN';
  title: string;
  ruleCitation: string;
  evidenceRef?: string;
  rejectedText: string;
  approvedText: string;
  recommendation: string;
  status?: string;
  decision?: 'UPHELD' | 'OVERRULED' | 'UNDECIDED';
  overruleReason?: string;
  reviewerComment?: string;
}

export interface ReviewPostItem {
  id: string;
  submission_id?: string;
  blockingCount: number;
  status: string;
  statusColor: 'emerald' | 'purple' | 'amber' | 'rose';
  title: string;
  meta: string;
  badges: string[];
  content?: string;
  findings?: any[];
  creatorName?: string;
  creatorType?: string;
  orgId?: string;
  channel?: string;
  version?: number;
  reviewerFeedback?: string;
  submittedAt?: string;
}

export type ReviewDecisionType = 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT' | 'REQUEST_EVIDENCE';

interface ReviewDetailViewProps {
  post: ReviewPostItem;
  roleName?: string;
  userName?: string;
  brandName?: string;
  onBack: () => void;
  onSubmitDecision: (
    decision: ReviewDecisionType,
    feedback: string,
    findingDecisions: Record<string, { decision: 'UPHELD' | 'OVERRULED'; overrule_reason?: string; comment?: string }>
  ) => Promise<void>;
}

export const ReviewDetailView: React.FC<ReviewDetailViewProps> = ({
  post,
  roleName = 'REVIEWER',
  userName = 'REVIEWER MEERA',
  brandName = 'Aurelle Skin',
  onBack,
  onSubmitDecision,
}) => {
  const [contentMode, setContentMode] = useState<'submitted' | 'suggested'>('submitted');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string>(post.reviewerFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Normalize findings list
  const [normalizedFindings] = useState<FindingDetail[]>(() => {
    return (post.findings || []).map((f: any, idx: number) => {
      const num = f.number || idx + 1;
      const fid = f.id || `f-${num}`;
      return {
        id: fid,
        number: num,
        severity: (f.severity || 'BLOCKING').toUpperCase() as any,
        title: f.title || f.rule_title || `Finding #${num}`,
        ruleCitation: f.ruleCitation || f.rule_id || 'Brand Rulebook §4.1',
        evidenceRef: f.evidenceRef || f.evidence_ref || 'Approved Brand Fact FACT-014',
        rejectedText: f.rejectedText || f.flagged_text || '',
        approvedText: f.approvedText || f.suggested_fix || '',
        recommendation: f.recommendation || f.explanation || 'Claim must align with verified facts.',
        decision: f.decision || (f.status === 'OVERRULED' ? 'OVERRULED' : f.status === 'UPHELD' ? 'UPHELD' : 'UNDECIDED'),
        overruleReason: f.overrule_reason || '',
        reviewerComment: f.reviewer_comment || '',
      };
    });
  });

  // Decisions state
  const [decisions, setDecisions] = useState<
    Record<string, { decision: 'UPHELD' | 'OVERRULED' | 'UNDECIDED'; overrule_reason?: string; comment?: string }>
  >(() => {
    const init: Record<string, any> = {};
    normalizedFindings.forEach((f) => {
      if (f.decision && f.decision !== 'UNDECIDED') {
        init[f.id] = {
          decision: f.decision,
          overrule_reason: f.overruleReason || '',
          comment: f.reviewerComment || '',
        };
      }
    });
    return init;
  });

  const rawContent = post.content || post.title;

  // Calculate metrics
  const blockingCount = normalizedFindings.filter((f) => f.severity === 'BLOCKING').length;
  const stillToDecideCount = normalizedFindings.filter(
    (f) => !decisions[f.id] || (decisions[f.id].decision !== 'UPHELD' && decisions[f.id].decision !== 'OVERRULED')
  ).length;

  // Generate suggested / remediated content
  const suggestedContent = (() => {
    let text = rawContent;
    normalizedFindings.forEach((f) => {
      if (f.rejectedText && text.includes(f.rejectedText) && f.approvedText) {
        text = text.replace(f.rejectedText, f.approvedText);
      }
    });
    return text;
  })();

  // Toggle single finding decision
  const handleSetDecision = (findingId: string, choice: 'UPHELD' | 'OVERRULED') => {
    setDecisions((prev) => ({
      ...prev,
      [findingId]: {
        ...prev[findingId],
        decision: choice,
        overrule_reason: choice === 'OVERRULED' ? (prev[findingId]?.overrule_reason || '') : '',
      },
    }));
    setSelectedFindingId(findingId);
    setErrorMessage(null);
  };

  const handleUpdateOverruleReason = (findingId: string, reason: string) => {
    setDecisions((prev) => ({
      ...prev,
      [findingId]: {
        ...prev[findingId],
        decision: 'OVERRULED',
        overrule_reason: reason,
      },
    }));
  };

  const handleUpdateFindingComment = (findingId: string, comment: string) => {
    setDecisions((prev) => ({
      ...prev,
      [findingId]: {
        ...(prev[findingId] || { decision: 'UPHELD' }),
        comment: comment,
      },
    }));
  };

  // Scroll to finding card on click
  const handleHighlightClick = (findingId: string) => {
    setSelectedFindingId(findingId);
    const el = document.getElementById(`review-finding-card-${findingId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Execute review decision with validation
  const handleTriggerDecision = async (decisionType: ReviewDecisionType) => {
    setErrorMessage(null);

    // Validation: if overturning, require reason
    const overruledFindingsMissingReason = normalizedFindings.filter(
      (f) => decisions[f.id]?.decision === 'OVERRULED' && !decisions[f.id]?.overrule_reason?.trim()
    );

    if (overruledFindingsMissingReason.length > 0) {
      setErrorMessage(
        `Overturn reasoning required for Finding #${overruledFindingsMissingReason[0].number}. Please specify the rationale.`
      );
      setSelectedFindingId(overruledFindingsMissingReason[0].id);
      return;
    }

    if (decisionType === 'REQUEST_CHANGES' && !overallFeedback.trim()) {
      setErrorMessage('Please provide review feedback explaining the revisions required before sending back.');
      return;
    }

    if (decisionType === 'REQUEST_EVIDENCE' && !overallFeedback.trim()) {
      setErrorMessage('Please specify the exact clinical trials, lab reports, or regulatory documentation required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalDecisions: Record<string, { decision: 'UPHELD' | 'OVERRULED'; overrule_reason?: string; comment?: string }> = {};
      Object.entries(decisions).forEach(([k, v]) => {
        if (v.decision === 'UPHELD' || v.decision === 'OVERRULED') {
          finalDecisions[k] = { decision: v.decision, overrule_reason: v.overrule_reason, comment: v.comment };
        }
      });
      await onSubmitDecision(decisionType, overallFeedback, finalDecisions);
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to submit review decision. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4 px-4 sm:px-6">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO REVIEW QUEUE</span>
        </button>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-neutral-500 uppercase">
            BRANDTRACE · {brandName.toUpperCase()} · REVIEW WORKSPACE
          </span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold">
            {post.id}
          </span>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-600/70 text-rose-200 text-xs font-mono flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT SECTION (5 Columns desktop): Heading, Submitted Text, Highlights */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Large REVIEW / COMPLIANCE / FINAL RELEASE Heading */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
              PLUMBLINE · {brandName.toUpperCase()} · {roleName.toUpperCase()}
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-sans uppercase">
              {roleName === 'BRAND OWNER' ? 'FINAL RELEASE' : roleName === 'COMPLIANCE' ? 'COMPLIANCE' : 'REVIEW'}
            </h1>
            <p className="text-sm text-neutral-400 font-sans leading-relaxed">
              {roleName === 'BRAND OWNER'
                ? 'Final executive approval and cryptographic sealing. Verify complete approval history across Creator, Reviewer, and Compliance stages before generating an immutable release.'
                : roleName === 'COMPLIANCE'
                ? 'Statutory validation against FTC Green Guides §260, FDA 21 CFR §201, and clinical evidence. Approve, request evidence, or return for revision.'
                : 'Agree or disagree with each blocking problem, then approve the post or send it back. Every step is recorded.'}
            </p>
          </div>

          {/* Mandatory Workflow Audit Chain (for Brand Owner) */}
          {roleName === 'BRAND OWNER' ? (
            <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-700/80 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  MANDATORY WORKFLOW AUDIT CHAIN
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  READY FOR SEALING
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-0.5">
                  <div className="text-[9px] text-neutral-500 uppercase">Stage 1 · Submitter</div>
                  <div className="text-white font-semibold truncate text-[11px]">{post.creatorName || 'Creator Asha'}</div>
                  <div className="text-[9px] text-purple-400">SUBMITTED</div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-0.5">
                  <div className="text-[9px] text-neutral-500 uppercase">Stage 2 · Reviewer</div>
                  <div className="text-white font-semibold truncate text-[11px]">Reviewer Meera</div>
                  <div className="text-[9px] text-emerald-400">APPROVED</div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 space-y-0.5">
                  <div className="text-[9px] text-neutral-500 uppercase">Stage 3 · Compliance</div>
                  <div className="text-white font-semibold truncate text-[11px]">Officer Arjun</div>
                  <div className="text-[9px] text-emerald-400">CERTIFIED</div>
                </div>
                <div className="p-2.5 rounded-lg bg-neutral-950 border border-indigo-500/40 space-y-0.5">
                  <div className="text-[9px] text-neutral-500 uppercase">Stage 4 · Owner</div>
                  <div className="text-white font-semibold truncate text-[11px]">{userName}</div>
                  <div className="text-[9px] text-amber-300 animate-pulse">PENDING SEAL</div>
                </div>
              </div>

              {/* Gated Publishing Restriction Alert */}
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-600/40 text-amber-200 text-[11px] font-sans flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>PUBLISHING RESTRICTION ACTIVE:</strong> External distribution is strictly gated. Content will not be published automatically to external platforms without explicit API authorization.
                </span>
              </div>
            </div>
          ) : (roleName === 'COMPLIANCE' || post.reviewerFeedback) ? (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-700/50 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <div className="text-xs space-y-0.5">
                <div className="font-mono font-bold text-indigo-300 uppercase tracking-wide">
                  Prior Reviewer Approval · Reviewer Meera
                </div>
                <p className="text-neutral-300 font-sans">
                  {post.reviewerFeedback || 'Reviewer Meera approved this copy version. Ready for statutory compliance audit.'}
                </p>
              </div>
            </div>
          ) : null}

          {/* Submitter & Metadata Card */}
          <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                SUBMISSION METADATA
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                post.statusColor === 'emerald'
                  ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-300'
                  : post.statusColor === 'rose'
                  ? 'bg-rose-950 border border-rose-500/40 text-rose-300'
                  : 'bg-purple-950 border border-purple-500/40 text-purple-300'
              }`}>
                {post.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1 border-t border-neutral-900">
              <div>
                <span className="text-neutral-500 block text-[10px]">SUBMITTER:</span>
                <strong className="text-white">{post.creatorName || 'Creator Asha'}</strong>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">ORGANIZATION:</span>
                <span className={post.creatorType === 'agency' ? 'text-cyan-300 font-bold' : 'text-purple-300 font-bold'}>
                  {post.orgId || (post.creatorType === 'agency' ? 'ORG-AGENCY-PULSE' : 'ORG-AURELLE')}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">CHANNEL:</span>
                <span className="text-neutral-300 uppercase">{post.channel || 'instagram'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">VERSION:</span>
                <span className="text-neutral-300 font-bold">v{post.version || 1}</span>
              </div>
            </div>
          </div>

          {/* Content View Container with Mode Toggle */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContentMode('submitted')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                    contentMode === 'submitted'
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Submitted Text
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('suggested')}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                    contentMode === 'suggested'
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Suggested Version
                </button>
              </div>

              <span className="text-[10px] font-mono text-neutral-500 uppercase">
                {rawContent.length} CHARS
              </span>
            </div>

            {/* Content Display Surface */}
            <div className="p-6 text-sm sm:text-base leading-relaxed font-sans text-neutral-200 min-h-[180px] whitespace-pre-wrap">
              {contentMode === 'suggested' ? (
                <p className="text-emerald-300 font-sans leading-relaxed">{suggestedContent}</p>
              ) : (
                (() => {
                  if (normalizedFindings.length === 0) {
                    return <p>{rawContent}</p>;
                  }

                  // Find in-text occurrences for highlighting
                  const activeFindings = normalizedFindings.filter(
                    (f) => f.rejectedText && rawContent.includes(f.rejectedText)
                  );

                  if (activeFindings.length === 0) {
                    return <p>{rawContent}</p>;
                  }

                  let parts: React.ReactNode[] = [];
                  let lastIdx = 0;

                  const matches: { start: number; end: number; finding: FindingDetail }[] = [];
                  activeFindings.forEach((f) => {
                    const idx = rawContent.indexOf(f.rejectedText);
                    if (idx !== -1) {
                      matches.push({ start: idx, end: idx + f.rejectedText.length, finding: f });
                    }
                  });

                  matches.sort((a, b) => a.start - b.start);

                  matches.forEach((m, i) => {
                    if (m.start > lastIdx) {
                      parts.push(rawContent.slice(lastIdx, m.start));
                    }

                    const isSelected = selectedFindingId === m.finding.id;
                    const fDecision = decisions[m.finding.id]?.decision;
                    
                    let bgClasses = 'bg-rose-500/25 text-rose-200 border-rose-500/60';
                    if (fDecision === 'OVERRULED') {
                      bgClasses = 'bg-amber-500/20 text-amber-200 border-amber-500/50 line-through opacity-75';
                    } else if (fDecision === 'UPHELD') {
                      bgClasses = 'bg-emerald-500/25 text-emerald-200 border-emerald-500/60';
                    } else if (m.finding.severity === 'MAJOR') {
                      bgClasses = 'bg-amber-500/25 text-amber-200 border-amber-500/60';
                    } else if (m.finding.severity === 'MINOR') {
                      bgClasses = 'bg-blue-500/25 text-blue-200 border-blue-500/60';
                    } else if (m.finding.severity === 'NEEDS_HUMAN') {
                      bgClasses = 'bg-purple-500/25 text-purple-200 border-purple-500/60';
                    }

                    parts.push(
                      <span
                        key={`highlight-${i}`}
                        onClick={() => handleHighlightClick(m.finding.id)}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border cursor-pointer transition-all ${bgClasses} ${
                          isSelected ? 'ring-2 ring-white scale-105' : 'hover:brightness-125'
                        }`}
                        title={`Finding #${m.finding.number}: ${m.finding.title}`}
                      >
                        <span className="font-medium">{m.finding.rejectedText}</span>
                        <span className="text-[10px] font-mono font-bold bg-black/60 px-1 rounded text-white">
                          [#{m.finding.number}]
                        </span>
                      </span>
                    );
                    lastIdx = m.end;
                  });

                  if (lastIdx < rawContent.length) {
                    parts.push(rawContent.slice(lastIdx));
                  }

                  return <p>{parts}</p>;
                })()
              )}
            </div>
          </div>

          {/* Governance Approval Lifecycle Panel */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono font-bold uppercase text-neutral-400 tracking-wider">
              GOVERNANCE APPROVAL LIFECYCLE
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-white font-bold">
                    1. {post.creatorType === 'agency' ? 'AGENCY PARTNER SUBMISSION' : 'CREATOR SUBMISSION'}
                  </div>
                  <div className="text-neutral-400 text-[10px]">
                    Submitted by {post.creatorName || 'Creator Asha'} ({post.orgId || (post.creatorType === 'agency' ? 'ORG-AGENCY-PULSE' : 'ORG-AURELLE')})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/50 text-xs font-mono">
                <Clock className="w-4 h-4 text-indigo-400 shrink-0 animate-pulse" />
                <div>
                  <div className="text-indigo-200 font-bold">2. REVIEWER CHECK</div>
                  <div className="text-neutral-400 text-[10px]">Currently under review by {userName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs font-mono opacity-60">
                <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0" />
                <div>
                  <div className="text-neutral-300 font-bold">3. COMPLIANCE SIGN-OFF</div>
                  <div className="text-neutral-500 text-[10px]">Awaiting reviewer sign-off to enter Compliance queue</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT SECTION (7 Columns desktop): Findings Cards, Decisions & Controls */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header Metric Bar matching Plumbline: e.g. "6 BLOCKING · 0 STILL TO DECIDE" */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-md">
            <div className="flex items-center gap-3 font-mono font-extrabold text-sm sm:text-base">
              <span className="text-[#ff6358]">{blockingCount} BLOCKING</span>
              <span className="text-neutral-600">·</span>
              <span className={stillToDecideCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                {stillToDecideCount} STILL TO DECIDE
              </span>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              {normalizedFindings.length} TOTAL FINDINGS
            </span>
          </div>

          {/* Findings Cards List */}
          <div className="space-y-4">
            {normalizedFindings.map((finding) => {
              const currentDecision = decisions[finding.id]?.decision || 'UNDECIDED';
              const overruleReason = decisions[finding.id]?.overrule_reason || '';
              const comment = decisions[finding.id]?.comment || '';
              const isSelected = selectedFindingId === finding.id;

              return (
                <div
                  id={`review-finding-card-${finding.id}`}
                  key={finding.id}
                  onClick={() => setSelectedFindingId(finding.id)}
                  className={`rounded-2xl border transition-all p-5 space-y-3.5 shadow-xl ${
                    isSelected
                      ? 'border-indigo-500 bg-[#161619]'
                      : 'border-neutral-800 bg-[#111114] hover:border-neutral-700'
                  }`}
                >
                  {/* Card Top Row: Number, Severity Badge, Rule Citation */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        #{finding.number}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        finding.severity === 'BLOCKING'
                          ? 'bg-[#ff6358]/20 border border-[#ff6358]/50 text-[#ff6358]'
                          : finding.severity === 'MAJOR'
                          ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                          : finding.severity === 'NEEDS_HUMAN'
                          ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                          : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                      }`}>
                        {finding.severity}
                      </span>
                      <h4 className="text-sm font-sans font-bold text-white">
                        {finding.title}
                      </h4>
                    </div>

                    {/* Decision Status Pill */}
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                      currentDecision === 'UPHELD'
                        ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                        : currentDecision === 'OVERRULED'
                        ? 'bg-amber-950 border border-amber-500 text-amber-300'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                    }`}>
                      {currentDecision === 'UNDECIDED' ? 'STILL TO DECIDE' : currentDecision}
                    </span>
                  </div>

                  {/* Problematic Text -> Suggested Fix Comparison */}
                  <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 font-mono text-xs space-y-1">
                    <div className="text-rose-400 line-through">
                      "{finding.rejectedText}"
                    </div>
                    <div className="text-emerald-400">
                      → "{finding.approvedText}"
                    </div>
                  </div>

                  {/* AI Explanation & Evidence Reference */}
                  <div className="space-y-1 text-xs">
                    <p className="text-neutral-300 font-sans leading-relaxed">
                      {finding.recommendation}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                        Rule: {finding.ruleCitation}
                      </span>
                      {finding.evidenceRef && (
                        <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          Evidence: {finding.evidenceRef}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reviewer & Compliance Decision Controls: Finger-friendly tap targets */}
                  <div className="pt-2 border-t border-neutral-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-[11px] font-mono text-neutral-400 font-semibold">
                        Decision on Finding #{finding.number}:
                      </span>
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleSetDecision(finding.id, 'UPHELD')}
                          className={`w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 ${
                            currentDecision === 'UPHELD'
                              ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Uphold</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSetDecision(finding.id, 'OVERRULED')}
                          className={`w-full sm:w-auto px-4 py-2.5 sm:py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer border flex items-center justify-center gap-1.5 min-h-[44px] active:scale-95 ${
                            currentDecision === 'OVERRULED'
                              ? 'bg-amber-600 border-amber-500 text-white shadow-md'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Overturn</span>
                        </button>
                      </div>
                    </div>

                    {/* Overrule Reason Input (Required when Overturn is selected) */}
                    {currentDecision === 'OVERRULED' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-1.5 p-3 rounded-xl bg-amber-950/20 border border-amber-700/50"
                      >
                        <label className="block text-[11px] font-mono font-bold text-amber-300 uppercase">
                          Reason for Overturning Finding (Required for Compliance Audit):
                        </label>
                        <input
                          type="text"
                          value={overruleReason}
                          onChange={(e) => handleUpdateOverruleReason(finding.id, e.target.value)}
                          placeholder="e.g. Permitted clinical trial protocol AUR-LAB-014 annexure exception"
                          className="w-full px-3 py-2 rounded-lg bg-black border border-amber-700/70 text-xs font-mono text-amber-100 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
                        />
                      </motion.div>
                    )}

                    {/* Optional Comment Input per Finding */}
                    <div className="pt-1">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => handleUpdateFindingComment(finding.id, e.target.value)}
                        placeholder="Optional comment on this finding..."
                        className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-sans text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Review Feedback Input */}
          <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 shadow-lg">
            <label className="block text-xs font-mono font-bold uppercase text-neutral-300">
              Reviewer Feedback & Instructions for Submitter:
            </label>
            <textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="Provide clear notes, required changes, or approval rationale..."
              rows={3}
              className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-sans text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Final Actions Bar: Elevated Touch Targets for Mobile */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0f0f12] border border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xl">
            <button
              onClick={onBack}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono font-bold uppercase cursor-pointer text-center min-h-[46px] flex items-center justify-center active:scale-[0.98]"
            >
              Cancel / Back to Queue
            </button>

            {roleName === 'BRAND OWNER' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REJECT')}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-rose-950/60 border border-rose-600/70 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[46px] flex items-center justify-center active:scale-[0.98]"
                >
                  Reject Release
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REQUEST_CHANGES')}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-neutral-900 border border-amber-600/70 hover:bg-neutral-800 text-amber-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[46px] flex items-center justify-center active:scale-[0.98]"
                >
                  Request Changes
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('APPROVE')}
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[46px] active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grant Final Approval & Release</span>
                </button>
              </div>
            ) : roleName === 'COMPLIANCE' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REJECT')}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-rose-950/60 border border-rose-600/70 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[46px] flex items-center justify-center active:scale-[0.98]"
                >
                  Reject Compliance
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REQUEST_CHANGES')}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-neutral-900 border border-amber-600/70 hover:bg-neutral-800 text-amber-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[46px] flex items-center justify-center active:scale-[0.98]"
                >
                  Return for Revision
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REQUEST_EVIDENCE')}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-sky-950/60 border border-sky-500/70 hover:bg-sky-900 text-sky-200 text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[46px] active:scale-[0.98]"
                >
                  <Clock className="w-4 h-4" />
                  <span>Request Evidence</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('APPROVE')}
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[46px] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Compliance</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REQUEST_CHANGES')}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-neutral-900 border border-amber-600/70 hover:bg-neutral-800 text-amber-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[46px] flex items-center justify-center active:scale-[0.98]"
                >
                  Send Back for Revision
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REJECT')}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl bg-rose-950/60 border border-rose-600/70 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[46px] flex items-center justify-center active:scale-[0.98]"
                >
                  Reject
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('APPROVE')}
                  className="w-full sm:w-auto px-6 py-3.5 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[46px] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Review</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

