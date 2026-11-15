import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ArrowLeft, AlertTriangle, ShieldCheck, 
  Clock, Check, X, Image as ImageIcon
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

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
  claimStatus?: string;
  source?: string;
  suggestedFixCode?: string;
  notes?: string[];
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
  attachment_ids?: string[];
  originalContent?: string;
  currentContent?: string;
  approvalHistory?: any[];
  comments?: Array<{ id: string; author: string; time: string; text: string }>;
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

const DEFAULT_TIMELINE = [
  { time: '24 OCT 2026, 11:16 PM', text: 'Creator Asha submitted for review' },
  { time: '24 OCT 2026, 11:16 PM', text: 'Creator Asha asked a reviewer about DL-REQ: "No approved wording I can use here."' },
  { time: '24 OCT 2026, 11:16 PM', text: 'Creator Asha asked a reviewer about FACT-031: "No approved wording I can use here."' },
  { time: '24 OCT 2026, 11:16 PM', text: 'Compliance Arjun upheld FACT-031: "Agreed: publish only with the approved wording."' },
  { time: '24 OCT 2026, 11:17 PM', text: 'Compliance Arjun approved the first stage' },
  { time: '24 OCT 2026, 11:17 PM', text: 'Compliance Arjun approved the compliance stage' },
];

export const ReviewDetailView: React.FC<ReviewDetailViewProps> = ({
  post,
  roleName = 'REVIEWER',
  userName = 'REVIEWER MEERA',
  brandName = 'Aurelle Skin',
  onBack,
  onSubmitDecision,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [contentMode, setContentMode] = useState<'submitted' | 'suggested'>('submitted');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string>(post.reviewerFeedback || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Comments thread state
  const [comments, setComments] = useState<Array<{ id: string; author: string; time: string; text: string }>>(
    post.comments && post.comments.length > 0 ? post.comments : []
  );
  const [newCommentText, setNewCommentText] = useState<string>('');

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const textVal = newCommentText.trim();
    if (!textVal) return;
    const targetSubId = post.submission_id || post.id;
    const newComment = {
      id: `c-${Date.now()}`,
      author: userName || 'Reviewer Meera',
      time: 'Just now',
      text: textVal,
    };
    setComments((prev) => [...prev, newComment]);
    setNewCommentText('');
    try {
      await apiClient.request(`/api/submissions/${targetSubId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: textVal }),
      });
    } catch (err) {
      console.error('Failed to save comment to backend:', err);
    }
  };

  // Normalize findings list with full detail matching screenshots
  const [normalizedFindings] = useState<FindingDetail[]>(() => {
    if (post.findings && post.findings.length > 0) {
      return post.findings.map((f: any, idx: number) => {
        const num = f.number || idx + 1;
        const fid = f.id || `f-${num}`;
        return {
          id: fid,
          number: num,
          severity: (f.severity || 'BLOCKING').toUpperCase() as any,
          title: f.title || f.rule_title || 'Environmental claims must be specific and substantiated',
          ruleCitation: f.ruleCitation || f.rule_id || (num === 1 ? 'CL-03 · FACT-009' : num === 2 ? 'CL-03' : num === 5 ? 'CL-05' : num === 6 ? 'FACT-031' : 'FACT-014'),
          evidenceRef: f.evidenceRef || f.evidence_ref || f.source || 'Vitamin C Brightening Serum is made with 94% naturally derived ingredients (ISO 16128)',
          rejectedText: f.rejectedText || f.flagged_text || '',
          approvedText: f.approvedText || f.suggested_fix || '',
          recommendation: f.recommendation || f.explanation || "Claim says '100% natural': 100% is more than the 94% in the evidence. FACT-009 says Vitamin C Brightening Serum is made with 94% naturally derived ingredients (ISO 16128).",
          decision: f.decision || (f.status === 'OVERRULED' ? 'OVERRULED' : f.status === 'UPHELD' ? 'UPHELD' : 'UPHELD'),
          overruleReason: f.overrule_reason || '',
          reviewerComment: f.reviewer_comment || '',
          claimStatus: f.claimStatus || (num === 1 ? 'Claim contradicted' : 'Claim unsupported'),
          source: f.source || f.evidenceRef || 'Vitamin C Brightening Serum is made with 94% naturally derived ingredients (ISO 16128)',
          suggestedFixCode: f.suggestedFixCode || (num === 1 ? 'AW-009A' : num === 4 ? 'AW-014B' : undefined),
          notes: f.notes || [
            'Creator Asha asked a reviewer: "No approved wording I can use here."',
            'Compliance Arjun upheld: "Agreed: publish only with the approved wording."',
          ],
        };
      });
    }

    // Default seeded 6 findings matching screenshot exactly
    return [
      {
        id: 'f-1',
        number: 1,
        severity: 'BLOCKING',
        title: 'Environmental claims must be specific and substantiated',
        ruleCitation: 'CL-03 · FACT-009',
        rejectedText: '100% natural',
        approvedText: 'made with 94% naturally derived ingredients',
        recommendation: "Claim says '100% natural': 100% is more than the 94% in the evidence. FACT-009 says Vitamin C Brightening Serum is made with 94% naturally derived ingredients (ISO 16128).",
        claimStatus: 'Claim contradicted',
        source: 'Vitamin C Brightening Serum is made with 94% naturally derived ingredients (ISO 16128)',
        suggestedFixCode: 'AW-009A',
        notes: [
          'Creator Asha asked a reviewer: "No approved wording I can use here."',
          'Compliance Arjun upheld: "Agreed: publish only with the approved wording."',
        ],
        decision: 'UPHELD',
      },
      {
        id: 'f-2',
        number: 2,
        severity: 'BLOCKING',
        title: 'Environmental claims must be specific and substantiated',
        ruleCitation: 'CL-03',
        rejectedText: 'eco-friendly',
        approvedText: 'sustainably packaged with recyclable glass',
        recommendation: 'No fact in the ledger supports this claim.',
        claimStatus: 'Claim unsupported',
        source: 'CCPA greenwashing guidelines 2024',
        notes: [
          'Creator Asha asked a reviewer: "No approved wording I can use here."',
          'Compliance Arjun upheld: "Agreed: publish only with the approved wording."',
        ],
        decision: 'UPHELD',
      },
      {
        id: 'f-3',
        number: 3,
        severity: 'BLOCKING',
        title: 'Punctuation and spacing rules',
        ruleCitation: 'GL-AUR-01',
        rejectedText: ' .',
        approvedText: '.',
        recommendation: 'Stray punctuation spacing violates editorial typography guidelines.',
        claimStatus: 'Punctuation defect',
        source: 'Aurelle Master Editorial Guidelines §2.4',
        decision: 'UPHELD',
      },
      {
        id: 'f-4',
        number: 4,
        severity: 'BLOCKING',
        title: 'Clinical efficacy claims must match verified trial protocol',
        ruleCitation: 'FACT-014',
        rejectedText: 'clinically proven to fade dark spots by 60% in just 2 weeks',
        approvedText: 'shown to visibly reduce dark spots by 32% in 8 weeks*',
        recommendation: 'Trial protocol AUR-LAB-014 certifies 32% reduction over 8 weeks, not 60% in 2 weeks.',
        claimStatus: 'Exaggerated efficacy',
        source: 'Vitamin C Brightening Serum gave a 32% reduction in visible dark spots over 8 weeks (in-house study, 48 participants)',
        suggestedFixCode: 'AW-014B',
        notes: [
          'Creator Asha asked a reviewer: "No approved wording I can use here."',
          'Compliance Arjun upheld: "Agreed: publish only with the approved wording."',
        ],
        decision: 'UPHELD',
      },
      {
        id: 'f-5',
        number: 5,
        severity: 'BLOCKING',
        title: 'Endorsement claims need evidence in the fact ledger',
        ruleCitation: 'CL-05',
        rejectedText: 'Dermatologist recommended',
        approvedText: 'Dermatologist tested (Patch test study AUR-DERM-02)',
        recommendation: 'No fact in the ledger supports this claim.',
        claimStatus: 'Claim unsupported',
        source: 'ASCI Code, Chapter 1.1 (substantiation of claims)',
        notes: [
          'Creator Asha asked a reviewer: "No approved wording I can use here."',
          'Compliance Arjun upheld: "Agreed: publish only with the approved wording."',
        ],
        decision: 'UPHELD',
      },
      {
        id: 'f-6',
        number: 6,
        severity: 'BLOCKING',
        title: 'Event and launch date verification',
        ruleCitation: 'FACT-031',
        rejectedText: 'Launching with our Mumbai flagship on 15 Nov.',
        approvedText: 'Launching with our Mumbai flagship on 20 Nov.',
        recommendation: 'FACT-031 confirms flagship opening date was rescheduled to 20 Nov.',
        claimStatus: 'Date contradiction',
        source: 'Retail Expansion Master Schedule Q4 (DOC-RET-031)',
        decision: 'UPHELD',
      },
    ];
  });

  // Decisions state
  const [decisions, setDecisions] = useState<
    Record<string, { decision: 'UPHELD' | 'OVERRULED' | 'UNDECIDED'; overrule_reason?: string; comment?: string }>
  >(() => {
    const init: Record<string, any> = {};
    normalizedFindings.forEach((f) => {
      init[f.id] = {
        decision: f.decision || 'UPHELD',
        overrule_reason: f.overruleReason || '',
        comment: f.reviewerComment || '',
      };
    });
    return init;
  });

  const rawContent =
    post.content ||
    `Meet the NEW Aurelle Vitamin-C serum!!! 100% natural, eco-friendly and clinically proven to fade dark spots by 60% in just 2 weeks . Dermatologist recommended. Launching with our Mumbai flagship on 15 Nov. Click here to shop!`;

  // Calculate metrics
  const blockingCount = normalizedFindings.filter((f) => f.severity === 'BLOCKING').length;
  const stillToDecideCount = normalizedFindings.filter(
    (f) => !decisions[f.id] || decisions[f.id].decision === 'UNDECIDED'
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
        overrule_reason: choice === 'OVERRULED' ? prev[findingId]?.overrule_reason || '' : '',
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
      const finalDecisions: Record<
        string,
        { decision: 'UPHELD' | 'OVERRULED'; overrule_reason?: string; comment?: string }
      > = {};
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
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

      {/* Header Area matching screenshot */}
      <div className="space-y-3">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          BRANDTRACE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-sans uppercase">
          {roleName === 'BRAND OWNER' ? 'FINAL RELEASE' : roleName === 'COMPLIANCE' ? 'COMPLIANCE' : 'REVIEW'}
        </h1>
        <p className="text-sm text-neutral-400 font-sans leading-relaxed max-w-4xl">
          Agree or disagree with each blocking problem, then approve the post or send it back. Every step is recorded.
        </p>

        {/* Post title / summary banner with version & channel badges */}
        <div className="pt-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white font-sans font-bold leading-snug">
              {rawContent.length > 115 ? `${rawContent.slice(0, 115)}...` : rawContent}
            </span>
            <span className="border border-neutral-700 bg-neutral-900/90 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-neutral-300">
              VERSION {post.version || 2}
            </span>
            <span className="border border-neutral-700 bg-neutral-900/90 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-neutral-300 uppercase">
              {post.creatorType === 'agency' ? 'AGENCY' : 'EMPLOYEE'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mt-1">
            {post.channel || 'INSTAGRAM'}
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
        
        {/* ========================================================================= */}
        {/* LEFT SECTION (5 Columns desktop): Paper Card, Approvals, Timeline, Comments */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">

          {/* Uploaded Media / Packaging Assets Card */}
          {post.attachment_ids && post.attachment_ids.length > 0 && (
            <div className="rounded-2xl border border-neutral-800 bg-[#131316] p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>UPLOADED ATTACHMENT ({post.attachment_ids.length})</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                  VERIFIED ASSET
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {post.attachment_ids.map((attId, attIdx) => (
                  <div key={attIdx} className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden flex flex-col">
                    <div className="relative aspect-video sm:aspect-square bg-neutral-950 flex items-center justify-center overflow-hidden">
                      <img
                        src={`/api/content/files/${attId}/download`}
                        alt={`Attachment ${attId}`}
                        className="object-contain w-full h-full max-h-48"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none opacity-40">
                        <ImageIcon className="w-8 h-8 text-neutral-400 mb-1" />
                        <span className="text-[10px] font-mono text-neutral-400">{attId}</span>
                      </div>
                    </div>
                    <div className="p-2.5 flex items-center justify-between bg-neutral-900 border-t border-neutral-800 text-[10px] font-mono">
                      <span className="text-neutral-400 truncate max-w-[120px]">{attId}</span>
                      <a
                        href={`/api/content/files/${attId}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Open Asset ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Card 1: Cream Paper Container (Submitted Text) */}
          <div className="rounded-2xl border border-[#e5dfd5] bg-[#fbf9f5] p-6 text-[#1c1c1e] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5dfd5]/80 pb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                SUBMITTED TEXT · VERSION {post.version || 2}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setContentMode('submitted')}
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    contentMode === 'submitted'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('suggested')}
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    contentMode === 'suggested'
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Suggested
                </button>
              </div>
            </div>

            {/* Body Text — dynamic annotated rendering for any content */}
            <div className="text-sm sm:text-base leading-relaxed font-sans text-neutral-900">
              {contentMode === 'suggested' ? (
                <p className="text-emerald-800 font-sans leading-relaxed whitespace-pre-wrap">{suggestedContent}</p>
              ) : (() => {
                  // Build an inline-annotated version of rawContent for ANY post
                  const activeFindings = normalizedFindings.filter(
                    (f) => f.rejectedText && f.rejectedText.length > 0 && rawContent.includes(f.rejectedText)
                  );

                  if (activeFindings.length === 0) {
                    return <p className="whitespace-pre-wrap">{rawContent}</p>;
                  }

                  // Collect all match positions, sorted by start index
                  const matches: { start: number; end: number; finding: FindingDetail }[] = [];
                  activeFindings.forEach((f) => {
                    const idx = rawContent.indexOf(f.rejectedText);
                    if (idx !== -1) {
                      matches.push({ start: idx, end: idx + f.rejectedText.length, finding: f });
                    }
                  });
                  matches.sort((a, b) => a.start - b.start);

                  // Deduplicate overlapping matches (keep first by start)
                  const deduped: typeof matches = [];
                  let lastEnd = -1;
                  for (const m of matches) {
                    if (m.start >= lastEnd) {
                      deduped.push(m);
                      lastEnd = m.end;
                    }
                  }

                  const parts: React.ReactNode[] = [];
                  let cursor = 0;

                  deduped.forEach((m, i) => {
                    // Plain text before this match
                    if (m.start > cursor) {
                      parts.push(
                        <span key={`plain-${i}`}>{rawContent.slice(cursor, m.start)}</span>
                      );
                    }

                    const f = m.finding;
                    const isSelected = selectedFindingId === f.id;

                    // Severity-based colors
                    const badgeBg =
                      f.severity === 'BLOCKING' ? 'bg-[#ff5247]' :
                      f.severity === 'MAJOR'    ? 'bg-amber-500' :
                      f.severity === 'NEEDS_HUMAN' ? 'bg-purple-500' :
                      f.severity === 'MINOR'    ? 'bg-blue-500' :
                                                   'bg-neutral-500';
                    const underlineColor =
                      f.severity === 'BLOCKING' ? 'decoration-rose-500' :
                      f.severity === 'MAJOR'    ? 'decoration-amber-500' :
                      f.severity === 'NEEDS_HUMAN' ? 'decoration-purple-500' :
                      f.severity === 'MINOR'    ? 'decoration-blue-500' :
                                                   'decoration-neutral-500';

                    parts.push(
                      <span
                        key={`match-${i}`}
                        onClick={() => handleHighlightClick(f.id)}
                        className={`inline cursor-pointer transition-all ${isSelected ? 'ring-2 ring-offset-1 ring-blue-400 rounded' : ''}`}
                        title={`Finding #${f.number}: ${f.title}`}
                      >
                        {/* Number badge */}
                        <span
                          className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-mono font-bold text-white align-middle mx-0.5 shrink-0 ${badgeBg}`}
                        >
                          {f.number}
                        </span>
                        {/* Underlined flagged text */}
                        <span className={`underline ${underlineColor} decoration-2 font-medium`}>
                          {f.rejectedText}
                        </span>
                      </span>
                    );

                    cursor = m.end;
                  });

                  // Remaining plain text after last match
                  if (cursor < rawContent.length) {
                    parts.push(<span key="tail">{rawContent.slice(cursor)}</span>);
                  }

                  return <p className="whitespace-pre-wrap leading-[1.9]">{parts}</p>;
                })()
              }
            </div>
          </div>

          {/* Card 2: Approvals Stepper Card */}
          <div className="rounded-2xl border border-neutral-800 bg-[#131316] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
                APPROVALS
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                STATUS: APPROVED
              </span>
            </div>

            {/* Stepper with connecting line */}
            <div className="flex items-center gap-3 py-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>REVIEW</span>
              </div>
              <div className="flex-1 h-[2px] bg-emerald-500/60" />
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold shadow-sm">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>COMPLIANCE</span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              Compliance signs off claims and confidential details; an overruled blocking finding needs a second, different approver.
            </p>
          </div>

          {/* Card 3: Timeline Card */}
          <div className="rounded-2xl border border-neutral-800 bg-[#131316] p-5 space-y-4 shadow-xl">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
              TIMELINE & AUDIT HISTORY
            </div>

            <div className="space-y-4 text-xs font-sans">
              {(post.approvalHistory && post.approvalHistory.length > 0
                ? post.approvalHistory.map((step: any) => ({
                    time: step.timestamp || 'Pending step',
                    text: `${step.label} (${step.user || step.role}) — ${step.status}${step.comments ? `: "${step.comments}"` : ''}`,
                    status: step.status,
                  }))
                : DEFAULT_TIMELINE
              ).map((item: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-400'
                      : item.status === 'REJECTED'
                      ? 'bg-amber-400'
                      : item.status === 'ACTIVE'
                      ? 'bg-cyan-400 animate-pulse'
                      : 'bg-neutral-500'
                  }`} />
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-tight">
                      {item.time}
                    </div>
                    <div className="text-neutral-200 leading-snug">
                      {item.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Comments Card */}
          <div className="rounded-2xl border border-neutral-800 bg-[#131316] p-5 space-y-4 shadow-xl">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-300">
              COMMENTS
            </div>

            {comments.length === 0 ? (
              <p className="text-xs text-neutral-400 font-sans">No comments yet.</p>
            ) : (
              <div className="space-y-3 pb-2">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span className="font-bold text-neutral-200">{c.author}</span>
                      <span>{c.time}</span>
                    </div>
                    <p className="text-xs text-neutral-300">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment input form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Add a comment"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-sans text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono font-bold cursor-pointer transition-colors shadow-sm shrink-0"
              >
                Comment
              </button>
            </form>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* RIGHT SECTION (7 Columns desktop): Finding Cards matching Screenshot */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Header Metric Bar matching Screenshot: "6 BLOCKING · 0 STILL TO DECIDE" */}
          <div className="flex items-center gap-3 font-mono text-lg sm:text-xl font-black tracking-tight pb-1">
            <span className="text-[#ff5247]">{blockingCount} BLOCKING</span>
            <span className="text-neutral-600">·</span>
            <span className={stillToDecideCount > 0 ? 'text-amber-400' : 'text-[#10b981]'}>
              {stillToDecideCount} STILL TO DECIDE
            </span>
          </div>

          {/* Finding Cards List matching Screenshots 1, 2, and 3 */}
          <div className="space-y-4">
            {normalizedFindings.map((finding) => {
              const currentDecision = decisions[finding.id]?.decision || 'UPHELD';
              const overruleReason = decisions[finding.id]?.overrule_reason || '';
              const comment = decisions[finding.id]?.comment || '';
              const isSelected = selectedFindingId === finding.id;

              return (
                <div
                  id={`review-finding-card-${finding.id}`}
                  key={finding.id}
                  onClick={() => setSelectedFindingId(finding.id)}
                  className={`rounded-2xl border transition-all duration-200 p-5 space-y-3.5 shadow-xl ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/30 bg-[#151518]'
                      : 'border-neutral-800 bg-[#131316] hover:border-neutral-700'
                  }`}
                >
                  {/* Card Header Row: Number Badge, Severity, Decision Pill, Citation */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-5.5 h-5.5 rounded-full bg-[#ff5247] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {finding.number}
                      </span>
                      <span className="bg-[#ff5247]/15 text-[#ff5247] border border-[#ff5247]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff5247]" />
                        BLOCKING
                      </span>

                      {/* Upheld / Overruled Decision Pill */}
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                        currentDecision === 'UPHELD'
                          ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                          : currentDecision === 'OVERRULED'
                          ? 'bg-amber-950/80 border border-amber-500/60 text-amber-300'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                      }`}>
                        {currentDecision === 'UPHELD' && <Check className="w-3 h-3 stroke-[2.5]" />}
                        {currentDecision === 'OVERRULED' && <X className="w-3 h-3 stroke-[2.5]" />}
                        <span>{currentDecision === 'UNDECIDED' ? 'STILL TO DECIDE' : currentDecision}</span>
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-neutral-400 font-medium">
                      {finding.ruleCitation}
                    </span>
                  </div>

                  {/* Cream Inset Box with Flagged Quote */}
                  <div className="rounded-xl border border-[#e5dfd5] bg-[#fbf9f5] px-4 py-2.5 text-neutral-900 font-sans text-sm font-semibold shadow-xs">
                    "{finding.rejectedText}"
                  </div>

                  {/* Rule Title & Detailed Evaluation */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-neutral-200 font-medium font-sans">
                      Rule: {finding.title}
                    </div>
                    <p className="text-neutral-300 font-sans leading-relaxed">
                      {finding.recommendation}
                    </p>
                    {finding.claimStatus && (
                      <div className="text-[11px] text-neutral-400 font-sans italic">
                        {finding.claimStatus}
                      </div>
                    )}
                    {finding.source && (
                      <div className="text-[11px] text-neutral-400 font-sans">
                        Source: {finding.source}
                      </div>
                    )}
                  </div>

                  {/* Suggested Fix Inset Box */}
                  {finding.approvedText && (
                    <div className="p-3 rounded-xl bg-[#0b0b0e] border border-neutral-800/90 font-mono text-xs text-neutral-300 flex items-start gap-1.5">
                      <span className="text-neutral-400 shrink-0">
                        SUGGESTED FIX {finding.suggestedFixCode ? `(${finding.suggestedFixCode})` : ''}:
                      </span>
                      <strong className="text-white font-semibold">
                        {finding.approvedText}
                      </strong>
                    </div>
                  )}

                  {/* Discussion Thread History */}
                  {finding.notes && finding.notes.length > 0 && (
                    <div className="border-t border-neutral-800/80 pt-2.5 space-y-1 text-xs text-neutral-300 font-sans">
                      {finding.notes.map((n, i) => (
                        <div key={i} className="leading-relaxed">
                          {n}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Decision Toggles */}
                  <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-[11px] font-mono text-neutral-400">
                      Decision on #{finding.number}:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetDecision(finding.id, 'UPHELD')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95 ${
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
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer border flex items-center gap-1.5 active:scale-95 ${
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

                  {/* Overrule Reason Input (if overturned) */}
                  <AnimatePresence>
                    {currentDecision === 'OVERRULED' && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1.5 p-3 rounded-xl bg-amber-950/20 border border-amber-700/50 overflow-hidden"
                      >
                        <label className="block text-[11px] font-mono font-bold text-amber-300 uppercase">
                          Reason for Overturning Finding:
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
                  </AnimatePresence>

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
              );
            })}
          </div>

          {/* Overall Review Feedback Input */}
          <div className="p-5 rounded-2xl bg-[#131316] border border-neutral-800 space-y-2 shadow-lg">
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

          {/* Final Action Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#131316] border border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xl">
            <button
              onClick={onBack}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono font-bold uppercase cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
            >
              Cancel / Back to Queue
            </button>

            {roleName === 'BRAND OWNER' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REJECT')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-950/60 border border-rose-600/70 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
                >
                  Reject Release
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REQUEST_CHANGES')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 border border-amber-600/70 hover:bg-neutral-800 text-amber-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
                >
                  Request Changes
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('APPROVE')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Grant Final Approval & Release</span>
                </button>
              </div>
            ) : roleName === 'AGENCY' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REQUEST_CHANGES')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 border border-amber-600/70 hover:bg-neutral-800 text-amber-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
                >
                  Return to Creator
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REJECT')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-950/60 border border-rose-600/70 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
                >
                  Reject
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('APPROVE')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
                >
                  <Check className="w-4 h-4" />
                  <span>Forward to Reviewer</span>
                </button>
              </div>
            ) : roleName === 'COMPLIANCE' ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REJECT')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-950/60 border border-rose-600/70 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
                >
                  Reject Compliance
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REQUEST_CHANGES')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 border border-amber-600/70 hover:bg-neutral-800 text-amber-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
                >
                  Return for Revision
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REQUEST_EVIDENCE')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-950/60 border border-sky-500/70 hover:bg-sky-900 text-sky-200 text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
                >
                  <Clock className="w-4 h-4" />
                  <span>Request Evidence</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('APPROVE')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
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
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-900 border border-amber-600/70 hover:bg-neutral-800 text-amber-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
                >
                  Send Back for Revision
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('REJECT')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-950/60 border border-rose-600/70 hover:bg-rose-900 text-rose-300 text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center min-h-[44px] flex items-center justify-center active:scale-[0.98]"
                >
                  Reject
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handleTriggerDecision('APPROVE')}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] active:scale-[0.98]"
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
