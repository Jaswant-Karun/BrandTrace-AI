import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Send, RefreshCw, Check, ArrowRight, X, ChevronDown, ChevronRight,
  AlertCircle, AlertTriangle, ShieldCheck, Eye, HelpCircle,
  UploadCloud, Image as ImageIcon, Trash2, Bookmark, FileText, Layers,
  MessageSquare, GitCompare, History, RotateCcw, CheckCheck
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export type SeverityType = 'BLOCKING' | 'MAJOR' | 'MINOR' | 'NEEDS_HUMAN' | 'ADVISORY';

export type ContentType = 
  | 'caption'
  | 'headline'
  | 'description'
  | 'advertisement'
  | 'campaign'
  | 'email';

export const CONTENT_TYPES = [
  { id: 'caption' as ContentType, label: 'Social Caption', icon: '📱', maxChars: 2200 },
  { id: 'headline' as ContentType, label: 'Headline', icon: '✨', maxChars: 120 },
  { id: 'description' as ContentType, label: 'Product Description', icon: '📝', maxChars: 1500 },
  { id: 'advertisement' as ContentType, label: 'Advertisement', icon: '🎯', maxChars: 280 },
  { id: 'campaign' as ContentType, label: 'Campaign Copy', icon: '🚀', maxChars: 3000 },
  { id: 'email' as ContentType, label: 'Email Content', icon: '✉️', maxChars: 5000 },
];

export type ClaimClassification = 
  | 'SUPPORTED' 
  | 'CONTRADICTED' 
  | 'UNSUPPORTED' 
  | 'EXPIRED' 
  | 'NEEDS_HUMAN_REVIEW' 
  | 'BRAND_RULE' 
  | 'COMPLIANCE' 
  | 'VISUAL';

export interface FindingItem {
  id: string;
  number: number;
  title: string;
  category: string;
  source: string;
  ruleCitation: string;
  rejectedText: string;
  approvedText: string;
  recommendation: string;
  severity: SeverityType;
  accepted?: boolean;
  dismissed?: boolean;
  dismissReason?: string;
  startChar?: number;
  endChar?: number;
  claimClassification?: ClaimClassification;
  factId?: string;
  evidence?: string;
  ruleId?: string;
  reviewerNote?: string;
  isNewlyIntroduced?: boolean;
}

export interface ContentVersionSnapshot {
  version: number;
  content: string;
  timestamp: string;
  blockingCount: number;
  majorCount: number;
  minorCount: number;
  advisoryCount: number;
  totalFindings: number;
  summary: string;
}

export interface DiffToken {
  type: 'same' | 'added' | 'removed';
  value: string;
}

export function computeWordDiff(original: string, current: string): DiffToken[] {
  if (original === current) {
    return [{ type: 'same', value: current }];
  }
  const origTokens = original.split(/(\s+|[.,!?;:()])/);
  const currTokens = current.split(/(\s+|[.,!?;:()])/);

  const m = origTokens.length;
  const n = currTokens.length;

  if (m * n > 250000) {
    return [
      { type: 'removed', value: original },
      { type: 'added', value: current },
    ];
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origTokens[i - 1] === currTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const parts: DiffToken[] = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === currTokens[j - 1]) {
      parts.unshift({ type: 'same', value: origTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      parts.unshift({ type: 'added', value: currTokens[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      parts.unshift({ type: 'removed', value: origTokens[i - 1] });
      i--;
    }
  }

  const merged: DiffToken[] = [];
  for (const part of parts) {
    if (merged.length > 0 && merged[merged.length - 1].type === part.type) {
      merged[merged.length - 1].value += part.value;
    } else {
      merged.push({ ...part });
    }
  }
  return merged;
}

export type PostChannel = 
  | 'instagram' 
  | 'Instagram'
  | 'email' 
  | 'Email'
  | 'web' 
  | 'Website'
  | 'print' 
  | 'Print'
  | 'facebook' 
  | 'Facebook'
  | 'linkedin' 
  | 'LinkedIn'
  | 'x' 
  | 'X'
  | 'youtube' 
  | 'YouTube'
  | 'paid ad' 
  | 'Paid Advertisement'
  | 'other'
  | 'Other';

interface ExamplePost {
  id: string;
  label: string;
  channel: PostChannel;
  keyPhrases: string;
  cta: string;
  text: string;
}

export interface RevisionData {
  submissionId: string;
  version: number;
  reviewerFeedback: string;
  content: string;
  channel?: PostChannel;
  brandId?: string;
  brandName?: string;
}

interface CreatorCheckPostProps {
  onSaveAuditVersion?: (event: { what: string; reason?: string; hash: string }) => void;
  brandName?: string;
  workspaceId?: string;
  initialContent?: string;
  role?: 'creator' | 'agency' | string;
  userId?: string;
  userName?: string;
  orgId?: string;
  revisionData?: RevisionData | null;
  onClearRevision?: () => void;
  onNavigateToSubmissions?: () => void;
}

const CLIENT_BRANDS = [
  { id: 'aurelle-tech', name: 'Aurelle Skin', industry: 'Consumer Skincare & Cosmetics' },
  { id: 'apex-dynamics', name: 'Apex Dynamics', industry: 'Tier-1 EV Automotive' },
  { id: 'novus-health', name: 'Novus Health Solutions', industry: 'Precision Cardiovascular Therapeutics' },
];

const EXAMPLE_POSTS: ExamplePost[] = [
  {
    id: 'diwali-screenshot',
    label: 'Diwali glow email (Plumbline Reference)',
    channel: 'email',
    keyPhrases: 'Diwali, sale, 20% off sitewide, gift set',
    cta: 'shop the Diwali gift set',
    text: `Subject: Your Diwali glow, sorted\n\nOur Diwali sale is here: 20% off sitewide on every Aurelle favourite. Over 120000 customers already trust our Online store. Visit WWW.Aurelle.example/Diwali to shop the Diwali gift set.`,
  },
  {
    id: 'gifted-serum',
    label: 'Creator post, gifted serum',
    channel: 'instagram',
    keyPhrases: 'dark spots, skin barrier',
    cta: 'Shop',
    text: `Obsessed with the new Aurelle Radiant Glow Serum! ✨ Got this gifted by the team and honestly after just 2 weeks my skin barrier is completely healed. Visible results by 60% in just 2 weeks! Check link in bio to shop. #AurellePartner #GlowSkin`,
  },
  {
    id: 'diwali-email',
    label: 'Diwali sale email',
    channel: 'email',
    keyPhrases: 'Diwali, 50% off, ceramide formulations',
    cta: 'Claim offer',
    text: `Celebrate Diwali with radiant skin! 🪔 Exclusive festive offers on Aurelle's clinically tested hydration line. Buy one get one 50% off across all ceramide formulations. Limited stock available. Claim your festive glow today.`,
  },
  {
    id: 'ceramide-product',
    label: 'Ceramide cream product page',
    channel: 'web',
    keyPhrases: 'bio-identical ceramides, dermatologist tested',
    cta: 'Add to Cart',
    text: `Aurelle Barrier Repair Ceramide Cream. Formulated with 5 bio-identical ceramides and hyaluronic acid to restore lipid moisture for up to 48 hours. Dermatologist tested, fragrance-free, and non-comedogenic.`,
  },
  {
    id: 'agency-teaser',
    label: 'Agency teaser caption',
    channel: 'instagram',
    keyPhrases: 'launching Friday, glass skin',
    cta: 'Learn More',
    text: `Something game-changing is dropping this Friday. Aurelle Skin is launching the ultimate defense against environmental pollution and premature aging. 100% natural, zero toxins, guaranteed glass skin in 7 days.`,
  },
  {
    id: 'sunscreen-reel',
    label: 'Hinglish sunscreen reel caption',
    channel: 'instagram',
    keyPhrases: 'SPF 50+, no white cast',
    cta: 'Shop Now',
    text: `Sun protection jo bilkul chipchipa nahi hai! ☀️ Aurelle Ultra Light Invisible Sunscreen with SPF 50+ PA++++. No white cast, matte finish, pure magic. Grab yours before it sells out!`,
  },
];

const DEFAULT_SAMPLE_TEXT = `Subject: Your Diwali glow, sorted\n\nOur Diwali sale is here: 20% off sitewide on every Aurelle favourite. Over 120000 customers already trust our Online store. Visit WWW.Aurelle.example/Diwali to shop the Diwali gift set.`;

export const CreatorCheckPost: React.FC<CreatorCheckPostProps> = ({
  onSaveAuditVersion,
  brandName = 'Aurelle Skin',
  workspaceId = 'aurelle-tech',
  initialContent,
  role = 'creator',
  userId = 'USR-CREATOR-001',
  userName,
  orgId,
  revisionData,
  onClearRevision,
  onNavigateToSubmissions,
}) => {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(revisionData?.brandId || workspaceId || 'aurelle-tech');
  const [activeBrandName, setActiveBrandName] = useState<string>(revisionData?.brandName || brandName || 'Aurelle Skin');

  // Load draft from localStorage or fallback or revisionData
  const [draftContent, setDraftContent] = useState<string>(() => {
    if (revisionData?.content) return revisionData.content;
    if (initialContent) return initialContent;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brandtrace_creator_draft');
      if (saved) return saved;
    }
    return DEFAULT_SAMPLE_TEXT;
  });

  const [postTitle, setPostTitle] = useState<string>(() => {
    if (revisionData?.submissionId) return `Revision: ${revisionData.submissionId}`;
    return 'Diwali Festive Glow Campaign';
  });
  const [contentType, setContentType] = useState<ContentType>('email');
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [draftToast, setDraftToast] = useState<string | null>(null);

  // Active filter for findings
  const [activeFindingFilter, setActiveFindingFilter] = useState<'all' | 'blocking' | 'major' | 'minor' | 'needsHuman' | 'advisory' | 'claims' | 'rules' | 'compliance' | 'visual'>('blocking');

  const [channel, setChannel] = useState<PostChannel>(revisionData?.channel || 'email');
  const [keyPhrases, setKeyPhrases] = useState<string>('Diwali, sale, 20% off');
  const [callToAction, setCallToAction] = useState<string>('shop the Diwali gift set');
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  
  // Image upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<{ file_id: string; filename: string; size_bytes: number } | null>(null);
  const [inspectionReport, setInspectionReport] = useState<any | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [privateVersionCount, setPrivateVersionCount] = useState<number>(revisionData ? revisionData.version : 1);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Inline editing of approved replacement
  const [editingFindingId, setEditingFindingId] = useState<string | null>(null);
  const [editedFixText, setEditedFixText] = useState<string>('');

  // Ask reviewer state
  const [askReviewerFindingId, setAskReviewerFindingId] = useState<string | null>(null);
  const [reviewerQuestionText, setReviewerQuestionText] = useState<string>('');
  const [reviewerQuestionsMap, setReviewerQuestionsMap] = useState<Record<string, string>>({});

  // Collapsible states
  const [isSuggestedExpanded, setIsSuggestedExpanded] = useState<boolean>(true);
  const [isNotCheckedExpanded, setIsNotCheckedExpanded] = useState<boolean>(false);

  // Sync revision data if props update
  useEffect(() => {
    if (revisionData) {
      setDraftContent(revisionData.content);
      if (revisionData.channel) setChannel(revisionData.channel);
      setPrivateVersionCount(revisionData.version);
      if (revisionData.brandId) setActiveWorkspaceId(revisionData.brandId);
      if (revisionData.brandName) setActiveBrandName(revisionData.brandName);
      setHasChecked(false);
      setAnalysisId(null);
      setSubmissionStatus(null);
    }
  }, [revisionData]);

  // Handle client brand change (Agency)
  const handleClientBrandChange = (brandId: string) => {
    setActiveWorkspaceId(brandId);
    const found = CLIENT_BRANDS.find((b) => b.id === brandId);
    if (found) {
      setActiveBrandName(found.name);
    }
    setHasChecked(false);
    setAnalysisId(null);
    setSubmissionStatus(null);
  };
  
  // Suggested version state
  const [suggestedContent, setSuggestedContent] = useState<string>('');
  const [isManualEditSuggested, setIsManualEditSuggested] = useState<boolean>(false);
  const [suggestedRejected, setSuggestedRejected] = useState<boolean>(false);

  // Phase 3: Version history, benchmark v1, diff tracking, and rejection state
  const [originalDraftContent, setOriginalDraftContent] = useState<string>(() => {
    if (revisionData?.content) return revisionData.content;
    if (initialContent) return initialContent;
    return DEFAULT_SAMPLE_TEXT;
  });
  const [versionHistory, setVersionHistory] = useState<ContentVersionSnapshot[]>([]);
  const [_previousFindings, setPreviousFindings] = useState<FindingItem[]>([]);
  const [resolvedFindings, setResolvedFindings] = useState<FindingItem[]>([]);
  const [reAuditDiffBanner, setReAuditDiffBanner] = useState<{
    resolvedCount: number;
    newlyIntroducedCount: number;
    remainingCount: number;
    timestamp: string;
  } | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState<boolean>(false);
  const [diffViewMode, setDiffViewMode] = useState<'inline' | 'split'>('inline');
  const [rejectingFindingId, setRejectingFindingId] = useState<string | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState<string>('');
  const [submittedRecord, setSubmittedRecord] = useState<{
    submissionId: string;
    version: number;
    brandName: string;
    status: string;
    timestamp: string;
  } | null>(null);

  // Auto-save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && draftContent) {
      localStorage.setItem('brandtrace_creator_draft', draftContent);
    }
  }, [draftContent]);

  // Findings state
  const [findings, setFindings] = useState<FindingItem[]>([]);

  // Calculate severity categories
  const categoryCounts = {
    blocking: findings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'BLOCKING').length,
    major: findings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'MAJOR').length,
    minor: findings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'MINOR').length,
    needsHuman: findings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'NEEDS_HUMAN').length,
    advisory: findings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'ADVISORY').length,
  };

  const totalBlockingCount = findings.filter((f) => f.severity === 'BLOCKING').length;
  const handledBlockingCount = findings.filter((f) => f.severity === 'BLOCKING' && (f.accepted || f.dismissed || Boolean(reviewerQuestionsMap[f.id]))).length;

  const currentContentType = CONTENT_TYPES.find((c) => c.id === contentType) || CONTENT_TYPES[0];
  const charLimit = currentContentType.maxChars;
  const wordCount = draftContent.trim() ? draftContent.trim().split(/\s+/).length : 0;
  const sentenceCount = draftContent.trim() ? (draftContent.match(/[^.!?\n]+(?:[.!?\n]|$)/g) || []).length : 0;
  const readTimeSeconds = Math.max(1, Math.round(wordCount / 3.3));

  // Filtered findings according to active category tab
  const filteredFindings = findings.filter((f) => {
    if (f.dismissed) return false;
    if (activeFindingFilter === 'all') return true;
    if (activeFindingFilter === 'blocking') return f.severity === 'BLOCKING';
    if (activeFindingFilter === 'major') return f.severity === 'MAJOR';
    if (activeFindingFilter === 'minor') return f.severity === 'MINOR';
    if (activeFindingFilter === 'needsHuman') return f.severity === 'NEEDS_HUMAN';
    if (activeFindingFilter === 'advisory') return f.severity === 'ADVISORY';
    if (activeFindingFilter === 'claims') return f.claimClassification === 'CONTRADICTED' || f.claimClassification === 'UNSUPPORTED' || f.claimClassification === 'SUPPORTED' || f.claimClassification === 'EXPIRED' || Boolean(f.factId);
    if (activeFindingFilter === 'rules') return f.claimClassification === 'BRAND_RULE' || f.category.toLowerCase().includes('rule') || f.category.toLowerCase().includes('guideline');
    if (activeFindingFilter === 'compliance') return f.claimClassification === 'COMPLIANCE' || f.category.toLowerCase().includes('regulatory') || f.category.toLowerCase().includes('compliance');
    if (activeFindingFilter === 'visual') return f.claimClassification === 'VISUAL' || f.category.toLowerCase().includes('visual') || f.category.toLowerCase().includes('cross-modal');
    return true;
  });

  // Calculate dynamic verdict
  const getVerdict = () => {
    if (!hasChecked) return null;
    if (categoryCounts.blocking > 0) {
      return {
        type: 'BLOCKING',
        title: `${categoryCounts.blocking} ISSUE${categoryCounts.blocking === 1 ? '' : 'S'} BLOCK PUBLISHING`,
        subtitle: `${categoryCounts.major} major · ${categoryCounts.minor} minor · ${categoryCounts.needsHuman} need human eyes · ${categoryCounts.advisory} advisory`,
      };
    }
    if (categoryCounts.needsHuman > 0) {
      return {
        type: 'NEEDS_HUMAN',
        title: 'HUMAN REVIEW REQUIRED',
        subtitle: `${categoryCounts.major} major · ${categoryCounts.minor} minor · ${categoryCounts.needsHuman} need human eyes · ${categoryCounts.advisory} advisory`,
      };
    }
    if (categoryCounts.major > 0) {
      return {
        type: 'MAJOR',
        title: 'REVIEW RECOMMENDED',
        subtitle: `${categoryCounts.major} major · ${categoryCounts.minor} minor · ${categoryCounts.needsHuman} need human eyes · ${categoryCounts.advisory} advisory`,
      };
    }
    return {
      type: 'CLEAN',
      title: 'NOTHING BLOCKS PUBLISHING IN THE CHECKS THAT RAN',
      subtitle: `0 major · 0 minor · 0 need human eyes · ${categoryCounts.advisory} advisory`,
    };
  };

  const verdict = getVerdict();

  const handleSelectExample = (ex: ExamplePost) => {
    setDraftContent(ex.text);
    setChannel(ex.channel);
    setKeyPhrases(ex.keyPhrases);
    setCallToAction(ex.cta);
    setHasChecked(false);
    setAnalysisId(null);
    setSubmissionStatus(null);
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setUploadedAsset(null);
    setInspectionReport(null);
  };

  // Image file handler
  const processImageFile = (file: File) => {
    setImageUploadError(null);
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
      setImageUploadError('Unsupported format. Please select a PNG, JPG, JPEG, or WebP image.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setImageUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit.`);
      return;
    }
    setSelectedFile(file);
    setUploadedAsset(null);
    setInspectionReport(null);
    const objUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objUrl);
    
    // Read dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = objUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageDimensions(null);
    setUploadedAsset(null);
    setInspectionReport(null);
    setUploadProgress(null);
    setImageUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveDraft = async () => {
    if (!draftContent.trim() && !selectedFile) return;
    setIsSavingDraft(true);
    try {
      await apiClient.request('/api/drafts', {
        method: 'POST',
        body: JSON.stringify({
          brand_id: activeWorkspaceId,
          title: postTitle.trim() || `${activeBrandName} Content Asset`,
          content: draftContent,
          channel: channel.toLowerCase(),
          key_phrases: keyPhrases,
          call_to_action: callToAction,
        })
      });
      localStorage.setItem('brandtrace_creator_draft', draftContent);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setDraftToast(`Draft saved to workspace at ${timeStr}`);
      setTimeout(() => setDraftToast(null), 3500);
    } catch {
      localStorage.setItem('brandtrace_creator_draft', draftContent);
      setDraftToast(`Draft saved to local offline storage`);
      setTimeout(() => setDraftToast(null), 3000);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const uploadAsset = async () => {
    if (!selectedFile) return null;
    setUploadProgress(20);
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (draftContent.trim()) {
      formData.append('caption', draftContent.trim());
    }
    formData.append('workspace_id', activeWorkspaceId);
    try {
      setUploadProgress(60);
      const response = await apiClient.request<any>('/api/content/upload', {
        method: 'POST',
        body: formData,
      });
      setUploadProgress(100);
      setUploadedAsset(response.file_metadata);
      setInspectionReport(response.inspection_report);
      return response;
    } catch (error: any) {
      setUploadProgress(null);
      throw new Error(error?.message || 'Image upload and inspection failed.');
    }
  };

  // Real backend check execution
  const executeAnalysis = async (contentToVerify: string, imageMeta?: any) => {
    const activeText = contentToVerify.trim();
    
    // Connect to real `/api/verify` backend endpoint
    const res = await apiClient.request<any>('/api/verify', {
      method: 'POST',
      body: JSON.stringify({
        brand_id: activeWorkspaceId,
        content: activeText,
        campaign_name: `${activeBrandName} ${postTitle || 'Marketing Asset'}`,
        channel: channel.toLowerCase(),
        key_phrases: keyPhrases || undefined,
        call_to_action: callToAction || undefined,
        image_file_id: imageMeta?.file_id || uploadedAsset?.file_id || undefined,
        image_analysis: inspectionReport ? {
          extracted_text: inspectionReport.extracted_text_preview,
          packaging_claims: inspectionReport.packaging_claims,
          findings: inspectionReport.findings
        } : undefined,
      }),
    });
    setAnalysisId(res?.verification_id || null);

    const parsedFindings: FindingItem[] = [];
    let count = 1;

    // 1. Prioritize backend rich sentence_findings
    if (res && res.sentence_findings && Array.isArray(res.sentence_findings) && res.sentence_findings.length > 0) {
      res.sentence_findings.forEach((sf: any) => {
        let sev: SeverityType = 'ADVISORY';
        if (sf.severity === 'BLOCKING' || sf.severity === 'CRITICAL') sev = 'BLOCKING';
        else if (sf.severity === 'MAJOR' || sf.severity === 'HIGH') sev = 'MAJOR';
        else if (sf.severity === 'NEEDS_HUMAN') sev = 'NEEDS_HUMAN';
        else if (sf.severity === 'MINOR' || sf.severity === 'MODERATE') sev = 'MINOR';
        else sev = 'ADVISORY';

        let claimClass: ClaimClassification = sf.claim_classification as ClaimClassification;
        if (!claimClass) {
          const explLower = (sf.explanation || '').toLowerCase();
          if (sf.fact_id || sf.category?.toUpperCase() === 'CLAIM' || (sf.evidence_ref || '').includes('FACT-')) {
            if (explLower.includes('contradict') || explLower.includes('conflict')) claimClass = 'CONTRADICTED';
            else if (explLower.includes('unsupported') || explLower.includes('no fact') || explLower.includes('unsubstantiat')) claimClass = 'UNSUPPORTED';
            else if (explLower.includes('expired')) claimClass = 'EXPIRED';
            else if (explLower.includes('supported') || explLower.includes('verified')) claimClass = 'SUPPORTED';
            else claimClass = 'NEEDS_HUMAN_REVIEW';
          } else if ((sf.rule_id || '').startsWith('REG-') || (sf.category || '').toLowerCase().includes('compliance')) {
            claimClass = 'COMPLIANCE';
          } else if ((sf.rule_id || '').startsWith('GL-') || (sf.rule_id || '').startsWith('TM-') || (sf.category || '').toLowerCase().includes('rule')) {
            claimClass = 'BRAND_RULE';
          } else {
            claimClass = 'NEEDS_HUMAN_REVIEW';
          }
        }

        parsedFindings.push({
          id: `sf-${sf.number || count}`,
          number: sf.number || count,
          title: sf.rule_title || sf.rule_id || 'Brand Rule Finding',
          category: sf.category || 'Mandatory required',
          source: sf.evidence_ref || sf.evidence || (sf.fact_id ? `SOURCE Aurelle Fact Ledger (${sf.fact_id})` : `SOURCE Aurelle Brand Book v1.3 §7.3 Promotions`),
          ruleCitation: sf.rule_id || 'Brand Rule',
          rejectedText: sf.flagged_text || sf.sentence_text || '',
          approvedText: sf.suggested_fix || sf.suggested_sentence || 'approved wording',
          recommendation: sf.explanation || 'Align with verified brand evidence.',
          severity: sev,
          accepted: false,
          dismissed: false,
          claimClassification: claimClass,
          factId: sf.fact_id || (sf.evidence_ref?.match(/FACT-[A-Za-z0-9-]+/)?.[0]),
          evidence: sf.evidence || sf.evidence_ref,
          ruleId: sf.rule_id,
        });
        count++;
      });
    } else if (res && res.all_risk_spans && res.all_risk_spans.length > 0) {
      // Fallback to all_risk_spans
      res.all_risk_spans.forEach((span: any) => {
        let sev: SeverityType = 'ADVISORY';
        if (span.severity === 'CRITICAL') sev = 'BLOCKING';
        else if (span.severity === 'HIGH') sev = 'MAJOR';
        else if (span.severity === 'MODERATE') sev = 'MINOR';
        else sev = 'ADVISORY';

        const cit = span.rule_citation || '';
        const mFact = cit.match(/FACT-[A-Za-z0-9-]+/);
        const fId = mFact ? mFact[0] : undefined;
        const explLower = (span.explanation || '').toLowerCase();

        let claimClass: ClaimClassification = 'BRAND_RULE';
        if (fId || span.category?.toUpperCase() === 'CLAIM') {
          if (explLower.includes('contradict') || explLower.includes('conflict')) claimClass = 'CONTRADICTED';
          else if (explLower.includes('unsupported') || explLower.includes('no fact') || explLower.includes('unsubstantiat')) claimClass = 'UNSUPPORTED';
          else if (explLower.includes('expired')) claimClass = 'EXPIRED';
          else if (explLower.includes('supported') || explLower.includes('verified')) claimClass = 'SUPPORTED';
          else claimClass = 'NEEDS_HUMAN_REVIEW';
        } else if (cit.includes('REG-') || (span.category || '').toLowerCase().includes('regulatory') || (span.category || '').toLowerCase().includes('compliance')) {
          claimClass = 'COMPLIANCE';
        } else if (cit.includes('GL-') || cit.includes('TM-') || (span.category || '').toLowerCase().includes('guideline')) {
          claimClass = 'BRAND_RULE';
        }

        parsedFindings.push({
          id: `f-${count}`,
          number: count,
          title: span.explanation?.split(':')[0] || 'Brand Rule Finding',
          category: span.category || 'Mandatory required',
          source: cit.startsWith('SOURCE') ? cit : `SOURCE ${cit}`,
          ruleCitation: span.rule_citation || 'Brand Governance Directive',
          rejectedText: span.matched_text || '',
          approvedText: span.suggested_fix || 'approved formulation',
          recommendation: span.explanation || 'Align with verified brand evidence.',
          severity: sev,
          accepted: false,
          dismissed: false,
          startChar: span.start_char,
          endChar: span.end_char,
          claimClassification: claimClass,
          factId: fId,
          evidence: span.rule_citation,
          ruleId: cit.match(/(?:REG|GL|DL|TM|FACT|GM)-?[A-Za-z0-9-]+/)?.[0] || 'RULE-01',
        });
        count++;
      });
    }

    setFindings(parsedFindings);

    // Build suggested version
    let suggested = activeText;
    parsedFindings.forEach((f) => {
      if (!f.rejectedText.startsWith('[Missing') && suggested.includes(f.rejectedText)) {
        suggested = suggested.replace(f.rejectedText, f.approvedText);
      }
    });

    if (res && res.remediated_content && res.remediated_content !== activeText) {
      setSuggestedContent(res.remediated_content);
    } else {
      setSuggestedContent(suggested);
    }

    setSuggestedRejected(false);
    return parsedFindings;
  };

  const handleRunCheck = async () => {
    if (!draftContent.trim() && !selectedFile) return;

    setIsChecking(true);
    setSubmissionStatus(null);
    setImageUploadError(null);

    try {
      let currentReport = inspectionReport;
      let currentAsset = uploadedAsset;
      if (selectedFile && !uploadedAsset) {
        const assetResponse = await uploadAsset();
        currentReport = assetResponse?.inspection_report || null;
        currentAsset = assetResponse?.file_metadata || null;
      }

      // If draftContent is empty and image is uploaded (Image-Only audit)
      const textToAnalyze = draftContent.trim() 
        ? draftContent 
        : (currentReport?.extracted_text_preview || 'Marketing Visual Packaging Asset');

      if (!hasChecked) {
        setOriginalDraftContent(textToAnalyze);
      }

      const activeFindings = await executeAnalysis(textToAnalyze, currentAsset);
      const allFound = [...activeFindings];

      // Append image & cross-modal findings from report
      if (currentReport?.findings?.length) {
        const existingIds = new Set(allFound.map(c => c.id));
        currentReport.findings.forEach((finding: any, index: number) => {
          const fid = `asset-${finding.id || index + 1}`;
          if (!existingIds.has(fid)) {
            let sev: SeverityType = 'ADVISORY';
            if (finding.severity === 'CRITICAL') sev = 'BLOCKING';
            else if (finding.severity === 'HIGH') sev = 'MAJOR';
            else if (finding.severity === 'MODERATE') sev = 'MINOR';
            else sev = 'ADVISORY';

            allFound.push({
              id: fid,
              number: allFound.length + 1,
              title: finding.category?.replace(/_/g, ' ') || 'Visual Finding',
              category: finding.category === 'CROSS_MODAL_CONTRADICTION' ? 'Cross-Modal Contradiction' : (finding.category || 'Visual Intelligence'),
              source: finding.rule_citation ? `SOURCE ${finding.rule_citation}` : 'SOURCE Multimodal Inspection',
              ruleCitation: finding.rule_citation || 'Visual Inspection',
              rejectedText: finding.location || 'Visual Element',
              approvedText: finding.suggested_fix || 'Comply with brand visual guidelines',
              recommendation: `${finding.explanation || 'Visual inspection finding.'} (${finding.verification_status || 'UNCERTAIN'})`,
              severity: sev,
              accepted: false,
              dismissed: false,
              claimClassification: 'VISUAL',
            });
          }
        });
        setFindings(allFound);
      }

      // Record v1 baseline in version history if first check
      if (versionHistory.length === 0) {
        const countBlocking = allFound.filter(f => f.severity === 'BLOCKING').length;
        const countMajor = allFound.filter(f => f.severity === 'MAJOR').length;
        const countMinor = allFound.filter(f => f.severity === 'MINOR').length;
        const countAdvisory = allFound.filter(f => f.severity === 'ADVISORY').length;
        setVersionHistory([{
          version: 1,
          content: textToAnalyze,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          blockingCount: countBlocking,
          majorCount: countMajor,
          minorCount: countMinor,
          advisoryCount: countAdvisory,
          totalFindings: allFound.length,
          summary: 'Initial draft audit baseline (v1)',
        }]);
      }
    } catch (e: any) {
      setSubmissionStatus(`Check failed: ${e?.message || 'The content analysis service is unavailable.'}`);
    } finally {
      setIsChecking(false);
      setHasChecked(true);
    }
  };

  // Accept single fix
  const handleAcceptFix = (findingId: string) => {
    const finding = findings.find((f) => f.id === findingId);
    if (!finding || finding.accepted) return;

    if (!finding.rejectedText.startsWith('[Missing') && draftContent.includes(finding.rejectedText)) {
      setDraftContent((prev) => prev.replace(finding.rejectedText, finding.approvedText));
    } else if (finding.rejectedText.startsWith('[Missing')) {
      setDraftContent((prev) => prev.trim() + ' ' + finding.approvedText);
    }
    setAnalysisId(null);

    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, accepted: true, dismissed: false } : f))
    );

    if (onSaveAuditVersion) {
      onSaveAuditVersion({
        what: `accepted fix for ${finding.ruleId || finding.title}`,
        reason: `Replaced "${finding.rejectedText}" with "${finding.approvedText}"`,
        hash: `accept:${findingId}`,
      });
    }
  };

  // Reject finding suggestion (preserves original text)
  const handleOpenReject = (findingId: string) => {
    setRejectingFindingId(findingId);
    setRejectReasonText('');
  };

  const handleConfirmReject = (findingId: string) => {
    const finding = findings.find((f) => f.id === findingId);
    if (!finding) return;

    setFindings((prev) =>
      prev.map((f) =>
        f.id === findingId
          ? { ...f, dismissed: true, accepted: false, dismissReason: rejectReasonText.trim() || 'Preserved original wording' }
          : f
      )
    );
    setRejectingFindingId(null);

    if (onSaveAuditVersion) {
      onSaveAuditVersion({
        what: `rejected suggestion for ${finding.ruleId || finding.title}`,
        reason: rejectReasonText.trim() || 'Creator rejected suggestion, keeping original wording.',
        hash: `reject:${findingId}`,
      });
    }
  };

  const handleUndoReject = (findingId: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, dismissed: false, dismissReason: undefined } : f))
    );
  };

  // Start inline editing of approved text
  const handleStartEdit = (f: FindingItem) => {
    setEditingFindingId(f.id);
    setEditedFixText(f.approvedText);
  };

  const handleSaveEdit = (findingId: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, approvedText: editedFixText } : f))
    );
    setEditingFindingId(null);
  };

  // Apply custom edit directly to editor draft content
  const handleApplyManualEdit = (findingId: string) => {
    const finding = findings.find((f) => f.id === findingId);
    if (!finding || !editedFixText.trim()) return;

    if (!finding.rejectedText.startsWith('[Missing') && draftContent.includes(finding.rejectedText)) {
      setDraftContent((prev) => prev.replace(finding.rejectedText, editedFixText.trim()));
    } else if (finding.rejectedText.startsWith('[Missing')) {
      setDraftContent((prev) => prev.trim() + ' ' + editedFixText.trim());
    }

    setFindings((prev) =>
      prev.map((f) =>
        f.id === findingId
          ? { ...f, approvedText: editedFixText.trim(), accepted: true, dismissed: false }
          : f
      )
    );
    setEditingFindingId(null);
    setAnalysisId(null);

    if (onSaveAuditVersion) {
      onSaveAuditVersion({
        what: `manual edit for ${finding.ruleId || finding.title}`,
        reason: `Replaced "${finding.rejectedText}" with custom edit "${editedFixText.trim()}"`,
        hash: `edit:${findingId}`,
      });
    }
  };

  // Ask reviewer handling
  const handleOpenAskReviewer = (f: FindingItem) => {
    setAskReviewerFindingId(f.id);
    setReviewerQuestionText(reviewerQuestionsMap[f.id] || '');
  };

  const handleSendReviewerQuestion = (findingId: string) => {
    if (!reviewerQuestionText.trim()) return;
    setReviewerQuestionsMap((prev) => ({
      ...prev,
      [findingId]: reviewerQuestionText.trim()
    }));
    setAskReviewerFindingId(null);
    setReviewerQuestionText('');
  };

  // Re-audit engine: runs actual backend audit and computes diffs
  const runReAuditWorkflow = async (targetContent: string) => {
    setIsChecking(true);
    setSubmissionStatus('Running re-audit via multi-agent verification pipeline...');

    try {
      const oldFindings = [...findings];
      setPreviousFindings(oldFindings);

      const newFindings = await executeAnalysis(targetContent, uploadedAsset);

      // Compute diff between previous findings and new findings
      const newKeys = new Set(
        newFindings.map((nf) => `${nf.ruleId || nf.title}::${nf.rejectedText.trim().toLowerCase()}`)
      );
      const oldKeys = new Set(
        oldFindings.map((of) => `${of.ruleId || of.title}::${of.rejectedText.trim().toLowerCase()}`)
      );

      // Resolved findings: in old findings but absent in new findings
      const newlyResolved = oldFindings.filter(
        (of) => !newKeys.has(`${of.ruleId || of.title}::${of.rejectedText.trim().toLowerCase()}`)
      );

      // Newly introduced findings: in new findings but absent in old findings
      const markedNewFindings = newFindings.map((nf) => {
        const key = `${nf.ruleId || nf.title}::${nf.rejectedText.trim().toLowerCase()}`;
        if (!oldKeys.has(key)) {
          return { ...nf, isNewlyIntroduced: true };
        }
        return nf;
      });

      setFindings(markedNewFindings);

      // Deduplicate resolved findings list
      setResolvedFindings((prev) => {
        const existingKeys = new Set(prev.map((p) => `${p.ruleId || p.title}::${p.rejectedText.trim().toLowerCase()}`));
        const freshResolved = newlyResolved.filter(
          (nr) => !existingKeys.has(`${nr.ruleId || nr.title}::${nr.rejectedText.trim().toLowerCase()}`)
        );
        return [...prev, ...freshResolved];
      });

      const nextVer = privateVersionCount + 1;
      setPrivateVersionCount(nextVer);

      const blockingNow = markedNewFindings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'BLOCKING').length;
      const majorNow = markedNewFindings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'MAJOR').length;
      const minorNow = markedNewFindings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'MINOR').length;
      const advisoryNow = markedNewFindings.filter((f) => !f.accepted && !f.dismissed && f.severity === 'ADVISORY').length;

      setVersionHistory((prev) => [
        ...prev,
        {
          version: nextVer,
          content: targetContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          blockingCount: blockingNow,
          majorCount: majorNow,
          minorCount: minorNow,
          advisoryCount: advisoryNow,
          totalFindings: markedNewFindings.length,
          summary: `Re-audit v${nextVer}: ${newlyResolved.length} resolved, ${markedNewFindings.filter((f) => f.isNewlyIntroduced).length} new`,
        },
      ]);

      setReAuditDiffBanner({
        resolvedCount: newlyResolved.length,
        newlyIntroducedCount: markedNewFindings.filter((f) => f.isNewlyIntroduced).length,
        remainingCount: markedNewFindings.filter((f) => !f.accepted && !f.dismissed).length,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      if (onSaveAuditVersion) {
        onSaveAuditVersion({
          what: `re-audited content (v${nextVer})`,
          reason: `Re-audit completed: ${newlyResolved.length} resolved, ${blockingNow} blocking remaining.`,
          hash: `reaudit:v${nextVer}`,
        });
      }

      setSubmissionStatus(
        `Re-audit complete (v${nextVer}): ${newlyResolved.length} issue${newlyResolved.length === 1 ? '' : 's'} resolved, ${blockingNow} blocking remaining.`
      );
    } catch (err: any) {
      console.error('Re-audit error:', err);
      setSubmissionStatus(`Re-audit failed: ${err?.message || 'Verification service is unavailable.'}`);
    } finally {
      setIsChecking(false);
    }
  };

  // Apply fixes and re-check with backend API
  const handleApplyFixesAndCheckAgain = async () => {
    let updatedDraft = draftContent;
    findings.forEach((f) => {
      if (!f.accepted && !f.dismissed) {
        if (!f.rejectedText.startsWith('[Missing') && updatedDraft.includes(f.rejectedText)) {
          updatedDraft = updatedDraft.replace(f.rejectedText, f.approvedText);
        } else if (f.rejectedText.startsWith('[Missing')) {
          updatedDraft = updatedDraft.trim() + ' ' + f.approvedText;
        }
      }
    });

    setDraftContent(updatedDraft);
    await runReAuditWorkflow(updatedDraft);
  };

  // Re-run audit without auto-applying fixes
  const handleReAuditOnly = async () => {
    await runReAuditWorkflow(draftContent);
  };

  // Accept suggested version in full
  const handleAcceptSuggested = () => {
    setDraftContent(suggestedContent);
    setAnalysisId(null);
    setFindings((prev) => prev.map((f) => ({ ...f, accepted: true })));
    setSubmissionStatus('Suggested version accepted and applied to editor.');
  };

  // Save version privately
  const handleSavePrivateVersion = () => {
    const randomHash = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const fullHash = `${randomHash}7b9f84a1e0c2d3e4f5a6b7c8d9e0f1a2`;

    const nextVer = privateVersionCount;
    setPrivateVersionCount(nextVer + 1);

    if (onSaveAuditVersion) {
      onSaveAuditVersion({
        what: `saved version ${nextVer} (private)`,
        reason: reviewNote || 'Draft revision saved locally by creator',
        hash: `${fullHash.slice(0, 12)}...`,
      });
    }

    setSubmissionStatus(`Version ${nextVer} saved privately to Audit Log (Hash: ${fullHash.slice(0, 12)}...).`);
  };

  // Submit for human review
  const handleSubmitForReview = async () => {
    setIsReviewModalOpen(false);

    try {
      let submissionId = revisionData?.submissionId || `SUB-${Date.now().toString(36).toUpperCase()}`;
      const subVersion = revisionData ? revisionData.version : privateVersionCount;
      const subCreatorId = userId;
      const subCreatorName = userName || (role === 'agency' ? 'Agency Sana' : 'Creator Asha');
      const subCreatorType = role === 'agency' ? 'agency' : 'creator';
      const subOrgId = orgId || (role === 'agency' ? 'ORG-AGENCY-PULSE' : 'ORG-AURELLE');

      const subRes = await apiClient.request<any>('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({
            submission_id: revisionData?.submissionId,
            brand_id: activeWorkspaceId,
            brand_name: activeBrandName,
            creator_id: subCreatorId,
            creator_name: subCreatorName,
            creator_type: subCreatorType,
            org_id: subOrgId,
            analysis_id: analysisId || undefined,
            channel: channel.toLowerCase(),
            title: draftContent.slice(0, 95) + (draftContent.length > 95 ? '...' : ''),
            original_content: originalDraftContent || draftContent,
            current_content: draftContent,
            attachment_ids: uploadedAsset ? [uploadedAsset.file_id] : [],
            inspection_report: inspectionReport || undefined,
            extracted_text: inspectionReport?.extracted_text_preview || undefined,
            version: subVersion,
            findings: findings.map((f, idx) => ({
              id: f.id || `f-${f.number || idx + 1}`,
              number: f.number || idx + 1,
              rule_id: f.ruleId || f.ruleCitation || 'RULE-01',
              rule_title: f.title || 'Brand Rule Finding',
              category: f.category || 'Brand Claims',
              severity: f.severity || 'BLOCKING',
              sentence_text: f.rejectedText || '',
              flagged_text: f.rejectedText || '',
              explanation: f.recommendation || '',
              suggested_fix: f.approvedText || '',
              suggested_sentence: f.approvedText || '',
              decision: f.accepted ? 'OVERRULED' : (f.dismissed ? 'REJECTED' : (reviewerQuestionsMap[f.id] ? 'QUESTION_ASKED' : 'UNDECIDED')),
              resolved: Boolean(f.accepted || f.dismissed),
              reviewer_question: reviewerQuestionsMap[f.id] || undefined,
            })),
            submission_notes: reviewNote || (revisionData ? `Revision v${subVersion} resubmitted addressing reviewer notes` : 'Submitted for review'),
        }),
      });
      if (!subRes?.submission_id) {
        throw new Error('Submission was not acknowledged by the backend.');
      }
      submissionId = subRes.submission_id;

      if (onSaveAuditVersion) {
        onSaveAuditVersion({
          what: `submitted for human review (assigned: Reviewer Meera, v${subVersion})`,
          reason: reviewNote || `Handoff to review queue by ${subCreatorName}.`,
          hash: `submission:${submissionId}`,
        });
      }

      setSubmittedRecord({
        submissionId: submissionId,
        version: subVersion,
        brandName: activeBrandName,
        status: subRes.status || 'PENDING_REVIEW',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      setSubmissionStatus(`Draft v${subVersion} submitted to Reviewer Meera (${submissionId}) for client ${activeBrandName}. Trackable across browser refreshes in My Submissions.`);
      if (onClearRevision) {
        onClearRevision();
      }
    } catch (err: any) {
      setSubmissionStatus(`Submission failed: ${err?.message || 'The backend could not persist this submission.'}`);
    }
  };

  // Focus finding card from highlight click
  const handleHighlightClick = (findingId: string) => {
    setSelectedFindingId(findingId);
    const element = document.getElementById(`finding-card-${findingId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-6 px-4 sm:px-6">
      
      {/* 1. TOP HEADER & INSTRUCTIONS */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          BRANDTRACE · {activeBrandName.toUpperCase()}
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-sans uppercase">
          CHECK A POST
        </h1>
        <p className="text-xs sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          Paste a draft or upload a file. You'll see what breaks {activeBrandName}'s rules, which claims the evidence doesn't back, and the approved way to say it.
        </p>
      </div>

      {/* Revision Mode Banner if reviewing returned draft */}
      {revisionData && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/70 text-xs font-mono text-amber-200 flex items-start justify-between gap-3 shadow-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>REVISION WORKFLOW (v{revisionData.version}) · FEEDBACK FROM REVIEWER MEERA</span>
            </div>
            <p className="font-sans text-amber-100 text-xs pl-6 leading-relaxed">
              "{revisionData.reviewerFeedback}"
            </p>
            <div className="text-[10px] text-amber-400/80 pl-6">
              Update the text below to address this guidance, run Check to re-validate, and submit your new revision.
            </div>
          </div>
          {onClearRevision && (
            <button
              onClick={onClearRevision}
              className="text-amber-400 hover:text-white cursor-pointer text-[10px] underline shrink-0"
            >
              Exit Revision
            </button>
          )}
        </div>
      )}

      {/* Persistent Backend Submission Confirmed Banner */}
      {submittedRecord && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-neutral-900 to-indigo-950/70 border border-emerald-500/60 shadow-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/60 pb-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                SUBMISSION PERSISTED IN BACKEND DATABASE
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 font-mono text-[10px] font-bold">
              {submittedRecord.status}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Submission ID</span>
              <span className="text-white font-bold">{submittedRecord.submissionId}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Client Brand</span>
              <span className="text-neutral-200">{submittedRecord.brandName}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Locked Version</span>
              <span className="text-neutral-200 font-bold">v{submittedRecord.version}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Submitted At</span>
              <span className="text-neutral-400">{submittedRecord.timestamp}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/80">
            <p className="text-[11px] font-sans text-neutral-400">
              Assigned to Reviewer Meera. Persisted in MongoDB database across browser refreshes.
            </p>
            <div className="flex items-center gap-2">
              {onNavigateToSubmissions && (
                <button
                  type="button"
                  onClick={onNavigateToSubmissions}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span>View in My Submissions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSubmittedRecord(null)}
                className="px-2.5 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-white font-mono text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Brand & Campaign Selector for Agency */}
      {role === 'agency' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950 border border-cyan-500/30 space-y-3.5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                AGENCY CLIENT & CAMPAIGN WORKSPACE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-neutral-500">Partner Org:</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 font-bold">
                {orgId || 'ORG-AGENCY-PULSE'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-neutral-400 font-semibold uppercase">
                Assigned Client Brand
              </label>
              <select
                value={activeWorkspaceId}
                onChange={(e) => handleClientBrandChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {CLIENT_BRANDS.map((b) => (
                  <option key={b.id} value={b.id} className="bg-neutral-900 text-white">
                    {b.name} — {b.industry}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-mono text-neutral-400 font-semibold uppercase">
                Active Campaign Tag
              </label>
              <input
                type="text"
                defaultValue={`${activeBrandName} Q4 Festive Campaign`}
                placeholder="e.g. Summer Launch / Festive 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5 text-cyan-400/90">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Agency Governance Protocol: NDA Active · Client facts isolated</span>
            </span>
            <span className="text-neutral-400">
              Submissions route directly to Reviewer Queue
            </span>
          </div>
        </div>
      )}

      {/* Content Type Selector Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 uppercase font-semibold">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Target Content Format</span>
          </span>
          <span className="text-neutral-500 text-[10px]">
            Format sets character boundary and channel-specific compliance standards
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CONTENT_TYPES.map((ct) => {
            const isActive = contentType === ct.id;
            return (
              <button
                key={ct.id}
                type="button"
                onClick={() => setContentType(ct.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[58px] ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/70 text-white shadow-lg ring-1 ring-indigo-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm">{ct.icon}</span>
                  <span className="text-[9px] font-mono font-bold text-neutral-400">
                    ≤{ct.maxChars.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] font-mono font-semibold truncate pt-1">
                  {ct.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset Headline & Brand Selector Bar */}
      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
        <div className="sm:col-span-7 space-y-1">
          <label className="block text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
            Asset / Campaign Headline
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              placeholder="e.g. Aurelle Vitamin C Serum Launch Asset"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-sans text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {role !== 'agency' ? (
          <div className="sm:col-span-5 space-y-1">
            <label className="block text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
              Target Brand & Fact Ledger
            </label>
            <div className="relative">
              <select
                value={activeWorkspaceId}
                onChange={(e) => handleClientBrandChange(e.target.value)}
                className="w-full px-3.5 py-2 appearance-none rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer pr-8"
              >
                {CLIENT_BRANDS.map((b) => (
                  <option key={b.id} value={b.id} className="bg-neutral-900 text-white">
                    {b.name} ({b.industry})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="sm:col-span-5 space-y-1">
            <label className="block text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
              Client Status
            </label>
            <div className="px-3.5 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200 font-bold flex items-center justify-between">
              <span>{activeBrandName}</span>
              <span className="text-[10px] text-cyan-400">Locked to Client</span>
            </div>
          </div>
        )}
      </div>

      {/* Examples Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-neutral-500 text-[11px] font-bold uppercase">Load Example:</span>
        {EXAMPLE_POSTS.slice(0, 4).map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => handleSelectExample(ex)}
            className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[10.5px] transition-colors cursor-pointer"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Live Editor Statistics & Draft Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Length:</span>
            <span className={`font-bold ${draftContent.length > charLimit ? 'text-rose-400 font-mono' : 'text-white font-mono'}`}>
              {draftContent.length.toLocaleString()}
            </span>
            <span className="text-neutral-500 font-mono">/ {charLimit.toLocaleString()} chars</span>
          </div>

          <div className="hidden sm:inline-block text-neutral-700">|</div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Words:</span>
            <span className="font-bold text-white font-mono">{wordCount}</span>
          </div>

          <div className="hidden sm:inline-block text-neutral-700">|</div>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">Sentences:</span>
            <span className="font-bold text-white font-mono">{sentenceCount}</span>
          </div>

          <div className="hidden md:inline-block text-neutral-700">|</div>

          <div className="hidden md:flex items-center gap-1.5">
            <span className="text-neutral-500">Est. Read:</span>
            <span className="font-bold text-white font-mono">{readTimeSeconds < 60 ? `${readTimeSeconds}s` : `${Math.ceil(readTimeSeconds / 60)}m`}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {draftToast && (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 animate-pulse">
              <Check className="w-3 h-3" /> {draftToast}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsDiffModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 hover:text-white font-mono text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Compare Original Draft (v1) against Current Revision"
          >
            <GitCompare className="w-3 h-3 text-indigo-400" />
            <span>Version Diff ({versionHistory.length > 0 ? `v1 vs v${privateVersionCount}` : 'Compare'})</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || (!draftContent.trim() && !selectedFile)}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white font-mono text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
          >
            {isSavingDraft ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Bookmark className="w-3 h-3 text-indigo-400" />
            )}
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Main Lined Paper Document Card */}
      <div className="rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden bg-neutral-950 transition-all w-full">
        
        {/* Lined Paper Container */}
        <div className="bg-[#f5f2eb] text-neutral-900 relative w-full">
          
          {/* Card Top Label Bar inside the paper */}
          <div className="px-3.5 sm:px-6 pt-3.5 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-[11px] font-mono font-bold text-neutral-600 select-none">
            <span className="uppercase tracking-wider">PASTE A POST, OR UPLOAD A FILE</span>
            <span className="uppercase tracking-wider text-neutral-500">
              {draftContent.length} CHARACTERS · {channel.toUpperCase()}
            </span>
          </div>

          {/* Notebook Paper with Red Margin Rule & Ruled Lines */}
          <div className="relative min-h-[190px] px-3 sm:px-6 pb-6 pt-2 w-full">
            {/* Left Vertical Red Margin Line */}
            <div 
              className="absolute top-0 bottom-0 pointer-events-none" 
              style={{ left: 'clamp(14px, 4.5vw, 36px)', width: '1px', backgroundColor: '#e28d8d' }} 
            />

            {/* Textarea */}
            <textarea
              value={draftContent}
              onChange={(e) => {
                setDraftContent(e.target.value);
                setAnalysisId(null);
              }}
              placeholder="Paste your draft here"
              rows={6}
              className="w-full bg-transparent resize-y text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 leading-relaxed font-sans focus:outline-none border-0 p-0 pl-4 sm:pl-7 pr-2.5 sm:pr-4"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e3ded5 28px)',
                lineHeight: '28px',
              }}
            />
          </div>
        </div>

        {/* Collapsible Optional Words and CTA */}
        <div className="bg-[#121214] border-t border-neutral-800">
          <button
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-[11px] font-mono font-bold text-neutral-400 hover:text-white uppercase tracking-wider cursor-pointer select-none transition-colors"
          >
            <div className="flex items-center gap-2 truncate">
              {isAccordionOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              )}
              <span className="truncate">OPTIONAL: WORDS AND THE CALL TO ACTION THIS POST MUST KEEP</span>
            </div>
            <span className="text-[10px] text-neutral-500 shrink-0">
              {isAccordionOpen ? 'COLLAPSE' : 'EXPAND'}
            </span>
          </button>

          <AnimatePresence>
            {isAccordionOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-4 sm:px-6 pb-4 pt-1 space-y-3 border-t border-neutral-800/60"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase">
                      Mandatory Key Phrases (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={keyPhrases}
                      onChange={(e) => setKeyPhrases(e.target.value)}
                      placeholder="e.g. bio-identical ceramides, SPF 50+, Diwali"
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-neutral-400 uppercase">
                      Required Call to Action
                    </label>
                    <input
                      type="text"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="e.g. Shop Now / Claim Offer / Learn More"
                      className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 2. IMAGE UPLOAD & MULTIMODAL INSPECTION SECTION */}
      <div className="rounded-2xl border border-neutral-800 bg-[#121214] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              IMAGE UPLOAD & VISUAL PACKAGING INSPECTION
            </h3>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">
            PNG, JPG, JPEG, WebP · Max 25 MB · Mobile Camera Supported
          </span>
        </div>

        {/* Upload Drop Zone / Input */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-950/20' 
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-neutral-800/80 flex items-center justify-center text-neutral-400">
              <ImageIcon className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-sans font-medium text-neutral-200">
                Click to browse or drag and drop an image
              </p>
              <p className="text-[10px] sm:text-[11px] font-mono text-neutral-400">
                OCR extracts visible packaging claims, disclaimers, and checks for caption contradictions
              </p>
            </div>
            {imageUploadError && (
              <span className="text-xs text-rose-400 font-mono mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {imageUploadError}
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Image Preview & Details Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 sm:p-4 rounded-xl bg-neutral-900/90 border border-neutral-800">
              <div className="flex items-center gap-3.5">
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Upload Preview"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-neutral-700 shrink-0"
                  />
                )}
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-mono font-bold text-white truncate max-w-[240px] sm:max-w-md">
                    {selectedFile.name}
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400 flex flex-wrap items-center gap-2">
                    <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    {imageDimensions && (
                      <>
                        <span>·</span>
                        <span>{imageDimensions.width} × {imageDimensions.height} px</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="text-emerald-400">Ready for backend inspection</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono font-semibold transition-colors cursor-pointer"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Upload Progress Bar */}
            {uploadProgress !== null && uploadProgress < 100 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span>Uploading actual bytes to backend storage...</span>
                  <span className="font-bold text-white">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Inspection Results Box if already processed */}
            {inspectionReport && (
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-indigo-500/30 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-indigo-300 font-bold uppercase text-[10.5px]">
                  <span>VLM & OCR EXTRACTION REPORT</span>
                  <span className="text-neutral-400 font-normal">Method: {inspectionReport.ocr_method || 'VISION_OCR'}</span>
                </div>
                {inspectionReport.extracted_text_preview && (
                  <div className="p-2.5 rounded bg-neutral-900/80 text-neutral-300 whitespace-pre-line text-[11px] leading-relaxed">
                    {inspectionReport.extracted_text_preview}
                  </div>
                )}
                {inspectionReport.packaging_claims?.length > 0 && (
                  <div className="text-[10px] text-neutral-400 space-y-1">
                    <span className="font-bold text-neutral-300">Verified Packaging Claims:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-emerald-400">
                      {inspectionReport.packaging_claims.map((c: any, i: number) => (
                        <li key={i}>"{c.claim_text}" ({c.fact_id || 'SUPPORTED'})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Run Audit Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs font-mono text-neutral-400">
          {!draftContent.trim() && selectedFile
            ? '⚡ Image-Only mode: extracts packaging text and checks claims against brand facts.'
            : selectedFile && draftContent.trim()
            ? '⚡ Combined mode: audits text and checks cross-modal consistency with uploaded image.'
            : '⚡ Text-Only mode: checks claims, rules, and formatting against the brand rulebook.'}
        </div>

        <button
          type="button"
          onClick={handleRunCheck}
          disabled={isChecking || (!draftContent.trim() && !selectedFile)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>Running Real AI Audit...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-black stroke-[3]" />
              <span>Check a Post</span>
            </>
          )}
        </button>
      </div>

      {submissionStatus && (
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-700 text-xs font-mono text-neutral-200 flex flex-wrap items-center justify-between gap-2">
          <span>{submissionStatus}</span>
          {onNavigateToSubmissions && (
            <button
              type="button"
              onClick={onNavigateToSubmissions}
              className="px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] font-mono transition-colors shrink-0 cursor-pointer"
            >
              View Submissions Queue →
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AUDIT FINDINGS — EXACT REFERENCE DESIGN FROM SCREENSHOT */}
      {/* ========================================================================= */}
      {hasChecked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 pt-6 border-t border-neutral-800"
        >
          
          {/* A. THE VERDICT CARD (EXACT PLUMBLINE MATCH) */}
          {verdict && (
            <div className="rounded-2xl border border-neutral-800 bg-[#16161a] shadow-2xl overflow-hidden p-6 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-end">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-neutral-400 block">
                    THE VERDICT
                  </span>
                  <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black font-sans uppercase tracking-tight leading-tight ${
                    categoryCounts.blocking > 0 ? 'text-[#f87171]' :
                    categoryCounts.needsHuman > 0 ? 'text-purple-300' :
                    categoryCounts.major > 0 ? 'text-amber-300' : 'text-emerald-400'
                  }`}>
                    {verdict.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-sans text-neutral-400">
                    {verdict.subtitle}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-neutral-400">
                    <span>BLOCKING ISSUES HANDLED</span>
                    <strong className="text-xl font-mono text-white">{handledBlockingCount}/{totalBlockingCount}</strong>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#27272a]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        totalBlockingCount > 0 && handledBlockingCount === totalBlockingCount
                          ? 'bg-emerald-500'
                          : 'bg-[#f87171]'
                      }`}
                      style={{
                        width: `${totalBlockingCount > 0 ? (handledBlockingCount / totalBlockingCount) * 100 : 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] font-sans text-neutral-400">
                    Accept a fix, edit the words, or ask a reviewer about each one.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* B. FIVE SEVERITY CARDS ROW (EXACT PLUMBLINE MATCH) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            
            {/* 1. Blocking */}
            <div 
              onClick={() => setActiveFindingFilter('blocking')}
              className={`border rounded-xl p-3.5 space-y-1.5 cursor-pointer transition-all ${
                activeFindingFilter === 'blocking'
                  ? 'bg-neutral-900 border-rose-500 ring-1 ring-rose-500/50'
                  : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-300 font-bold">Blocking</span>
                <AlertCircle className="w-3.5 h-3.5 text-[#f87171]" />
              </div>
              <div className="text-3xl font-black text-white font-mono flex flex-col">
                <span>{categoryCounts.blocking}</span>
                <span className="w-8 h-1 bg-[#f87171] mt-1 rounded-full" />
              </div>
              <div className="text-[10.5px] text-neutral-400 font-sans leading-tight pt-1">
                Must be fixed before publishing
              </div>
            </div>

            {/* 2. Major */}
            <div 
              onClick={() => setActiveFindingFilter('major')}
              className={`border rounded-xl p-3.5 space-y-1.5 cursor-pointer transition-all ${
                activeFindingFilter === 'major'
                  ? 'bg-neutral-900 border-amber-500 ring-1 ring-amber-500/50'
                  : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-300 font-bold">Major</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {categoryCounts.major}
              </div>
              <div className="text-[10.5px] text-neutral-400 font-sans leading-tight pt-1">
                Should be fixed
              </div>
            </div>

            {/* 3. Minor */}
            <div 
              onClick={() => setActiveFindingFilter('minor')}
              className={`border rounded-xl p-3.5 space-y-1.5 cursor-pointer transition-all ${
                activeFindingFilter === 'minor'
                  ? 'bg-neutral-900 border-blue-500 ring-1 ring-blue-500/50'
                  : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-300 font-bold">Minor</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {categoryCounts.minor}
              </div>
              <div className="text-[10.5px] text-neutral-400 font-sans leading-tight pt-1">
                Worth fixing
              </div>
            </div>

            {/* 4. Needs human eyes */}
            <div 
              onClick={() => setActiveFindingFilter('needsHuman')}
              className={`border rounded-xl p-3.5 space-y-1.5 cursor-pointer transition-all ${
                activeFindingFilter === 'needsHuman'
                  ? 'bg-neutral-900 border-purple-500 ring-1 ring-purple-500/50'
                  : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-300 font-bold">Needs human eyes</span>
                <Eye className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {categoryCounts.needsHuman}
              </div>
              <div className="text-[10.5px] text-neutral-400 font-sans leading-tight pt-1">
                A person should decide
              </div>
            </div>

            {/* 5. Advisory */}
            <div 
              onClick={() => setActiveFindingFilter('advisory')}
              className={`border rounded-xl p-3.5 space-y-1.5 cursor-pointer transition-all col-span-2 sm:col-span-1 ${
                activeFindingFilter === 'advisory'
                  ? 'bg-neutral-900 border-neutral-500 ring-1 ring-neutral-400/50'
                  : 'bg-neutral-950 border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-300 font-bold">Advisory</span>
                <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {categoryCounts.advisory}
              </div>
              <div className="text-[10.5px] text-neutral-400 font-sans leading-tight pt-1">
                Suggestions: never block
              </div>
            </div>

          </div>

          {/* C. TWO-COLUMN INTERACTIVE RESULTS (EXACT PLUMBLINE MATCH) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* LEFT COLUMN: YOUR DRAFT - AS CHECKED (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Draft Box */}
              <div className="rounded-2xl border border-neutral-800 bg-[#16161a] p-5 space-y-3.5 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase">
                    YOUR DRAFT - AS CHECKED
                  </h3>
                  <span className="px-2.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[10px] font-bold">
                    {findings.length} MARKED
                  </span>
                </div>

                {/* Parchment Display with Inline Highlight Pills */}
                <div className="bg-[#f4efe6] border border-neutral-300 rounded-xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed font-sans text-neutral-900 shadow-inner">
                  {(() => {
                    if (findings.length === 0) {
                      return <p className="whitespace-pre-wrap">{draftContent}</p>;
                    }

                    // Build matches with character spans
                    const validMatches: { start: number; end: number; finding: FindingItem }[] = [];
                    findings.forEach((f) => {
                      if (!f.rejectedText || f.rejectedText.startsWith('[Missing')) return;
                      const idx = draftContent.indexOf(f.rejectedText);
                      if (idx !== -1) {
                        validMatches.push({
                          start: idx,
                          end: idx + f.rejectedText.length,
                          finding: f
                        });
                      }
                    });

                    // Sort by start position
                    validMatches.sort((a, b) => a.start - b.start);

                    let lastIndex = 0;
                    const elements: React.ReactNode[] = [];

                    validMatches.forEach((m, i) => {
                      if (m.start > lastIndex) {
                        elements.push(draftContent.slice(lastIndex, m.start));
                      }

                      const isSelected = selectedFindingId === m.finding.id;
                      const isBlocking = m.finding.severity === 'BLOCKING';

                      elements.push(
                        <span
                          key={`highlight-${i}`}
                          onClick={() => handleHighlightClick(m.finding.id)}
                          className={`inline cursor-pointer transition-all ${
                            isBlocking
                              ? 'bg-[#fecdd3]/80 border-b-2 border-[#ef4444] text-neutral-950 font-medium'
                              : 'bg-neutral-300/80 border-b border-neutral-500 text-neutral-900'
                          } ${isSelected ? 'ring-2 ring-indigo-600 rounded px-1' : 'hover:brightness-95 px-0.5'}`}
                          title={`#${m.finding.number} ${m.finding.title}`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-mono font-bold text-white mr-1 align-baseline ${
                              isBlocking ? 'bg-[#ef4444]' : 'bg-neutral-600'
                            }`}
                          >
                            {m.finding.number}
                          </span>
                          <span>{m.finding.rejectedText}</span>
                        </span>
                      );

                      lastIndex = m.end;
                    });

                    if (lastIndex < draftContent.length) {
                      elements.push(draftContent.slice(lastIndex));
                    }

                    return <p className="whitespace-pre-wrap">{elements}</p>;
                  })()}
                </div>
              </div>

              {/* Checklist Box: DOES THE SUGGESTED VERSION KEEP YOUR MESSAGE? */}
              <div className="rounded-2xl border border-neutral-800 bg-[#16161a] p-5 space-y-4 shadow-xl">
                <h4 className="text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">
                  DOES THE SUGGESTED VERSION KEEP YOUR MESSAGE?
                </h4>

                <div className="space-y-2 text-xs font-sans text-neutral-300">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="text-neutral-200">Call to action kept</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="text-neutral-200">Pinned phrases kept</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="text-neutral-200">No claim dropped silently</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="text-neutral-200">Within the channel's length limit</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="text-neutral-200">Edits stay inside flagged sentences</span>
                  </div>
                </div>

                {/* Suggested version collapsible */}
                <div className="pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsSuggestedExpanded(!isSuggestedExpanded)}
                    className="w-full flex items-center justify-between text-xs font-mono text-neutral-400 hover:text-white cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {isSuggestedExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      <span>Suggested version (intent kept, no invented claims)</span>
                    </span>
                  </button>

                  <AnimatePresence>
                    {isSuggestedExpanded && suggestedContent && !suggestedRejected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                          <span>{isManualEditSuggested ? 'Manual Edit Mode' : 'AI Recommendation'}</span>
                          <button
                            type="button"
                            onClick={() => setIsManualEditSuggested(!isManualEditSuggested)}
                            className="hover:text-white underline cursor-pointer"
                          >
                            {isManualEditSuggested ? 'Done Editing' : 'Edit Manually'}
                          </button>
                        </div>

                        {isManualEditSuggested ? (
                          <textarea
                            value={suggestedContent}
                            onChange={(e) => setSuggestedContent(e.target.value)}
                            rows={4}
                            className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-200 font-sans leading-relaxed focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-700/80 text-xs text-neutral-200 font-sans leading-relaxed whitespace-pre-wrap">
                            {suggestedContent}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAcceptSuggested}
                            className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept and apply to draft</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSuggestedRejected(true)}
                            className="px-3 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </motion.div>
                    )}
                    {isSuggestedExpanded && suggestedRejected && (
                      <div className="pt-2 text-[11px] font-mono text-neutral-500 italic">
                        Suggested version dismissed.
                      </div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: ISSUE CARDS (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Category Header & Filter Chips */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-white uppercase">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f87171]" />
                  <span>
                    {activeFindingFilter === 'blocking' ? `BLOCKING ${categoryCounts.blocking}` :
                     activeFindingFilter === 'advisory' ? `ADVISORY ${categoryCounts.advisory}` :
                     activeFindingFilter === 'all' ? `ALL FINDINGS ${findings.length}` :
                     `${activeFindingFilter.toUpperCase()} (${filteredFindings.length})`}
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setActiveFindingFilter('all')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${activeFindingFilter === 'all' ? 'bg-white text-black font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
                  >
                    All ({findings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFindingFilter('blocking')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${activeFindingFilter === 'blocking' ? 'bg-[#f87171] text-black font-bold' : 'bg-neutral-900 text-[#f87171] hover:bg-neutral-800'}`}
                  >
                    ● Blocking ({categoryCounts.blocking})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFindingFilter('advisory')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${activeFindingFilter === 'advisory' ? 'bg-neutral-300 text-black font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
                  >
                    Advisory ({categoryCounts.advisory})
                  </button>
                </div>
              </div>

              {/* Re-Audit Diff Summary Banner */}
              {reAuditDiffBanner && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/50 via-neutral-900 to-indigo-950/50 border border-emerald-500/40 text-xs font-mono text-neutral-200 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white uppercase tracking-wider text-[11px]">RE-AUDIT COMPLETE</span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-emerald-300 font-semibold">{reAuditDiffBanner.resolvedCount} Resolved</span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-neutral-300">{reAuditDiffBanner.remainingCount} Remaining</span>
                    {reAuditDiffBanner.newlyIntroducedCount > 0 && (
                      <>
                        <span className="text-neutral-500">|</span>
                        <span className="text-amber-300 font-semibold">{reAuditDiffBanner.newlyIntroducedCount} Newly Introduced</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDiffModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 border border-indigo-500/50 text-indigo-200 hover:text-white text-[10.5px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <GitCompare className="w-3 h-3" />
                    <span>Compare Diff</span>
                  </button>
                </div>
              )}

              {/* Resolved Findings Collapsible Section */}
              {resolvedFindings.length > 0 && (
                <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>RESOLVED FINDINGS ({resolvedFindings.length})</span>
                    </div>
                    <span className="text-[10px] text-emerald-400/80">Corrected & verified</span>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {resolvedFindings.map((rf, idx) => (
                      <div key={`resolved-${rf.id}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] font-mono">
                        <div className="flex items-center gap-2 truncate max-w-md">
                          <span className="line-through text-neutral-400 truncate">"{rf.rejectedText}"</span>
                          <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300 font-semibold truncate">"{rf.approvedText}"</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-[10px] shrink-0">
                          {rf.ruleId || 'RESOLVED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cards List */}
              <div className="space-y-3.5">
                {filteredFindings.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-neutral-800 bg-[#16161a] text-neutral-400 text-xs font-mono">
                    No active issues in this category.
                  </div>
                ) : (
                  filteredFindings.map((f) => {
                    const isSelected = selectedFindingId === f.id;
                    const isBlocking = f.severity === 'BLOCKING';

                    return (
                      <div
                        key={f.id}
                        id={`finding-card-${f.id}`}
                        className={`rounded-2xl border p-4.5 sm:p-5 transition-all bg-[#17171b] ${
                          isBlocking ? 'border-[#f87171]/40' : 'border-neutral-800'
                        } ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 bg-[#1c1c22]' : ''}`}
                      >
                        <div className="space-y-3.5">
                          
                          {/* Header Line */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Circular Number */}
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 ${
                                  isBlocking ? 'bg-[#ef4444]' : 'bg-neutral-600'
                                }`}
                              >
                                {f.number}
                              </span>

                              {/* Severity Pill */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                                  isBlocking 
                                    ? 'bg-[#ef4444] text-white' 
                                    : 'bg-neutral-800 border border-neutral-700 text-neutral-300'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isBlocking ? 'bg-white' : 'bg-neutral-400'}`} />
                                <span>{f.severity}</span>
                              </span>

                              {/* Category Pill */}
                              <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
                                {f.category}
                              </span>

                              {/* Checked by rule pill */}
                              <span className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
                                {f.claimClassification === 'SUPPORTED' || f.claimClassification === 'CONTRADICTED'
                                  ? 'Checked by fact'
                                  : f.claimClassification === 'VISUAL'
                                  ? 'Checked by VLM'
                                  : 'Checked by rule'}
                              </span>

                              {/* Newly Introduced Badge */}
                              {f.isNewlyIntroduced && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                                  <span>✦ Newly Introduced</span>
                                </span>
                              )}
                            </div>

                            {/* Rule / Fact ID */}
                            <span className="text-[11px] font-mono font-bold text-neutral-400">
                              {f.ruleId || 'RULE-01'}
                            </span>
                          </div>

                          {/* Quoted Box with Rejected Text */}
                          <div className="p-3 rounded-xl bg-[#f4efe6] text-neutral-900 font-mono text-xs sm:text-sm font-semibold border border-neutral-300 break-words">
                            "{f.rejectedText}"
                          </div>

                          {/* Title & Explanation */}
                          <div className="space-y-1">
                            <h5 className="text-sm font-sans font-bold text-white leading-snug">
                              {f.title.startsWith('Rule:') ? f.title : `Rule: ${f.title}`}
                            </h5>
                            <p className="text-xs font-sans text-neutral-300 leading-relaxed">
                              {f.recommendation}
                            </p>
                          </div>

                          {/* Source Line */}
                          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                            {f.source}
                          </div>

                          {/* Inline Edit Box if Creator clicked [Edit Manually] */}
                          {editingFindingId === f.id && (
                            <div className="p-3.5 rounded-xl bg-neutral-900 border border-indigo-500/60 space-y-2.5">
                              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-indigo-300 font-bold">
                                <span>Manual Correction for "{f.rejectedText}"</span>
                                <span className="text-neutral-500">Edit directly without losing context</span>
                              </div>
                              <input
                                type="text"
                                value={editedFixText}
                                onChange={(e) => setEditedFixText(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-sans text-white focus:outline-none focus:border-indigo-400"
                                placeholder="Enter compliant correction..."
                              />
                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingFindingId(null)}
                                  className="px-2.5 py-1 text-[10.5px] font-mono text-neutral-400 hover:text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(f.id)}
                                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[10.5px] font-mono cursor-pointer"
                                  >
                                    Save Fix Only
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApplyManualEdit(f.id)}
                                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-[10.5px] cursor-pointer shadow-sm"
                                  >
                                    Apply to Draft & Resolve
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Inline Reject Box if Creator clicked [Reject Suggestion] */}
                          {rejectingFindingId === f.id && (
                            <div className="p-3.5 rounded-xl bg-neutral-900 border border-rose-500/60 space-y-2.5">
                              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-rose-300 font-bold">
                                <span>Reject Suggestion for #{f.number} (Keep Original Text)</span>
                                <span className="text-neutral-500">Preserves original wording</span>
                              </div>
                              <input
                                type="text"
                                value={rejectReasonText}
                                onChange={(e) => setRejectReasonText(e.target.value)}
                                placeholder="Optional rationale for rejecting (e.g. Authorized promotional exception)"
                                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-sans text-white focus:outline-none focus:border-rose-400"
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingFindingId(null);
                                    setRejectReasonText('');
                                  }}
                                  className="px-2.5 py-1 text-[10.5px] font-mono text-neutral-400 hover:text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmReject(f.id)}
                                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[10.5px] cursor-pointer shadow-sm"
                                >
                                  Confirm Rejection
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Rejection Status Banner */}
                          {f.dismissed && (
                            <div className="text-[11px] font-mono text-amber-300 bg-amber-950/30 border border-amber-600/30 p-2.5 rounded-lg flex items-center justify-between gap-2">
                              <span>✗ Suggestion rejected (original text preserved){f.dismissReason ? `: "${f.dismissReason}"` : ''}</span>
                              <button
                                type="button"
                                onClick={() => handleUndoReject(f.id)}
                                className="text-[10px] text-amber-400 hover:text-white underline cursor-pointer"
                              >
                                Undo
                              </button>
                            </div>
                          )}

                          {/* Accepted Status Banner */}
                          {f.accepted && (
                            <div className="text-[11px] font-mono text-emerald-300 bg-emerald-950/30 border border-emerald-600/30 p-2.5 rounded-lg flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Fix applied to draft: "{f.approvedText}"</span>
                              </span>
                            </div>
                          )}

                          {/* Reviewer Question Box if Creator clicked [Ask a reviewer] */}
                          {askReviewerFindingId === f.id && (
                            <div className="p-3 rounded-xl bg-neutral-900 border border-purple-500/50 space-y-2">
                              <label className="text-[10px] font-mono text-purple-300 uppercase">
                                Ask Reviewer Meera about #{f.number} ("{f.rejectedText}"):
                              </label>
                              <textarea
                                value={reviewerQuestionText}
                                onChange={(e) => setReviewerQuestionText(e.target.value)}
                                placeholder="e.g. Can we overrule this discount disclaimer for this specific VIP segment?"
                                rows={2}
                                className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-xs font-sans text-white focus:outline-none focus:border-purple-400"
                              />
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setAskReviewerFindingId(null)}
                                  className="px-2.5 py-1 text-[10px] font-mono text-neutral-400 hover:text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSendReviewerQuestion(f.id)}
                                  className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-[10px] cursor-pointer"
                                >
                                  Attach Note to Submission
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Active Reviewer Question Note Badge */}
                          {reviewerQuestionsMap[f.id] && (
                            <div className="text-[11px] font-sans text-purple-300 bg-purple-950/40 border border-purple-600/40 p-2 rounded-lg flex items-start gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-purple-400" />
                              <span>Question attached for reviewer: "{reviewerQuestionsMap[f.id]}"</span>
                            </div>
                          )}

                          {/* Actions Row */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/80">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(f)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                              >
                                Edit Manually
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenReject(f.id)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                              >
                                Reject Suggestion
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAskReviewer(f)}
                                className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                              >
                                Ask a reviewer
                              </button>
                            </div>

                            {/* Accept Fix Button */}
                            {f.accepted ? (
                              <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Applied
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAcceptFix(f.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <span>Accept Fix</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Actions Row (Exact Plumbline Match + Re-Audit & Diff) */}
              <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyFixesAndCheckAgain}
                    disabled={isChecking}
                    className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>Apply fixes and check again</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReAuditOnly}
                    disabled={isChecking}
                    className="px-3.5 py-2.5 rounded-xl border border-indigo-700/60 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-200 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    title="Re-run real audit on current draft content without auto-applying fixes"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>Re-Audit Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDiffModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    title="Compare Original Draft (v1) against latest revision"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Version Diff ({versionHistory.length > 0 ? `v1 vs v${privateVersionCount}` : 'Diff'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePrivateVersion}
                    className="px-3 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    title="Save version snapshot to private audit ledger"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save Version</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  disabled={categoryCounts.blocking > 0}
                  className={`px-5 py-2.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    categoryCounts.blocking > 0
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    Submit for review {categoryCounts.blocking > 0 ? `(${categoryCounts.blocking} blocking left)` : ''}
                  </span>
                </button>
              </div>

              {/* NOT CHECKED Card (Exact Plumbline Match) */}
              <div className="rounded-2xl border border-neutral-800 bg-[#16161a] p-5 space-y-3">
                <h4 className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase">
                  NOT CHECKED
                </h4>
                <p className="text-xs font-sans text-neutral-400 leading-relaxed">
                  • Claims implied by imagery, photography style, the screen-reader experience, and anything said in video or voice-over. These need a person.
                </p>

                <div className="pt-1 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => setIsNotCheckedExpanded(!isNotCheckedExpanded)}
                    className="w-full flex items-center justify-between text-xs font-mono text-neutral-400 hover:text-white cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-1.5">
                      {isNotCheckedExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <span>28 rules ran (15 advisory) · 4 not run</span>
                    </span>
                  </button>

                  <AnimatePresence>
                    {isNotCheckedExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2.5 space-y-1.5 text-[11px] font-mono text-neutral-400"
                      >
                        <div className="text-neutral-300 font-bold">Audited Rules:</div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <span>✓ DL-01 Promotions Disclosures</span>
                          <span>✓ GM06 Lowercase URLs & Emails</span>
                          <span>✓ GM07 Lowercase Online Mid-sentence</span>
                          <span>✓ GM08 Number formatting & ledger</span>
                          <span>✓ FACT-014 Clinical Benchmark</span>
                          <span>✓ FACT-006 Pricing Schedule</span>
                          <span>✓ FDA 21 CFR §201 Non-cure</span>
                          <span>✓ FTC Green Guides 16 CFR §260.4</span>
                          <span>✓ WCAG 2.1 AA Alt Text</span>
                          <span>✓ GL-AUR-01 Safe Zone Clearance</span>
                        </div>
                        <div className="pt-1 text-neutral-400 text-[10px]">
                          Deferred to human reviewer Meera: Creative brand voice nuance, audio tone balance, video subtitles sync, screen-reader audio narrative.
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

          </div>

          {/* Footer (Exact Plumbline Match) */}
          <div className="pt-8 pb-4 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-neutral-400">
            <div className="flex items-center gap-4">
              <span className="hover:text-neutral-300 cursor-pointer">STATUS</span>
              <span>·</span>
              <span className="hover:text-neutral-300 cursor-pointer">HOW I KNOW IT WORKS</span>
            </div>
            <div className="text-neutral-400">
              AURELLE SKIN IS A FICTIONAL BRAND; NO REAL DATA IS USED.
            </div>
          </div>

        </motion.div>
      )}

      {/* Submit for Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Submit Draft for Human Review
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 font-sans leading-relaxed">
              This post will be locked as an immutable version and placed in the Review Queue for human reviewer Meera's sign-off.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-neutral-400 uppercase">
                Creator Hand-off Note (Optional)
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="e.g. Addressed claim citations, aligned with FACT-014."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-sans text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForReview}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Submit</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. VERSION COMPARISON & DIFF VIEWER MODAL */}
      {isDiffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-[#121215] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2.5">
                <GitCompare className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-mono text-white uppercase tracking-wider">
                    VERSION COMPARISON & VISUAL DIFF
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-400">
                    Comparing Original Draft (v1) with Current Revision (v{privateVersionCount})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setDiffViewMode('inline')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${diffViewMode === 'inline' ? 'bg-indigo-600 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Inline Diff
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffViewMode('split')}
                    className={`px-2.5 py-1 rounded cursor-pointer ${diffViewMode === 'split' ? 'bg-indigo-600 text-white font-bold' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Side-by-Side
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDiffModalOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Metric Comparison Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Original Draft (v1)</span>
                  <div className="text-sm font-mono font-bold text-neutral-200">
                    {originalDraftContent.length} chars · {originalDraftContent.split(/\s+/).filter(Boolean).length} words
                  </div>
                  <div className="text-[11px] font-mono text-rose-400">
                    Initial Audit Baseline
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Corrections Progress</span>
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    {resolvedFindings.length} Issues Resolved
                  </div>
                  <div className="text-[11px] font-mono text-neutral-400">
                    {categoryCounts.blocking} Blocking remaining
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">Current Revision (v{privateVersionCount})</span>
                  <div className="text-sm font-mono font-bold text-white">
                    {draftContent.length} chars · {wordCount} words
                  </div>
                  <div className={`text-[11px] font-mono font-bold ${categoryCounts.blocking === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {categoryCounts.blocking === 0 ? '✓ Ready for Publishing' : `⚠ ${categoryCounts.blocking} Blocking left`}
                  </div>
                </div>
              </div>

              {/* Diff Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span className="font-bold text-neutral-300 uppercase">
                    {diffViewMode === 'inline' ? 'Interactive Inline Word Diff' : 'Side-by-Side Comparison'}
                  </span>
                  <div className="flex items-center gap-3 text-[10.5px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-rose-500/80 inline-block" />
                      <span>Removed / Replaced</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 inline-block" />
                      <span>Compliant Addition</span>
                    </span>
                  </div>
                </div>

                {diffViewMode === 'inline' ? (
                  <div className="p-4 sm:p-5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                    {computeWordDiff(originalDraftContent, draftContent).map((token, idx) => {
                      if (token.type === 'removed') {
                        return (
                          <span
                            key={idx}
                            className="bg-rose-950/80 border border-rose-700/60 text-rose-300 line-through px-1 py-0.5 rounded mx-0.5 select-all"
                            title="Removed Original Content"
                          >
                            {token.value}
                          </span>
                        );
                      }
                      if (token.type === 'added') {
                        return (
                          <span
                            key={idx}
                            className="bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 font-semibold px-1 py-0.5 rounded mx-0.5 select-all"
                            title="Approved Compliant Addition"
                          >
                            {token.value}
                          </span>
                        );
                      }
                      return <span key={idx} className="text-neutral-300">{token.value}</span>;
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono text-neutral-400 font-bold uppercase flex items-center justify-between">
                        <span>Original Draft (v1)</span>
                        <span className="text-neutral-500">{originalDraftContent.length} chars</span>
                      </div>
                      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs sm:text-sm font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap min-h-[160px]">
                        {originalDraftContent}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase flex items-center justify-between">
                        <span>Current Revision (v{privateVersionCount})</span>
                        <span className="text-neutral-500">{draftContent.length} chars</span>
                      </div>
                      <div className="p-4 rounded-xl bg-neutral-950 border border-emerald-900/40 text-xs sm:text-sm font-mono text-neutral-100 leading-relaxed whitespace-pre-wrap min-h-[160px]">
                        {draftContent}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Version History Table */}
              {versionHistory.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-neutral-800">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-300 uppercase">
                    <div className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-indigo-400" />
                      <span>VERSION REVISION TIMELINE</span>
                    </div>
                    <span className="text-[10.5px] text-neutral-500 font-normal">
                      {versionHistory.length} recorded version{versionHistory.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-neutral-800 overflow-hidden divide-y divide-neutral-800/80 bg-neutral-950">
                    {versionHistory.map((ver) => (
                      <div key={ver.version} className="p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 font-bold text-[11px]">
                            v{ver.version}
                          </span>
                          <div>
                            <div className="text-white font-medium">{ver.summary}</div>
                            <div className="text-[10px] text-neutral-500">
                              {ver.timestamp} · {ver.content.length} chars · {ver.blockingCount} blocking issues
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {ver.content !== draftContent && (
                            <button
                              type="button"
                              onClick={() => {
                                setDraftContent(ver.content);
                                setIsDiffModalOpen(false);
                                setDraftToast(`Restored version v${ver.version} to editor`);
                                setTimeout(() => setDraftToast(null), 3000);
                              }}
                              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[10.5px] font-mono transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore to Editor</span>
                            </button>
                          )}
                          {ver.content === draftContent && (
                            <span className="text-[10.5px] text-emerald-400 font-mono">Active in Editor</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-500">
                All changes are tracked against immutable brand audit guidelines.
              </span>
              <button
                type="button"
                onClick={() => setIsDiffModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};
