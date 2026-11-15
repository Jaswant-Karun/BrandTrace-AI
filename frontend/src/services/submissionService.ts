import { apiClient } from './apiClient';

export type SubmissionStatus = 
  | 'DRAFT'
  | 'CHECKED'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'REVIEW_APPROVED'
  | 'APPROVED'
  | 'REJECTED';

export type FindingSeverity = 'BLOCKING' | 'MAJOR' | 'MINOR' | 'NEEDS_HUMAN' | 'ADVISORY';

export type FindingDecision = 'UNDECIDED' | 'UPHELD' | 'OVERRULED';

export interface ReviewFinding {
  id: string;
  number: number;
  sentenceText: string;
  flaggedText: string;
  category: string;
  severity: FindingSeverity;
  ruleId: string;
  ruleTitle: string;
  explanation: string;
  suggestedFix: string;
  evidenceRef?: string;
  needsHumanReview?: boolean;
  decision: FindingDecision;
  overruleReason?: string;
  resolved?: boolean;
}

export interface ApprovalStep {
  stage: 'CREATOR_SUBMISSION' | 'REVIEWER_APPROVAL' | 'COMPLIANCE_APPROVAL' | 'FINAL_RELEASE';
  label: string;
  user: string;
  role: string;
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING' | 'REJECTED';
  timestamp?: string;
  comments?: string;
}

export interface ContentSubmission {
  id: string;
  taskId?: string;
  brandId: string;
  brandName: string;
  title: string;
  channel: string;
  creatorId: string;
  creatorName: string;
  version: number;
  originalContent: string;
  currentContent: string;
  findings: ReviewFinding[];
  status: SubmissionStatus;
  submittedAt: string;
  updatedAt: string;
  reviewerFeedback?: string;
  rejectionReason?: string;
  approvalHistory: ApprovalStep[];
}

const STORAGE_KEY = 'brandtrace_content_submissions';

const SEED_SUBMISSIONS: ContentSubmission[] = [
  {
    id: 'sub-seed-1',
    taskId: 'REV-CREATOR-SEED-01',
    brandId: 'aurelle-tech',
    brandName: 'Aurelle Skin',
    title: 'Meet the NEW Aurelle Vitamin-C serum! 100% natural and clinically proven to fade dark spots in 2 weeks.',
    channel: 'Instagram',
    creatorId: 'creator-asha',
    creatorName: 'Creator Asha',
    version: 2,
    originalContent: 'Meet the NEW Aurelle Vitamin-C serum! 100% natural, completely eco-friendly and clinically proven to fade dark spots by 60% in just 2 weeks. Doctor approved with zero side effects. Shop today!',
    currentContent: 'Meet the NEW Aurelle Vitamin-C serum! Formulated with 94% naturally derived ingredients and clinically shown to fade dark spots by 32% in 8 weeks (FACT-014). Dermatologist tested with clean ingredients. Shop now!',
    status: 'PENDING_REVIEW',
    submittedAt: 'Today, 2:15 pm',
    updatedAt: 'Today, 2:15 pm',
    findings: [
      {
        id: 'f-1',
        number: 1,
        sentenceText: '100% natural, completely eco-friendly and clinically proven to fade dark spots by 60% in just 2 weeks.',
        flaggedText: 'by 60% in just 2 weeks',
        category: 'Approved Brand Claims',
        severity: 'BLOCKING',
        ruleId: 'FACT-014',
        ruleTitle: 'Approved Clinical Trial Benchmark',
        explanation: 'Clinical evidence confirms 32% reduction in 8 weeks under protocol Protocol AUR-LAB-014, not 60% in 2 weeks.',
        suggestedFix: '32% in 8 weeks (FACT-014)',
        evidenceRef: 'FACT-014 (Clinical Hydration & Barrier Benchmark)',
        needsHumanReview: false,
        decision: 'UNDECIDED',
        resolved: false,
      },
      {
        id: 'f-2',
        number: 2,
        sentenceText: 'Doctor approved with zero side effects.',
        flaggedText: 'zero side effects',
        category: 'Regulatory Compliance',
        severity: 'BLOCKING',
        ruleId: 'FDA 21 CFR §202.1',
        ruleTitle: 'Prescription Drug & Cosmetic Risk Disclosure Fair Balance',
        explanation: 'Cosmetics and wellness products cannot claim "zero side effects" under FDA Fair Balance doctrine.',
        suggestedFix: 'Dermatologist tested with clean ingredients',
        evidenceRef: 'FDA Compliance Directive §202.1',
        needsHumanReview: false,
        decision: 'UNDECIDED',
        resolved: false,
      },
      {
        id: 'f-3',
        number: 3,
        sentenceText: 'Meet the NEW Aurelle Vitamin-C serum!',
        flaggedText: '100% natural',
        category: 'Statutory Advertising',
        severity: 'MAJOR',
        ruleId: 'FTC Green Guides §260.4',
        ruleTitle: 'Substantiation of Absolute Natural Claims',
        explanation: 'Product contains certified bio-identical stabilizing esters. Verified natural origin ratio is 94%.',
        suggestedFix: 'Formulated with 94% naturally derived ingredients',
        evidenceRef: 'FACT-009 (Ingredients Certificate #NAT-2026)',
        needsHumanReview: true,
        decision: 'UNDECIDED',
        resolved: false,
      },
    ],
    approvalHistory: [
      {
        stage: 'CREATOR_SUBMISSION',
        label: 'Creator Submission',
        user: 'Creator Asha',
        role: 'In-House Writer',
        status: 'COMPLETED',
        timestamp: 'Today, 2:15 pm',
        comments: 'Draft submitted after applying evidence citations for FACT-014 and removing zero side effects claim.',
      },
      {
        stage: 'REVIEWER_APPROVAL',
        label: 'Reviewer Approval',
        user: 'Meera',
        role: 'Content Reviewer',
        status: 'ACTIVE',
      },
      {
        stage: 'COMPLIANCE_APPROVAL',
        label: 'Compliance Sign-off',
        user: 'Arjun',
        role: 'Compliance Officer',
        status: 'PENDING',
      },
      {
        stage: 'FINAL_RELEASE',
        label: 'Final Authorized Release',
        user: 'Automated Cryptographic Ledger',
        role: 'SHA-256 Gate',
        status: 'PENDING',
      },
    ],
  },
];

export const submissionService = {
  // Load all submissions from local storage with seed fallback
  getAllSubmissions(): ContentSubmission[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_SUBMISSIONS));
        return SEED_SUBMISSIONS;
      }
      return JSON.parse(data);
    } catch {
      return SEED_SUBMISSIONS;
    }
  },

  // Save submissions
  saveSubmissions(list: ContentSubmission[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to persist submissions to localStorage', e);
    }
  },

  // Create submission from Creator
  async createSubmission(params: {
    brandId: string;
    brandName: string;
    title: string;
    channel: string;
    creatorId: string;
    creatorName: string;
    originalContent: string;
    currentContent: string;
    findings: ReviewFinding[];
  }): Promise<ContentSubmission> {
    const all = this.getAllSubmissions();
    const newId = `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    let taskId: string | undefined;

    // Call backend POST /api/tasks to create real persisted task in MongoDB
    try {
      const res = await apiClient.request<any>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          brand_id: params.brandId || 'aurelle-tech',
          asset_name: params.title.substring(0, 80),
          current_content: params.originalContent,
          proposed_content: params.currentContent,
          diff_summary: `Submitted by ${params.creatorName} via Creator Workspace`,
          creator_name: params.creatorName,
        }),
      });
      if (res && res.task) {
        taskId = res.task.task_id;
      }
    } catch (err) {
      console.warn('Backend /api/tasks fallback:', err);
    }

    const newSub: ContentSubmission = {
      id: newId,
      taskId: taskId || `REV-TASK-${Date.now().toString(16).toUpperCase()}`,
      brandId: params.brandId,
      brandName: params.brandName,
      title: params.title,
      channel: params.channel,
      creatorId: params.creatorId,
      creatorName: params.creatorName,
      version: 1,
      originalContent: params.originalContent,
      currentContent: params.currentContent,
      findings: params.findings,
      status: 'PENDING_REVIEW',
      submittedAt: nowIso,
      updatedAt: nowIso,
      approvalHistory: [
        {
          stage: 'CREATOR_SUBMISSION',
          label: 'Creator Submission',
          user: params.creatorName,
          role: 'In-House Writer',
          status: 'COMPLETED',
          timestamp: nowIso,
          comments: 'Initial draft submitted for formal review.',
        },
        {
          stage: 'REVIEWER_APPROVAL',
          label: 'Reviewer Approval',
          user: 'Meera',
          role: 'Content Reviewer',
          status: 'ACTIVE',
        },
        {
          stage: 'COMPLIANCE_APPROVAL',
          label: 'Compliance Sign-off',
          user: 'Arjun',
          role: 'Compliance Officer',
          status: 'PENDING',
        },
        {
          stage: 'FINAL_RELEASE',
          label: 'Final Authorized Release',
          user: 'Automated Cryptographic Ledger',
          role: 'SHA-256 Gate',
          status: 'PENDING',
        },
      ],
    };

    all.unshift(newSub);
    this.saveSubmissions(all);
    return newSub;
  },

  // Get single submission by ID
  getSubmissionById(id: string): ContentSubmission | undefined {
    const all = this.getAllSubmissions();
    return all.find((s) => s.id === id);
  },

  // Uphold or Overrule a single finding in a submission
  updateFindingDecision(
    submissionId: string, 
    findingId: string, 
    decision: FindingDecision, 
    overruleReason?: string
  ): ContentSubmission | undefined {
    const all = this.getAllSubmissions();
    const sub = all.find((s) => s.id === submissionId);
    if (!sub) return undefined;

    const finding = sub.findings.find((f) => f.id === findingId);
    if (finding) {
      finding.decision = decision;
      if (decision === 'OVERRULED') {
        finding.overruleReason = overruleReason || 'Overruled by content reviewer';
      }
    }

    sub.updatedAt = 'Just now';
    this.saveSubmissions(all);
    return sub;
  },

  // Reviewer Decision: APPROVE, REQUEST_CHANGES, REJECT
  async resolveReview(
    submissionId: string, 
    decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT', 
    feedback?: string
  ): Promise<ContentSubmission | undefined> {
    const all = this.getAllSubmissions();
    const sub = all.find((s) => s.id === submissionId);
    if (!sub) return undefined;

    const nowIso = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    // Call backend /api/tasks/{task_id}/resolve if task_id exists
    if (sub.taskId) {
      try {
        const backendDecision = decision === 'APPROVE' ? 'APPROVED' : decision === 'REQUEST_CHANGES' ? 'CHANGES_REQUESTED' : 'REJECTED';
        await apiClient.request<any>(`/api/tasks/${sub.taskId}/resolve`, {
          method: 'POST',
          body: JSON.stringify({
            reviewer_name: 'Meera (Content Reviewer)',
            decision: backendDecision,
            resolution_notes: feedback || '',
            final_content: sub.currentContent,
          }),
        });
      } catch (err) {
        console.warn('Backend task resolution sync note:', err);
      }
    }

    if (decision === 'APPROVE') {
      sub.status = 'REVIEW_APPROVED';
      sub.reviewerFeedback = feedback;
      sub.approvalHistory[1].status = 'COMPLETED';
      sub.approvalHistory[1].timestamp = nowIso;
      sub.approvalHistory[1].comments = feedback || 'All findings evaluated. Approved for Compliance Sign-off.';
      sub.approvalHistory[2].status = 'ACTIVE';
    } else if (decision === 'REQUEST_CHANGES') {
      sub.status = 'CHANGES_REQUESTED';
      sub.reviewerFeedback = feedback || 'Please address cited findings and resubmit.';
      sub.approvalHistory[1].status = 'ACTIVE';
      sub.approvalHistory[1].comments = `Changes requested: ${feedback}`;
    } else {
      sub.status = 'REJECTED';
      sub.rejectionReason = feedback || 'Content does not meet brand publication guidelines.';
      sub.approvalHistory[1].status = 'REJECTED';
      sub.approvalHistory[1].timestamp = nowIso;
      sub.approvalHistory[1].comments = feedback;
    }

    sub.updatedAt = nowIso;
    this.saveSubmissions(all);
    return sub;
  },

  // Compliance Decision: APPROVE (FINAL RELEASE)
  async resolveCompliance(
    submissionId: string,
    approved: boolean,
    notes?: string
  ): Promise<ContentSubmission | undefined> {
    const all = this.getAllSubmissions();
    const sub = all.find((s) => s.id === submissionId);
    if (!sub) return undefined;

    const nowIso = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    if (approved) {
      sub.status = 'APPROVED';
      sub.approvalHistory[2].status = 'COMPLETED';
      sub.approvalHistory[2].timestamp = nowIso;
      sub.approvalHistory[2].comments = notes || 'Compliance sign-off granted under FDA and FTC statutory guidelines.';
      sub.approvalHistory[3].status = 'COMPLETED';
      sub.approvalHistory[3].timestamp = nowIso;
    } else {
      sub.status = 'REJECTED';
      sub.rejectionReason = notes || 'Compliance sign-off denied.';
      sub.approvalHistory[2].status = 'REJECTED';
      sub.approvalHistory[2].timestamp = nowIso;
      sub.approvalHistory[2].comments = notes;
    }

    sub.updatedAt = nowIso;
    this.saveSubmissions(all);
    return sub;
  },

  // Resubmit by Creator (Creates Version 2 / 3)
  resubmitDraft(
    submissionId: string, 
    newContent: string, 
    newFindings: ReviewFinding[]
  ): ContentSubmission | undefined {
    const all = this.getAllSubmissions();
    const sub = all.find((s) => s.id === submissionId);
    if (!sub) return undefined;

    const nowIso = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    sub.version += 1;
    sub.currentContent = newContent;
    sub.findings = newFindings;
    sub.status = 'PENDING_REVIEW';
    sub.updatedAt = nowIso;
    sub.reviewerFeedback = undefined;
    sub.approvalHistory[0].timestamp = nowIso;
    sub.approvalHistory[0].comments = `Resubmitted as Version ${sub.version} with requested revisions.`;
    sub.approvalHistory[1].status = 'ACTIVE';

    this.saveSubmissions(all);
    return sub;
  },
};
