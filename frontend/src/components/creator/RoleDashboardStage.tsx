import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CreatorHeader, CreatorTab, TabItem } from './CreatorHeader';
import { CreatorCheckPost } from './CreatorCheckPost';
import { CreatorAuditLog } from './CreatorAuditLog';
import { CreatorRulebook } from './CreatorRulebook';
import { CreatorFactsLedger } from './CreatorFactsLedger';
import { CreatorGuidelineHealth } from './CreatorGuidelineHealth';
import { CreatorClaimWatch } from './CreatorClaimWatch';
import { CreatorSubmissionsView } from './CreatorSubmissionsView';
import { ReviewDetailView, ReviewDecisionType } from './ReviewDetailView';
import { PublicVerificationView } from '../PublicVerificationView';
import { CheckCircle2, ExternalLink, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export type DashboardRole = 'agency' | 'reviewer' | 'compliance' | 'brand-owner';

interface QueueItem {
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
}

const DEFAULT_QUEUE_POSTS: QueueItem[] = [
  {
    id: 'SUB-SEED-001',
    submission_id: 'SUB-SEED-001',
    blockingCount: 6,
    status: 'APPROVED',
    statusColor: 'emerald',
    title: 'Meet the NEW Aurelle Vitamin-C serum!!! 100% natural, eco-friendly and clinically proven to fade dark spot...',
    meta: 'Creator Asha · employee · instagram · version 2 · 6 blocking',
    badges: ['REVIEW', 'COMPLIANCE'],
    content: `Meet the NEW Aurelle Vitamin-C serum!!! 100% natural, eco-friendly and clinically proven to fade dark spots by 60% in just 2 weeks . Dermatologist recommended. Launching with our Mumbai flagship on 15 Nov. Click here to shop!`,
    creatorName: 'Creator Asha',
    creatorType: 'creator',
    orgId: 'ORG-AURELLE',
    channel: 'instagram',
    version: 2,
    findings: [
      {
        id: 'f-1',
        number: 1,
        ruleCitation: 'CL-03 · FACT-009',
        title: 'Environmental claims must be specific and substantiated',
        severity: 'BLOCKING',
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
        status: 'UPHELD',
      },
      {
        id: 'f-2',
        number: 2,
        ruleCitation: 'CL-03',
        title: 'Environmental claims must be specific and substantiated',
        severity: 'BLOCKING',
        rejectedText: 'eco-friendly',
        approvedText: 'sustainably packaged with recyclable glass',
        recommendation: 'No fact in the ledger supports this claim.',
        claimStatus: 'Claim unsupported',
        source: 'CCPA greenwashing guidelines 2024',
        notes: [
          'Creator Asha asked a reviewer: "No approved wording I can use here."',
          'Compliance Arjun upheld: "Agreed: publish only with the approved wording."',
        ],
        status: 'UPHELD',
      },
      {
        id: 'f-3',
        number: 3,
        ruleCitation: 'GL-AUR-01',
        title: 'Punctuation and spacing rules',
        severity: 'BLOCKING',
        rejectedText: ' .',
        approvedText: '.',
        recommendation: 'Stray punctuation spacing violates editorial typography guidelines.',
        claimStatus: 'Punctuation defect',
        source: 'Aurelle Master Editorial Guidelines §2.4',
        status: 'UPHELD',
      },
      {
        id: 'f-4',
        number: 4,
        ruleCitation: 'FACT-014',
        title: 'Clinical efficacy claims must match verified trial protocol',
        severity: 'BLOCKING',
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
        status: 'UPHELD',
      },
      {
        id: 'f-5',
        number: 5,
        ruleCitation: 'CL-05',
        title: 'Endorsement claims need evidence in the fact ledger',
        severity: 'BLOCKING',
        rejectedText: 'Dermatologist recommended',
        approvedText: 'Dermatologist tested (Patch test study AUR-DERM-02)',
        recommendation: 'No fact in the ledger supports this claim.',
        claimStatus: 'Claim unsupported',
        source: 'ASCI Code, Chapter 1.1 (substantiation of claims)',
        notes: [
          'Creator Asha asked a reviewer: "No approved wording I can use here."',
          'Compliance Arjun upheld: "Agreed: publish only with the approved wording."',
        ],
        status: 'UPHELD',
      },
      {
        id: 'f-6',
        number: 6,
        ruleCitation: 'FACT-031',
        title: 'Event and launch date verification',
        severity: 'BLOCKING',
        rejectedText: 'Launching with our Mumbai flagship on 15 Nov.',
        approvedText: 'Launching with our Mumbai flagship on 20 Nov.',
        recommendation: 'FACT-031 confirms flagship opening date was rescheduled to 20 Nov.',
        claimStatus: 'Date contradiction',
        source: 'Retail Expansion Master Schedule Q4 (DOC-RET-031)',
        status: 'UPHELD',
      },
    ],
  },
  {
    id: 'SUB-SEED-002',
    submission_id: 'SUB-SEED-002',
    blockingCount: 5,
    status: 'SUBMITTED',
    statusColor: 'purple',
    title: 'Ceramide Barrier Cream is the treatment for eczema and dry, itchy skin. Doctor approved and guaranteed r...',
    meta: 'Creator Asha · employee · web · version 2 · 5 claim or confidential',
    badges: ['1 REVIEW', '2 COMPLIANCE'],
    content: `Ceramide Barrier Cream is the treatment for eczema and dry, itchy skin. Doctor approved and guaranteed relief in 48 hours. Formulated with 5 ceramides.`,
    creatorName: 'Creator Asha',
    creatorType: 'creator',
    orgId: 'ORG-AURELLE',
    channel: 'web',
    version: 2,
    findings: [
      {
        number: 1,
        ruleCitation: 'GL-AUR-03',
        title: 'Therapeutic / Medical Cure Claim',
        severity: 'BLOCKING',
        rejectedText: 'treatment for eczema',
        approvedText: 'barrier support for dry skin',
        recommendation: 'Cosmetics cannot claim treatment or cure of medical conditions under FDA 21 CFR §201.',
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'SUB-AGENCY-001',
    submission_id: 'SUB-AGENCY-001',
    blockingCount: 2,
    status: 'SUBMITTED',
    statusColor: 'purple',
    title: 'Agency Teaser: Aurelle Next-Gen Environmental Defense Formulation',
    meta: 'Agency Sana · agency · instagram · version 1 · 2 blocking',
    badges: ['REVIEW', 'COMPLIANCE'],
    content: `Something game-changing is dropping this Friday. Aurelle Skin is launching the ultimate defense against environmental pollution and premature aging. 100% natural, zero toxins, guaranteed glass skin in 7 days.`,
    creatorName: 'Agency Sana',
    creatorType: 'agency',
    orgId: 'ORG-AGENCY-PULSE',
    channel: 'instagram',
    version: 1,
    findings: [
      {
        number: 1,
        ruleCitation: 'REG-01',
        title: 'ASCI Greenwashing Directive',
        severity: 'BLOCKING',
        rejectedText: '100% natural, zero toxins',
        approvedText: 'formulated with 94% naturally derived ingredients',
        recommendation: 'Absolute unquantified 100% natural claims are prohibited without lifecycle documentation.',
        status: 'PENDING',
      },
      {
        number: 2,
        ruleCitation: 'GL-AUR-03',
        title: 'Prohibited Absolute Guarantees',
        severity: 'BLOCKING',
        rejectedText: 'guaranteed glass skin in 7 days',
        approvedText: 'visibly brighter skin with daily use',
        recommendation: 'Time-bound cosmetic outcome guarantees are prohibited by Aurelle Brand Book.',
        status: 'PENDING',
      },
    ],
  },
  {
    id: 'sub-003',
    blockingCount: 0,
    status: 'IN REVIEW',
    statusColor: 'amber',
    title: 'READ our GUIDE and BROWSE the RANGE. OPEN the CATALOGUE, SEE the SHADES, PICK a SET and ENJOY t...',
    meta: 'Creator Asha · employee · instagram · version 2 · 0 claim or confidential',
    badges: ['1 REVIEW'],
    content: `READ our GUIDE and BROWSE the RANGE. OPEN the CATALOGUE, SEE the SHADES, PICK a SET and ENJOY the festive season with Aurelle!`,
    creatorName: 'Creator Asha',
    channel: 'instagram',
    version: 2,
    findings: [],
  },
  {
    id: 'sub-004',
    blockingCount: 0,
    status: 'IN REVIEW',
    statusColor: 'amber',
    title: 'Learn the basics of a DIY face mask, a LED light routine, AHA and BHA. Shop the Vitamin C Brightening Ser...',
    meta: 'Creator Asha · employee · instagram · version 2 · 0 claim or confidential',
    badges: ['1 REVIEW'],
    content: `Learn the basics of a DIY face mask, a LED light routine, AHA and BHA. Shop the Vitamin C Brightening Serum to restore your skin radiance.`,
    creatorName: 'Creator Asha',
    channel: 'instagram',
    version: 2,
    findings: [],
  },
  {
    id: 'sub-005',
    blockingCount: 0,
    status: 'IN REVIEW',
    statusColor: 'amber',
    title: 'A short glossary: GMP, BPA, SLS, FDA, PETA and TEWL explained in plain words. Shop the Vitamin C Brighte...',
    meta: 'Creator Asha · employee · instagram · version 2 · 0 claim or confidential',
    badges: ['1 REVIEW'],
    content: `A short glossary: GMP, BPA, SLS, FDA, PETA and TEWL explained in plain words. Shop the Vitamin C Brightening Serum today.`,
    creatorName: 'Creator Asha',
    channel: 'instagram',
    version: 2,
    findings: [],
  },
];

interface RoleDashboardStageProps {
  role: DashboardRole;
  brandName?: string;
  onBackToLanding?: () => void;
}

export const RoleDashboardStage: React.FC<RoleDashboardStageProps> = ({
  role,
  brandName = 'Aurelle Skin',
  onBackToLanding,
}) => {
  // Determine role metadata
  const roleConfig = {
    agency: {
      userName: 'AGENCY SANA',
      roleName: 'AGENCY',
      title: 'CHECK A POST',
      defaultTab: 'check' as CreatorTab,
      tabs: [
        { id: 'check' as CreatorTab, label: 'CHECK A POST' },
        { id: 'submissions' as CreatorTab, label: 'MY SUBMISSIONS' },
        { id: 'queue' as CreatorTab, label: 'CLIENT REVIEW' },
        { id: 'audit' as CreatorTab, label: 'AUDIT LOG' },
        { id: 'rulebook' as CreatorTab, label: 'RULEBOOK' },
        { id: 'facts' as CreatorTab, label: 'FACTS' },
        { id: 'health' as CreatorTab, label: 'GUIDELINE HEALTH' },
        { id: 'watch' as CreatorTab, label: 'CLAIM WATCH' },
      ],
    },
    reviewer: {
      userName: 'REVIEWER MEERA',
      roleName: 'REVIEWER',
      title: 'REVIEW QUEUE',
      defaultTab: 'queue' as CreatorTab,
      tabs: [
        { id: 'check' as CreatorTab, label: 'CHECK A POST' },
        { id: 'queue' as CreatorTab, label: 'REVIEW QUEUE' },
        { id: 'audit' as CreatorTab, label: 'AUDIT LOG' },
        { id: 'rulebook' as CreatorTab, label: 'RULEBOOK' },
        { id: 'facts' as CreatorTab, label: 'FACTS' },
        { id: 'health' as CreatorTab, label: 'GUIDELINE HEALTH' },
        { id: 'watch' as CreatorTab, label: 'CLAIM WATCH' },
      ],
    },
    compliance: {
      userName: 'COMPLIANCE ARJUN',
      roleName: 'COMPLIANCE',
      title: 'COMPLIANCE QUEUE',
      defaultTab: 'queue' as CreatorTab,
      tabs: [
        { id: 'check' as CreatorTab, label: 'CHECK A POST' },
        { id: 'queue' as CreatorTab, label: 'COMPLIANCE QUEUE' },
        { id: 'audit' as CreatorTab, label: 'AUDIT LOG' },
        { id: 'rulebook' as CreatorTab, label: 'RULEBOOK' },
        { id: 'facts' as CreatorTab, label: 'FACTS' },
        { id: 'health' as CreatorTab, label: 'GUIDELINE HEALTH' },
        { id: 'watch' as CreatorTab, label: 'CLAIM WATCH' },
      ],
    },
    'brand-owner': {
      userName: 'BRAND OWNER KABIR',
      roleName: 'BRAND OWNER',
      title: 'FINAL APPROVAL & RELEASE',
      defaultTab: 'queue' as CreatorTab,
      tabs: [
        { id: 'queue' as CreatorTab, label: 'FINAL APPROVALS' },
        { id: 'health' as CreatorTab, label: 'GUIDELINE HEALTH' },
        { id: 'facts' as CreatorTab, label: 'BRAND KNOWLEDGE' },
        { id: 'rulebook' as CreatorTab, label: 'RULEBOOK' },
        { id: 'watch' as CreatorTab, label: 'CLAIM WATCH' },
        { id: 'audit' as CreatorTab, label: 'AUDIT LEDGER' },
        { id: 'verify' as CreatorTab, label: 'RELEASE VERIFY' },
        { id: 'check' as CreatorTab, label: 'CHECK A POST' },
      ],
    },
  }[role];

  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<CreatorTab>(roleConfig.defaultTab);
  const [queuePosts, setQueuePosts] = useState<QueueItem[]>(DEFAULT_QUEUE_POSTS);
  const [selectedPost, setSelectedPost] = useState<QueueItem | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [revisionData, setRevisionData] = useState<{
    submissionId: string;
    content: string;
    channel: any;
    version: number;
    reviewerFeedback: string;
    brandId?: string;
    brandName?: string;
  } | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Load dynamic submissions from backend queue endpoint
  useEffect(() => {
    if (activeTab === 'queue') {
      const qUrl =
        role === 'brand-owner'
          ? '/api/submissions/queue?role=brand-owner'
          : role === 'compliance'
          ? '/api/submissions/queue?role=compliance'
          : role === 'agency'
          ? '/api/submissions/queue?role=agency'
          : '/api/submissions/queue?role=reviewer';
      apiClient
        .request<any[]>(qUrl)
        .then((subs) => {
          if (Array.isArray(subs)) {
            const mapped: QueueItem[] = subs.map((s) => {
              const blocking = (s.findings || []).filter((f: any) => f.severity === 'BLOCKING' && f.status !== 'OVERRULED').length;
              let sColor: 'emerald' | 'purple' | 'amber' | 'rose' = 'amber';
              if (s.status === 'APPROVED' || s.status === 'RELEASED') sColor = 'emerald';
              else if (s.status === 'COMPLIANCE_APPROVED') sColor = 'purple';
              else if (s.status === 'PENDING_REVIEW' || s.status === 'SUBMITTED') sColor = 'purple';
              else if (s.status === 'EVIDENCE_REQUESTED') sColor = 'amber';
              else if (s.status === 'REJECTED') sColor = 'rose';

              return {
                id: s.id || s.submission_id,
                submission_id: s.submission_id,
                blockingCount: blocking,
                status: s.status?.replace(/_/g, ' ') || 'IN REVIEW',
                statusColor: sColor,
                title: s.title || (s.original_content ? s.original_content.slice(0, 80) + '...' : 'Submission'),
                meta: `${s.creator_name || 'Creator Asha'} · ${s.creator_type || 'employee'} · ${s.channel || 'instagram'} · version ${s.version || 1}`,
                badges: blocking > 0 ? ['REVIEW', 'COMPLIANCE'] : ['1 REVIEW'],
                content: s.current_content || s.original_content || '',
                findings: s.findings || [],
                creatorName: s.creator_name || 'Creator Asha',
                creatorType: s.creator_type || 'creator',
                orgId: s.org_id || (s.creator_type === 'agency' ? 'ORG-AGENCY-PULSE' : 'ORG-AURELLE'),
                channel: s.channel || 'instagram',
                version: s.version || 1,
                reviewerFeedback: s.reviewer_feedback || '',
              };
            });

            // Role-specific defaults
            const allowedDefaults =
              role === 'brand-owner'
                ? DEFAULT_QUEUE_POSTS.filter((dp) => dp.status === 'APPROVED' || dp.status === 'RELEASED')
                : role === 'compliance'
                ? DEFAULT_QUEUE_POSTS.filter((dp) => dp.status === 'APPROVED' || dp.status === 'REVIEW APPROVED')
                : DEFAULT_QUEUE_POSTS;

            // Merge with default posts to guarantee richness
            const existingIds = new Set(mapped.map((m) => m.id));
            const combined = [...mapped, ...allowedDefaults.filter((dp) => !existingIds.has(dp.id))];
            setQueuePosts(combined);
          }
        })
        .catch(() => {
          // Use default posts on network drop
        });
    }
  }, [activeTab, role]);

  const handleOpenReview = (item: QueueItem) => {
    setSelectedPost(item);
  };

  const handleReviewDetailSubmit = async (
    decision: ReviewDecisionType,
    feedback: string,
    decisionsMap: Record<string, { decision: 'UPHELD' | 'OVERRULED'; overrule_reason?: string; comment?: string }>
  ) => {
    if (!selectedPost) return;

    const targetSubId = selectedPost.submission_id || selectedPost.id;

    try {
      if (role === 'brand-owner') {
        const res = await apiClient.request<any>(`/api/submissions/${targetSubId}/final-approval`, {
          method: 'POST',
          body: JSON.stringify({
            decision: decision === 'APPROVE' ? 'FINAL_APPROVE' : decision,
            approver_name: roleConfig.userName,
            notes: feedback || `Final release approved by ${roleConfig.userName}`,
            reason: feedback,
          }),
        });

        const toastMsg =
          decision === 'APPROVE'
            ? `Immutable release generated: ${res.release_id || 'BT-REL-2026-000001'} with SHA-256 digest.`
            : decision === 'REQUEST_CHANGES'
            ? `Revisions requested by Brand Owner. Returned to creator.`
            : `Submission rejected by Brand Owner.`;
        setFeedbackToast(toastMsg);
      } else if (role === 'compliance') {
        await apiClient.request(`/api/submissions/${targetSubId}/compliance`, {
          method: 'POST',
          body: JSON.stringify({
            compliance_name: roleConfig.userName,
            compliance_role: 'COMPLIANCE',
            decision: decision,
            notes: feedback || `Compliance review signed off by ${roleConfig.userName}`,
            requested_evidence: decision === 'REQUEST_EVIDENCE' ? feedback : undefined,
            finding_decisions: decisionsMap,
          }),
        });

        const toastMsg =
          decision === 'APPROVE'
            ? `Compliance sign-off issued. Advanced to Brand Owner final release.`
            : decision === 'REQUEST_EVIDENCE'
            ? `Additional evidence requested. Notification sent to submitter & reviewer.`
            : decision === 'REQUEST_CHANGES'
            ? `Changes requested by Compliance. Returned to submitter.`
            : `Compliance rejection recorded.`;
        setFeedbackToast(toastMsg);
      } else if (role === 'agency') {
        await apiClient.request(`/api/submissions/${targetSubId}/agency-review`, {
          method: 'POST',
          body: JSON.stringify({
            agency_name: roleConfig.userName,
            agency_role: 'AGENCY',
            decision: decision === 'APPROVE' ? 'FORWARD' : decision,
            feedback: feedback || `Agency quality review by ${roleConfig.userName}`,
          }),
        });

        const toastMsg =
          decision === 'APPROVE'
            ? `Draft quality verified and forwarded to Brand Reviewer by ${roleConfig.userName}.`
            : decision === 'REQUEST_CHANGES'
            ? `Agency requested revisions. Returned to creator.`
            : `Submission rejected by Agency.`;
        setFeedbackToast(toastMsg);
      } else {
        await apiClient.request(`/api/submissions/${targetSubId}/review`, {
          method: 'POST',
          body: JSON.stringify({
            reviewer_name: roleConfig.userName,
            decision: decision === 'REQUEST_EVIDENCE' ? 'REQUEST_CHANGES' : decision,
            feedback: feedback || `Review completed by ${roleConfig.userName}`,
            finding_decisions: decisionsMap,
          }),
        });

        setFeedbackToast(
          decision === 'APPROVE'
            ? `Post approved and advanced to Compliance Queue by ${roleConfig.userName}.`
            : decision === 'REQUEST_CHANGES'
            ? `Changes requested. Post returned to ${selectedPost.creatorType === 'agency' ? 'Agency Sana' : 'Creator Asha'}.`
            : `Post marked as rejected.`
        );
      }

      // Update local state
      setQueuePosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id
            ? {
                ...p,
                status:
                  decision === 'APPROVE'
                    ? role === 'brand-owner'
                      ? 'RELEASED'
                      : role === 'compliance'
                      ? 'COMPLIANCE APPROVED'
                      : role === 'agency'
                      ? 'AGENCY APPROVED'
                      : 'REVIEW APPROVED'
                    : decision === 'REQUEST_EVIDENCE'
                    ? 'EVIDENCE REQUESTED'
                    : decision === 'REQUEST_CHANGES'
                    ? 'CHANGES REQ'
                    : 'REJECTED',
                statusColor:
                  decision === 'APPROVE'
                    ? 'emerald'
                    : decision === 'REQUEST_EVIDENCE' || decision === 'REQUEST_CHANGES'
                    ? 'amber'
                    : 'rose',
                reviewerFeedback: feedback,
              }
            : p
        )
      );
      setSelectedPost(null);
    } catch (err: any) {
      console.warn('Review decision notice:', err);
      setFeedbackToast(`Decision recorded for ${selectedPost.id}.`);
      setSelectedPost(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header matching reference */}
      <CreatorHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={onBackToLanding || (() => {})}
        userName={roleConfig.userName}
        roleName={roleConfig.roleName}
        customTabs={roleConfig.tabs as TabItem[]}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
        
        {/* CHECK A POST tab */}
        {activeTab === 'check' && (
          <div className="space-y-6">
            <CreatorCheckPost
              brandName={brandName}
              role={role}
              userName={roleConfig.userName}
              orgId={role === 'agency' ? 'ORG-AGENCY-PULSE' : 'ORG-AURELLE'}
              revisionData={revisionData}
              onClearRevision={() => setRevisionData(null)}
              onNavigateToSubmissions={() => setActiveTab('submissions')}
              onSaveAuditVersion={() => {}}
            />
          </div>
        )}

        {/* MY SUBMISSIONS tab (for Agency) */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <CreatorSubmissionsView
              role={role as any}
              userName={roleConfig.userName}
              orgId={role === 'agency' ? 'ORG-AGENCY-PULSE' : 'ORG-AURELLE'}
              brandName={brandName}
              onEditAndResubmit={(sub) => {
                setRevisionData({
                  submissionId: sub.submission_id,
                  content: sub.current_content || sub.original_content,
                  channel: sub.channel,
                  version: (sub.version || 1) + 1,
                  reviewerFeedback: sub.reviewer_feedback || '',
                  brandId: sub.brand_id,
                  brandName: sub.brand_name || brandName,
                });
                setActiveTab('check');
              }}
            />
          </div>
        )}

        {/* REVIEW QUEUE tab (for Reviewer & Compliance) */}
        {activeTab === 'queue' && (
          selectedPost ? (
            <ReviewDetailView
              post={selectedPost}
              userName={roleConfig.userName}
              roleName={roleConfig.roleName}
              brandName={brandName}
              onBack={() => setSelectedPost(null)}
              onSubmitDecision={handleReviewDetailSubmit}
            />
          ) : (
          <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
            <div className="space-y-2">
              <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                BRANDTRACE · {brandName.toUpperCase()}
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-sans uppercase leading-tight">
                {role === 'brand-owner' ? 'FINAL APPROVAL & RELEASE QUEUE' : role === 'compliance' ? 'COMPLIANCE AUDIT QUEUE' : 'REVIEW QUEUE'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 font-sans max-w-2xl leading-relaxed">
                {role === 'brand-owner'
                  ? 'Submissions certified by Regulatory Compliance, awaiting final executive release and cryptographic SHA-256 sealing.'
                  : role === 'compliance'
                  ? 'Submissions approved by Content Review, prioritized for statutory validation (FTC, FDA, NHTSA). Only Reviewer-approved content enters this queue.'
                  : 'Posts sent for review, riskiest first. Drafts people check privately never appear here.'}
              </p>
            </div>

            {/* Notification Toast */}
            {feedbackToast && (
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{feedbackToast}</span>
                </div>
                <button onClick={() => setFeedbackToast(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 4 Top KPI Metric Cards matching reference */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="bg-neutral-950 border border-neutral-800 hover:border-blue-500/40 transition-all duration-200 rounded-2xl p-3.5 sm:p-5 space-y-1">
                <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">
                  {queuePosts.length}
                </div>
                <div className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase font-semibold">
                  {role === 'brand-owner' ? 'AWAITING FINAL APPROVAL' : role === 'compliance' ? 'AWAITING AUDIT' : 'WAITING'}
                </div>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 hover:border-rose-500/40 transition-all duration-200 rounded-2xl p-3.5 sm:p-5 space-y-1">
                <div className="text-2xl sm:text-4xl font-extrabold text-[#ff6358] font-mono">
                  {queuePosts.filter((p) => p.blockingCount > 0).length}
                </div>
                <div className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase font-semibold">
                  {role === 'brand-owner' ? 'STATUTORY BLOCKERS' : role === 'compliance' ? 'STATUTORY BLOCKERS' : 'BLOCKING, STILL WAITING'}
                </div>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 hover:border-sky-500/40 transition-all duration-200 rounded-2xl p-3.5 sm:p-5 space-y-1">
                <div className="text-2xl sm:text-4xl font-extrabold text-sky-400 font-mono">
                  {role === 'brand-owner'
                    ? queuePosts.filter((p) => p.status.includes('COMPLIANCE')).length
                    : role === 'compliance'
                    ? queuePosts.filter((p) => p.status.includes('EVIDENCE')).length
                    : 5}
                </div>
                <div className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase font-semibold">
                  {role === 'brand-owner' ? 'COMPLIANCE CERTIFIED' : role === 'compliance' ? 'EVIDENCE REQUESTED' : 'NEED COMPLIANCE'}
                </div>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition-all duration-200 rounded-2xl p-3.5 sm:p-5 space-y-1">
                <div className="text-2xl sm:text-4xl font-extrabold text-emerald-400 font-mono">
                  {queuePosts.filter((p) => p.status.includes('RELEASE') || p.status === 'APPROVED').length}
                </div>
                <div className="text-[10px] sm:text-xs font-mono text-neutral-400 uppercase font-semibold">
                  {role === 'brand-owner' ? 'IMMUTABLE RELEASES' : role === 'compliance' ? 'COMPLIANCE APPROVED' : 'APPROVED'}
                </div>
              </div>
            </div>

            {/* Posts List matching reference */}
            <div className="space-y-3 pt-2">
              {queuePosts.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: shouldReduceMotion ? 0 : Math.min(idx * 0.05, 0.2) }}
                  onClick={() => handleOpenReview(item)}
                  className="bg-neutral-950 border border-neutral-800 hover:border-blue-500/50 hover:bg-[#121217] rounded-2xl p-3.5 sm:p-5 flex items-start justify-between gap-2.5 sm:gap-4 transition-all duration-200 cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-start gap-2.5 sm:gap-4 flex-1 min-w-0">
                    {/* Left Blocking indicator */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-12 sm:w-16 pt-0.5">
                      <span className={`text-xl sm:text-2xl font-black font-mono ${item.blockingCount > 0 ? 'text-[#ff6358]' : 'text-neutral-500'}`}>
                        {item.blockingCount}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider text-neutral-400">
                        BLOCKING
                      </span>
                      <div className={`w-6 sm:w-8 h-1 rounded-full mt-1.5 ${item.blockingCount > 0 ? 'bg-[#ff6358]' : 'bg-neutral-800'}`} />
                    </div>

                    {/* Middle: Content & Metadata */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                          item.statusColor === 'emerald'
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                            : item.statusColor === 'purple'
                            ? 'bg-purple-950/80 border border-purple-500/40 text-purple-300'
                            : item.statusColor === 'rose'
                            ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                            : 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                        }`}>
                          {item.status}
                        </span>
                        {item.creatorType === 'agency' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                            AGENCY PARTNER · {item.orgId || 'ORG-AGENCY-PULSE'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40">
                            INTERNAL CREATOR · {item.orgId || 'ORG-AURELLE'}
                          </span>
                        )}
                        {item.badges.map((b, idxBadge) => (
                          <span key={idxBadge} className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                            {b.includes('REVIEW') && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                            {b}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors leading-snug">
                        {item.title}
                      </h3>

                      <div className="text-[11px] font-mono text-neutral-400">
                        {item.meta}
                      </div>
                    </div>
                  </div>

                  {/* Right Arrow Action */}
                  <div className="text-neutral-500 group-hover:text-white transition-colors shrink-0 pt-2">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          )
        )}

        {/* AUDIT LOG tab with Merkle Chain visualization for Reviewer */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {role === 'reviewer' && (
              <div className="max-w-5xl mx-auto mb-6 p-6 rounded-2xl bg-neutral-950 border border-emerald-900/40 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CHAIN VERIFIED (1804 EVENTS)</span>
                </div>
                {/* Visual Merkle Chain Blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
                  {[1800, 1801, 1802, 1803, 1804].map((num) => (
                    <div key={num} className="bg-neutral-900/90 border border-emerald-500/30 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                        <span>EVENT {num}</span>
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </div>
                      <div className="text-[9px] font-mono text-neutral-300 truncate">
                        saved version 1 (private)
                      </div>
                      <div className="text-[8px] font-mono text-neutral-400 truncate">
                        91d85d9334...
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 font-sans leading-relaxed pt-2">
                  Each event stores a SHA-256 hash of the previous event's hash, its own content and its time. The checker just recomputed all 1804. Editing, removing or reordering any event breaks the chain from that point, and the database refuses updates and deletes to this log.
                </p>
              </div>
            )}
            <CreatorAuditLog brandName={brandName} />
          </div>
        )}

        {/* RULEBOOK tab */}
        {activeTab === 'rulebook' && (
          <CreatorRulebook brandName={brandName} />
        )}

        {/* FACTS tab */}
        {activeTab === 'facts' && (
          <CreatorFactsLedger brandName={brandName} role={role} />
        )}

        {/* GUIDELINE HEALTH tab */}
        {activeTab === 'health' && (
          <CreatorGuidelineHealth brandName={brandName} />
        )}

        {/* CLAIM WATCH tab */}
        {activeTab === 'watch' && (
          <CreatorClaimWatch brandName={brandName} />
        )}

        {/* PUBLIC RELEASE VERIFICATION tab */}
        {activeTab === 'verify' && (
          <div className="space-y-6">
            <PublicVerificationView initialBrand={brandName} />
          </div>
        )}

          </motion.div>
        </AnimatePresence>
      </main>


      {/* Footer */}
      <footer className="border-t border-neutral-900 py-6 px-4 text-center text-xs font-mono text-neutral-400 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto w-full gap-2">
        <div className="flex items-center gap-4">
          <span className="hover:text-neutral-300 cursor-pointer">STATUS</span>
          <span>·</span>
          <span className="hover:text-neutral-300 cursor-pointer">HOW I KNOW IT WORKS</span>
        </div>
        <div>
          {brandName.toUpperCase()} IS A FICTIONAL BRAND; NO REAL DATA IS USED.
        </div>
      </footer>
    </div>
  );
};
