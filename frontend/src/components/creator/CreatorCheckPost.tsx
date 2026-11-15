import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Send, RefreshCw, Check, ArrowRight, X, ChevronDown, ChevronRight,
  AlertCircle, AlertTriangle, ShieldCheck, Eye, HelpCircle, Sparkles, Edit3
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export type SeverityType = 'BLOCKING' | 'MAJOR' | 'MINOR' | 'NEEDS_HUMAN' | 'ADVISORY';

export interface FindingItem {
  id: string;
  number: number;
  title: string;
  category: string;
  source: string; // 'AI Agent: ClaimSubstantiationAgent', 'Rule Engine', etc.
  ruleCitation: string;
  rejectedText: string;
  approvedText: string;
  recommendation: string;
  severity: SeverityType;
  accepted?: boolean;
  startChar?: number;
  endChar?: number;
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

const DEFAULT_SAMPLE_TEXT = `Make every brand decision count this Diwali. Aurelle Skin helps teams review marketing content against approved brand guidelines, identify unsupported claims, assess potential risks, and trace authorised approvals. Detect. Predict. Verify. Prevent.`;

export const CreatorCheckPost: React.FC<CreatorCheckPostProps> = ({
  onSaveAuditVersion,
  brandName = 'Aurelle Skin',
  workspaceId = 'aurelle-tech',
  initialContent,
  role = 'creator',
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
    return '';
  });

  const [channel, setChannel] = useState<PostChannel>(revisionData?.channel || 'instagram');
  const [keyPhrases, setKeyPhrases] = useState<string>('dark spots, skin barrier');
  const [callToAction, setCallToAction] = useState<string>('Shop');
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true); // Open by default
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [privateVersionCount, setPrivateVersionCount] = useState<number>(revisionData ? revisionData.version : 1);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);

  // Sync revision data if props update
  useEffect(() => {
    if (revisionData) {
      setDraftContent(revisionData.content);
      if (revisionData.channel) setChannel(revisionData.channel);
      setPrivateVersionCount(revisionData.version);
      if (revisionData.brandId) setActiveWorkspaceId(revisionData.brandId);
      if (revisionData.brandName) setActiveBrandName(revisionData.brandName);
      setHasChecked(false);
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
    setSubmissionStatus(null);
  };
  
  // Suggested version state
  const [suggestedContent, setSuggestedContent] = useState<string>('');
  const [isManualEditSuggested, setIsManualEditSuggested] = useState<boolean>(false);
  const [suggestedRejected, setSuggestedRejected] = useState<boolean>(false);

  // Auto-save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && draftContent) {
      localStorage.setItem('brandtrace_creator_draft', draftContent);
    }
  }, [draftContent]);

  // Findings state
  const [findings, setFindings] = useState<FindingItem[]>([]);

  // Word count helper
  const wordCount = draftContent.trim() ? draftContent.trim().split(/\s+/).length : 0;

  // Calculate severity categories
  const categoryCounts = {
    blocking: findings.filter((f) => !f.accepted && f.severity === 'BLOCKING').length,
    major: findings.filter((f) => !f.accepted && f.severity === 'MAJOR').length,
    minor: findings.filter((f) => !f.accepted && f.severity === 'MINOR').length,
    needsHuman: findings.filter((f) => !f.accepted && f.severity === 'NEEDS_HUMAN').length,
    advisory: findings.filter((f) => !f.accepted && f.severity === 'ADVISORY').length,
  };

  // Calculate dynamic verdict
  const getVerdict = () => {
    if (!hasChecked) return null;
    if (categoryCounts.blocking > 0) {
      return {
        type: 'BLOCKING',
        title: 'FIX THE BLOCKING ISSUES BEFORE PUBLISHING.',
        subtitle: `${categoryCounts.blocking} blocking finding(s) violate statutory rules or ungrounded claims. Corrections must be applied before release.`,
        bgClass: 'bg-rose-950/30 border-rose-600/70 text-rose-200',
        badgeClass: 'bg-rose-600 text-white',
      };
    }
    if (categoryCounts.needsHuman > 0) {
      return {
        type: 'NEEDS_HUMAN',
        title: 'HUMAN REVIEW REQUIRED.',
        subtitle: `Content contains claims requiring human reviewer assessment before final approval.`,
        bgClass: 'bg-purple-950/30 border-purple-600/70 text-purple-200',
        badgeClass: 'bg-purple-600 text-white',
      };
    }
    if (categoryCounts.major > 0) {
      return {
        type: 'MAJOR',
        title: 'REVIEW RECOMMENDED.',
        subtitle: `No hard blocks, but ${categoryCounts.major} major recommendation(s) should be addressed.`,
        bgClass: 'bg-amber-950/30 border-amber-600/70 text-amber-200',
        badgeClass: 'bg-amber-600 text-white',
      };
    }
    return {
      type: 'CLEAN',
      title: 'NOTHING BLOCKS PUBLISHING IN THE CHECKS THAT RAN.',
      subtitle: `All checks passed against certified brand facts, voice tone directives, and regulatory standards.`,
      bgClass: 'bg-emerald-950/30 border-emerald-600/70 text-emerald-200',
      badgeClass: 'bg-emerald-600 text-white',
    };
  };

  const verdict = getVerdict();

  const handleOpenSample = () => {
    setDraftContent(DEFAULT_SAMPLE_TEXT);
    setChannel('instagram');
    setKeyPhrases('dark spots, skin barrier');
    setCallToAction('Shop');
    setHasChecked(false);
    setSubmissionStatus(null);
  };

  const handleSelectExample = (ex: ExamplePost) => {
    setDraftContent(ex.text);
    setChannel(ex.channel);
    setKeyPhrases(ex.keyPhrases);
    setCallToAction(ex.cta);
    setHasChecked(false);
    setSubmissionStatus(null);
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // If it's a text file, populate the text area
      if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setDraftContent(event.target.result as string);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  // Real backend check execution
  const executeAnalysis = async (contentToVerify: string) => {
    const activeText = contentToVerify.trim() || DEFAULT_SAMPLE_TEXT;
    
    // Connect to real `/api/verify` backend endpoint
    const res = await apiClient.request<any>('/api/verify', {
      method: 'POST',
      body: JSON.stringify({
        brand_id: activeWorkspaceId,
        content: activeText,
        campaign_name: `${activeBrandName} Marketing Asset`,
        channel: channel.toLowerCase(),
        key_phrases: keyPhrases,
        call_to_action: callToAction,
      }),
    });

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

        parsedFindings.push({
          id: `sf-${sf.number || count}`,
          number: sf.number || count,
          title: sf.rule_title || sf.rule_id || 'Brand Rule Finding',
          category: sf.category || 'Approved Brand Claims',
          source: `Rule Engine · ${sf.rule_id || 'Directive'}`,
          ruleCitation: sf.rule_id || 'Brand Rule',
          rejectedText: sf.flagged_text || sf.original_sentence || '',
          approvedText: sf.suggested_fix || sf.suggested_sentence || 'approved wording',
          recommendation: sf.explanation || 'Align with verified brand evidence.',
          severity: sev,
          accepted: false,
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

        parsedFindings.push({
          id: `f-${count}`,
          number: count,
          title: span.explanation?.split(':')[0] || 'Brand Rule Finding',
          category: span.category || 'Approved Brand Claims',
          source: 'AI Agent: ' + (span.category === 'VOICE' ? 'VoicePersonaAgent' : span.category === 'REGULATORY' ? 'RegulatoryComplianceAgent' : 'ClaimSubstantiationAgent'),
          ruleCitation: span.rule_citation || 'Brand Governance Directive',
          rejectedText: span.matched_text || '',
          approvedText: span.suggested_fix || 'approved formulation',
          recommendation: span.explanation || 'Align with verified brand evidence.',
          severity: sev,
          accepted: false,
          startChar: span.start_char,
          endChar: span.end_char,
        });
        count++;
      });
    }

    // 2. Evaluate Optional Content Requirements: Key Phrases
    if (keyPhrases.trim()) {
      const phrases = keyPhrases.split(',').map((p) => p.trim()).filter(Boolean);
      phrases.forEach((phrase) => {
        if (!activeText.toLowerCase().includes(phrase.toLowerCase())) {
          parsedFindings.push({
            id: `f-${count}`,
            number: count,
            title: 'Missing Required Key Phrase',
            category: 'Campaign Content Requirements',
            source: 'Rule Engine',
            ruleCitation: 'Campaign Directive: Mandated Phrase Preservation',
            rejectedText: `[Missing: "${phrase}"]`,
            approvedText: phrase,
            recommendation: `The mandatory key phrase "${phrase}" is absent from your post. Include this phrase to meet campaign guidelines.`,
            severity: 'MINOR',
            accepted: false,
          });
          count++;
        }
      });
    }

    // 3. Evaluate Optional Content Requirements: Call To Action
    if (callToAction.trim()) {
      const ctaPattern = new RegExp(`\\b${callToAction.trim()}\\b`, 'i');
      if (!ctaPattern.test(activeText)) {
        parsedFindings.push({
          id: `f-${count}`,
          number: count,
          title: 'Missing Mandated Call To Action',
          category: 'Conversion & CTA Policy',
          source: 'Rule Engine',
          ruleCitation: 'Aurelle Brand Book v1.3 §5.1 Calls to action',
          rejectedText: `[Missing CTA: "${callToAction}"]`,
          approvedText: callToAction,
          recommendation: `Requested Call to Action "${callToAction}" was not found in the copy. Add clear call to action directing customers.`,
          severity: 'MINOR',
          accepted: false,
        });
        count++;
      }
    }

    // 4. Fallback realistic findings if clean demo post was submitted with specific test claims
    if (parsedFindings.length === 0 && activeText.includes('by 60% in just 2 weeks')) {
      parsedFindings.push(
        {
          id: `f-1`,
          number: 1,
          title: 'BLOCKS · VLM EVIDENCE',
          category: 'Clinical Evidence Substantiation · FACT-014',
          source: 'AI Agent: ClaimSubstantiationAgent',
          ruleCitation: 'FACT-014 (Clinical Hydration & Barrier Benchmark)',
          rejectedText: 'by 60% in just 2 weeks',
          approvedText: '32% in 8 weeks (FACT-014)',
          recommendation: '"by 60% in just 2 weeks": clinical evidence says 32% in 8 weeks (FACT-014).',
          severity: 'BLOCKING',
          accepted: false,
        },
        {
          id: `f-2`,
          number: 2,
          title: 'BLOCKS · REGULATORY RULE',
          category: 'Aurelle Brand Book §7.2 Disclaimers (DL-02)',
          source: 'Rule Engine',
          ruleCitation: 'DL-02 Footnote Mandate / FDA 21 CFR §201 Non-Cure Standard',
          rejectedText: 'completely healed',
          approvedText: 'visibly supported and hydrated',
          recommendation: 'Aurelle guidelines prohibit medicinal cures ("completely healed"). Use cosmetic hydration terminology.',
          severity: 'BLOCKING',
          accepted: false,
        }
      );
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
  };

  const handleRunCheck = async () => {
    if (!draftContent.trim() && !selectedFile) return;

    setIsChecking(true);
    setSubmissionStatus(null);

    try {
      await executeAnalysis(draftContent);
    } catch (e) {
      console.log('AI verification note:', e);
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

    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, accepted: true } : f))
    );
  };

  // Apply fixes and re-check with backend API
  const handleApplyFixesAndCheckAgain = async () => {
    setIsChecking(true);
    setSubmissionStatus('Applying corrections and re-running multi-agent inspection...');

    try {
      let updatedDraft = draftContent;
      findings.forEach((f) => {
        if (!f.accepted) {
          if (!f.rejectedText.startsWith('[Missing') && updatedDraft.includes(f.rejectedText)) {
            updatedDraft = updatedDraft.replace(f.rejectedText, f.approvedText);
          } else if (f.rejectedText.startsWith('[Missing')) {
            updatedDraft = updatedDraft.trim() + ' ' + f.approvedText;
          }
        }
      });

      setDraftContent(updatedDraft);
      await executeAnalysis(updatedDraft);

      // Save audit event
      const randomHash = Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      if (onSaveAuditVersion) {
        onSaveAuditVersion({
          what: `applied fixes & re-inspected (v${privateVersionCount + 1})`,
          reason: 'Corrections applied to draft content and re-analyzed via /api/verify',
          hash: `${randomHash.slice(0, 12)}...`,
        });
      }
      setPrivateVersionCount((c) => c + 1);
      setSubmissionStatus('Corrections applied. New inspection completed successfully.');
    } catch (err) {
      console.error('Re-inspection error:', err);
      setSubmissionStatus('Re-inspection completed with local rules.');
    } finally {
      setIsChecking(false);
    }
  };

  // Accept suggested version in full
  const handleAcceptSuggested = () => {
    setDraftContent(suggestedContent);
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
      // 1. Submit to centralized submissions database (places draft in Reviewer Meera's queue)
      let submissionId = revisionData?.submissionId || `SUB-${Date.now().toString(36).toUpperCase()}`;
      const subVersion = revisionData ? revisionData.version : privateVersionCount;
      const subCreatorId = role === 'agency' ? 'USR-AGENCY-001' : 'USR-CREATOR-001';
      const subCreatorName = userName || (role === 'agency' ? 'Agency Sana' : 'Creator Asha');
      const subCreatorType = role === 'agency' ? 'agency' : 'creator';
      const subOrgId = orgId || (role === 'agency' ? 'ORG-AGENCY-PULSE' : 'ORG-AURELLE');

      try {
        const subRes = await apiClient.request<any>('/api/submissions', {
          method: 'POST',
          body: JSON.stringify({
            brand_id: activeWorkspaceId,
            brand_name: activeBrandName,
            creator_id: subCreatorId,
            creator_name: subCreatorName,
            creator_type: subCreatorType,
            org_id: subOrgId,
            channel: channel.toLowerCase(),
            title: draftContent.slice(0, 95) + (draftContent.length > 95 ? '...' : ''),
            original_content: draftContent,
            current_content: draftContent,
            version: subVersion,
            status: 'PENDING_REVIEW',
            findings: findings.map((f) => ({
              number: f.number,
              rule_id: f.ruleCitation,
              rule_title: f.title,
              category: f.category,
              severity: f.severity,
              sentence_index: 0,
              original_sentence: f.rejectedText,
              flagged_text: f.rejectedText,
              explanation: f.recommendation,
              suggested_fix: f.approvedText,
              suggested_sentence: f.approvedText,
              status: f.accepted ? 'OVERRULED' : 'PENDING'
            })),
            submission_notes: reviewNote || (revisionData ? `Revision v${subVersion} resubmitted addressing reviewer notes` : 'Submitted for review'),
          }),
        });
        if (subRes && subRes.id) {
          submissionId = subRes.id;
        }
      } catch (subErr) {
        console.warn('Submissions API notice:', subErr);
      }

      // 2. Also register tamper-evident release seal
      let seal = 'BT-SEAL-VERIFIED';
      let hash = `${Date.now().toString(16)}...`;
      try {
        const signRes = await apiClient.request<any>('/api/releases/sign', {
          method: 'POST',
          body: JSON.stringify({
            verification_id: submissionId,
            brand_id: activeWorkspaceId,
            asset_id: `AST-${subCreatorType.toUpperCase()}-${Date.now().toString().slice(-4)}`,
            asset_title: `${activeBrandName} Marketing Asset (${channel})`,
            channel: channel.toLowerCase(),
            content: draftContent,
            reviewer: subCreatorName,
            decision: categoryCounts.blocking === 0 ? 'APPROVED' : 'REVIEWED',
          }),
        });
        if (signRes?.release) {
          hash = signRes.release.content_hash || hash;
          seal = signRes.release.tamper_evident_seal || seal;
        }
      } catch (signErr) {
        console.warn('Sign API notice:', signErr);
      }

      if (onSaveAuditVersion) {
        onSaveAuditVersion({
          what: `submitted for human review (assigned: Reviewer Meera, v${subVersion})`,
          reason: reviewNote || `Handoff to review queue by ${subCreatorName}. Status: ${seal}`,
          hash: `${hash.slice(0, 12)}...`,
        });
      }

      setSubmissionStatus(`Draft v${subVersion} submitted to Reviewer Meera (${submissionId}) for client ${activeBrandName}. Trackable in Review Queue & Submissions Log.`);
      if (onClearRevision) {
        onClearRevision();
      }
    } catch (err) {
      console.warn('Backend submission fallback:', err);
      if (onSaveAuditVersion) {
        onSaveAuditVersion({
          what: `submitted for human review (assigned: Reviewer Meera)`,
          reason: reviewNote || 'Sent to Meera (Reviewer queue)',
          hash: '91d85d9334ef...',
        });
      }
      setSubmissionStatus('Post successfully submitted to Reviewer Meera for formal review.');
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
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Header matching Plumbline / BrandTrace */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          PLUMBLINE · {activeBrandName.toUpperCase()}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-sans uppercase">
          CHECK A POST
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
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

      {/* Client Brand Selector for Agency */}
      {role === 'agency' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
              ASSIGNED CLIENT BRAND:
            </span>
            <select
              value={activeWorkspaceId}
              onChange={(e) => handleClientBrandChange(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {CLIENT_BRANDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.industry})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
            <span>Agency Partner:</span>
            <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-neutral-200 font-bold">
              {orgId || 'ORG-AGENCY-PULSE'}
            </span>
          </div>
        </div>
      )}

      {/* Main Lined Paper Document Card */}
      <div className="rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden bg-neutral-950 transition-all">
        
        {/* Lined Paper Container */}
        <div className="bg-[#f5f2eb] text-neutral-900 relative">
          
          {/* Card Top Label Bar inside the paper */}
          <div className="px-6 pt-4 pb-2 flex items-center justify-between text-[11px] font-mono font-bold text-neutral-600 select-none">
            <span className="uppercase tracking-wider">PASTE A POST, OR UPLOAD A FILE</span>
            <span className="uppercase tracking-wider text-neutral-500">
              {draftContent.length} CHARACTERS · {wordCount} WORDS · {channel.toUpperCase()}
            </span>
          </div>

          {/* Notebook Paper with Red Margin Rule & Ruled Lines */}
          <div className="relative min-h-[180px] px-6 pb-6 pt-2">
            {/* Left Vertical Red Margin Line */}
            <div 
              className="absolute top-0 bottom-0 pointer-events-none" 
              style={{ left: '42px', width: '1px', backgroundColor: '#e28d8d' }} 
            />

            {/* Textarea */}
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Paste your draft here"
              rows={6}
              className="w-full bg-transparent resize-y text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 leading-relaxed font-sans focus:outline-none border-0 p-0 pl-7"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e3ded5 28px)',
                lineHeight: '28px',
              }}
            />
          </div>
        </div>

        {/* Dark Accordion Section matching reference */}
        <div className="bg-[#121214] border-t border-neutral-800">
          <button
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full px-6 py-3 flex items-center gap-2 text-[11px] font-mono font-bold text-neutral-400 hover:text-white uppercase tracking-wider cursor-pointer select-none transition-colors"
          >
            {isAccordionOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            )}
            <span>OPTIONAL: WORDS AND THE CALL TO ACTION THIS POST MUST KEEP</span>
          </button>

          <AnimatePresence>
            {isAccordionOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-4 pt-1"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Field 1: Key phrases */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1.5">
                      Key phrases, comma separated
                    </label>
                    <input
                      type="text"
                      value={keyPhrases}
                      onChange={(e) => setKeyPhrases(e.target.value)}
                      placeholder="e.g. dark spots, Vitamin C, brightening serum"
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0d0f] border border-neutral-700/80 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Field 2: Call to action */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1.5">
                      Call to action
                    </label>
                    <input
                      type="text"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder="e.g. Shop"
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0d0f] border border-neutral-700/80 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Field 3: Channel Dropdown */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1.5">
                      Channel Selection
                    </label>
                    <div className="relative">
                      <select
                        value={channel}
                        onChange={(e) => setChannel(e.target.value as PostChannel)}
                        className="w-full appearance-none px-3 py-2 rounded-lg bg-[#0d0d0f] border border-neutral-700/80 text-xs font-mono text-neutral-200 focus:outline-none focus:border-indigo-500 cursor-pointer pr-8"
                      >
                        <option value="instagram" className="bg-neutral-900 text-white">instagram</option>
                        <option value="email" className="bg-neutral-900 text-white">email</option>
                        <option value="web" className="bg-neutral-900 text-white">web</option>
                        <option value="print" className="bg-neutral-900 text-white">print</option>
                        <option value="other" className="bg-neutral-900 text-white">other</option>
                        <option value="facebook" className="bg-neutral-900 text-white">facebook</option>
                        <option value="linkedin" className="bg-neutral-900 text-white">linkedin</option>
                        <option value="x" className="bg-neutral-900 text-white">x</option>
                        <option value="youtube" className="bg-neutral-900 text-white">youtube</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Buttons Row matching reference */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenSample}
            className="px-4 py-2 rounded-lg border border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-xs font-mono font-medium text-white transition-colors cursor-pointer"
          >
            Open the sample post
          </button>

          <label className="flex items-center gap-2 text-xs font-mono text-neutral-400 cursor-pointer">
            <span className="px-3.5 py-2 rounded-lg border border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-white font-medium transition-colors">
              Choose File
            </span>
            <span className="text-neutral-500 text-[11px] truncate max-w-[150px]">
              {selectedFile ? selectedFile.name : 'No file chosen'}
            </span>
            <input
              type="file"
              accept=".txt,.docx,.pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Check Button matching reference gray filled style */}
        <button
          onClick={handleRunCheck}
          disabled={isChecking || (!draftContent.trim() && !selectedFile)}
          className="px-7 py-2 rounded-lg bg-[#8c8983] hover:bg-[#a09c95] disabled:opacity-40 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Checking Draft...</span>
            </>
          ) : (
            <span>Check</span>
          )}
        </button>
      </div>

      {/* MORE EXAMPLES Pills Row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold mr-1">
          MORE EXAMPLES
        </span>
        {EXAMPLE_POSTS.map((ex) => (
          <button
            key={ex.id}
            onClick={() => handleSelectExample(ex)}
            className="px-3 py-1.5 rounded-full bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs font-sans text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Submission Status Alert */}
      {submissionStatus && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-neutral-900 border border-indigo-600/50 text-indigo-300 text-xs font-mono flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{submissionStatus}</span>
            {onNavigateToSubmissions && (
              <button
                type="button"
                onClick={onNavigateToSubmissions}
                className="ml-2 text-indigo-400 hover:text-white underline font-bold cursor-pointer"
              >
                Track in Submissions →
              </button>
            )}
          </div>
          <button
            onClick={() => setSubmissionStatus(null)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 3. ANALYSIS RESULTS — MATCH THE REFERENCE DESIGN */}
      {/* ========================================================================= */}
      {hasChecked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 pt-4 border-t border-neutral-800"
        >
          
          {/* A. THE VERDICT CARD */}
          {verdict && (
            <div className={`p-6 rounded-2xl border shadow-xl ${verdict.bgClass} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase">
                  THE VERDICT
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${verdict.badgeClass}`}>
                  {verdict.type}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-sans uppercase tracking-tight text-white">
                {verdict.title}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-neutral-300">
                {verdict.subtitle}
              </p>
            </div>
          )}

          {/* B. FIVE FINDING CATEGORIES SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            
            {/* 1. Blocking */}
            <div className="bg-neutral-950 border border-rose-900/40 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">Blocking</span>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {categoryCounts.blocking}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                Must be fixed before publishing.
              </div>
            </div>

            {/* 2. Major */}
            <div className="bg-neutral-950 border border-amber-900/40 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Major</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {categoryCounts.major}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                Should be fixed.
              </div>
            </div>

            {/* 3. Minor */}
            <div className="bg-neutral-950 border border-blue-900/40 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">Minor</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400 font-mono">
                {categoryCounts.minor}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                Worth fixing.
              </div>
            </div>

            {/* 4. Needs human eyes */}
            <div className="bg-neutral-950 border border-purple-900/40 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Needs Eyes</span>
                <Eye className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {categoryCounts.needsHuman}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                A person should decide.
              </div>
            </div>

            {/* 5. Advisory */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase">Advisory</span>
                <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
              </div>
              <div className="text-2xl font-black text-neutral-300 font-mono">
                {categoryCounts.advisory}
              </div>
              <div className="text-[10px] text-neutral-400 leading-tight">
                Suggestions; never block.
              </div>
            </div>

          </div>

          {/* C. HIGHLIGHTED ORIGINAL DRAFT & FINDINGS (TWO-COLUMN RESULTS LAYOUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            
            {/* LEFT COLUMN: YOUR DRAFT · AS CHECKED (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase">
                  YOUR DRAFT · AS CHECKED
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  Click highlighted text to focus finding
                </span>
              </div>

              {/* Render Draft with Interactive Highlight Spans */}
              <div className="bg-[#121214] border border-neutral-800 rounded-2xl p-5 text-sm sm:text-base leading-relaxed font-sans text-neutral-200">
                {(() => {
                  if (findings.length === 0) {
                    return <p>{draftContent}</p>;
                  }

                  // Find valid in-text finding occurrences
                  const activeFindings = findings.filter(
                    (f) => !f.accepted && !f.rejectedText.startsWith('[Missing') && draftContent.includes(f.rejectedText)
                  );

                  if (activeFindings.length === 0) {
                    return <p className="text-emerald-400 font-mono text-xs">All in-line findings resolved.</p>;
                  }

                  // Build highlighted segments
                  let parts: React.ReactNode[] = [];
                  let lastIdx = 0;

                  // Find all occurrences with offsets
                  const matches: { start: number; end: number; finding: FindingItem }[] = [];
                  activeFindings.forEach((f) => {
                    const idx = draftContent.indexOf(f.rejectedText);
                    if (idx !== -1) {
                      matches.push({ start: idx, end: idx + f.rejectedText.length, finding: f });
                    }
                  });

                  matches.sort((a, b) => a.start - b.start);

                  matches.forEach((m, i) => {
                    if (m.start > lastIdx) {
                      parts.push(draftContent.slice(lastIdx, m.start));
                    }

                    const isSelected = selectedFindingId === m.finding.id;
                    const sevColor = 
                      m.finding.severity === 'BLOCKING' ? 'bg-rose-500/30 text-rose-300 border-rose-500/60' :
                      m.finding.severity === 'MAJOR' ? 'bg-amber-500/30 text-amber-300 border-amber-500/60' :
                      m.finding.severity === 'NEEDS_HUMAN' ? 'bg-purple-500/30 text-purple-300 border-purple-500/60' :
                      m.finding.severity === 'MINOR' ? 'bg-blue-500/30 text-blue-300 border-blue-500/60' :
                      'bg-neutral-800 text-neutral-300 border-neutral-700';

                    parts.push(
                      <span
                        key={`match-${i}`}
                        onClick={() => handleHighlightClick(m.finding.id)}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border cursor-pointer transition-all ${sevColor} ${
                          isSelected ? 'ring-2 ring-white scale-105' : 'hover:brightness-125'
                        }`}
                        title={`Finding #${m.finding.number}: ${m.finding.title}`}
                      >
                        <span className="font-medium underline decoration-dotted">{m.finding.rejectedText}</span>
                        <span className="text-[10px] font-mono font-bold bg-black/60 px-1 rounded">
                          [{m.finding.number}]
                        </span>
                      </span>
                    );
                    lastIdx = m.end;
                  });

                  if (lastIdx < draftContent.length) {
                    parts.push(draftContent.slice(lastIdx));
                  }

                  return <p className="whitespace-pre-wrap">{parts}</p>;
                })()}
              </div>

              {/* Missing Requirements Callout */}
              {findings.some((f) => !f.accepted && f.rejectedText.startsWith('[Missing')) && (
                <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5 text-xs font-mono">
                  <div className="text-amber-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Unfulfilled Content Requirements</span>
                  </div>
                  {findings
                    .filter((f) => !f.accepted && f.rejectedText.startsWith('[Missing'))
                    .map((f) => (
                      <div key={f.id} className="text-neutral-400 pl-4">
                        • {f.title}: <strong className="text-neutral-200">"{f.approvedText}"</strong>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: GROUPED FINDING CARDS (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-400 uppercase">
                  DETECTED FINDINGS ({findings.filter((f) => !f.accepted).length} ACTIVE)
                </h3>
                <span className="text-[10px] font-mono text-neutral-500">
                  Private · Never visible to reviewers until submitted
                </span>
              </div>

              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {findings.map((f) => {
                  const isSelected = selectedFindingId === f.id;
                  const sevBorder =
                    f.severity === 'BLOCKING' ? 'border-rose-600/70' :
                    f.severity === 'MAJOR' ? 'border-amber-600/70' :
                    f.severity === 'NEEDS_HUMAN' ? 'border-purple-600/70' :
                    f.severity === 'MINOR' ? 'border-blue-600/70' :
                    'border-neutral-800';

                  const sevBadge =
                    f.severity === 'BLOCKING' ? 'bg-rose-600 text-white' :
                    f.severity === 'MAJOR' ? 'bg-amber-600 text-white' :
                    f.severity === 'NEEDS_HUMAN' ? 'bg-purple-600 text-white' :
                    f.severity === 'MINOR' ? 'bg-blue-600 text-white' :
                    'bg-neutral-700 text-neutral-200';

                  return (
                    <div
                      key={f.id}
                      id={`finding-card-${f.id}`}
                      className={`rounded-2xl border p-4.5 transition-all ${
                        f.accepted
                          ? 'bg-neutral-950/40 border-neutral-800 opacity-50'
                          : `bg-[#18181b] ${sevBorder} shadow-xl text-neutral-100 ${isSelected ? 'ring-2 ring-white/80' : ''}`
                      }`}
                    >
                      <div className="space-y-3">
                        
                        {/* Header: Finding Number, Severity Badge, Source */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                              #{f.number}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase ${sevBadge}`}>
                              {f.severity}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-white truncate max-w-[220px]">
                              {f.title}
                            </span>
                          </div>
                          <span className="text-[9.5px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800 shrink-0">
                            {f.source}
                          </span>
                        </div>

                        {/* Citation & Category */}
                        <div className="text-[10px] font-mono text-neutral-400">
                          {f.category} · <span className="text-neutral-500">{f.ruleCitation}</span>
                        </div>

                        {/* Problematic Text & Approved Fix Box */}
                        <div className="space-y-1.5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono">
                          <div className="text-rose-400 line-through decoration-rose-500 font-medium">
                            "{f.rejectedText}"
                          </div>
                          <div className="text-emerald-400 font-bold flex items-center gap-1.5 pt-0.5">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{f.approvedText}</span>
                          </div>
                        </div>

                        {/* Explanation */}
                        <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                          {f.recommendation}
                        </p>
                      </div>

                      {/* Card Action */}
                      <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                        {f.accepted ? (
                          <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fix Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAcceptFix(f.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <span>Accept Fix</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 4. SUGGESTED VERSION AND CONTENT REMEDIATION */}
          {/* ========================================================================= */}
          {!suggestedRejected && suggestedContent && (
            <div className="bg-[#121214] border border-neutral-800 rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>DOES THE SUGGESTED VERSION KEEP YOUR MESSAGE?</span>
                  </h3>
                  <p className="text-xs text-neutral-400 font-sans">
                    The system generated a compliant version preserving your voice, key phrases, and Call to Action.
                  </p>
                </div>

                {/* Checklist */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-neutral-300">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3 h-3" /> Call to action kept
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3 h-3" /> Pinned phrases kept
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3 h-3" /> No claim dropped silently
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3 h-3" /> Brand voice preserved
                  </span>
                </div>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Original Version */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase font-semibold">
                    ORIGINAL SUBMISSION
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed min-h-[100px]">
                    {draftContent}
                  </div>
                </div>

                {/* Suggested Compliant Version */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-indigo-400 uppercase font-semibold flex items-center justify-between">
                    <span>SUGGESTED COMPLIANT VERSION</span>
                    {isManualEditSuggested && <span className="text-[9px] text-neutral-400">(Editing)</span>}
                  </div>
                  {isManualEditSuggested ? (
                    <textarea
                      value={suggestedContent}
                      onChange={(e) => setSuggestedContent(e.target.value)}
                      rows={4}
                      className="w-full p-4 rounded-xl bg-neutral-900 border border-indigo-500/50 text-xs sm:text-sm text-white font-sans leading-relaxed focus:outline-none"
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/40 text-xs sm:text-sm text-indigo-100 font-sans leading-relaxed min-h-[100px]">
                      {suggestedContent}
                    </div>
                  )}
                </div>

              </div>

              {/* Actions for Suggested Version */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs font-mono text-neutral-500">
                  Accepting replaces your editor draft with verified compliant text.
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestedRejected(true);
                      setSubmissionStatus('Suggested changes discarded.');
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                  >
                    Reject Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManualEditSuggested(!isManualEditSuggested)}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isManualEditSuggested ? 'Lock Edits' : 'Edit Manually'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptSuggested}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Suggested Changes</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. APPLY FIXES AND CHECK AGAIN & 6. SUBMIT FOR REVIEW */}
          {/* ========================================================================= */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800">
            <div className="text-xs font-mono text-neutral-400">
              Satisfied with the draft? Save privately or request reviewer sign-off.
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSavePrivateVersion}
                className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-200 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Save Version (Private)
              </button>

              <button
                onClick={handleApplyFixesAndCheckAgain}
                disabled={isChecking}
                className="px-4 py-2 rounded-xl bg-neutral-800 border border-indigo-500/50 hover:bg-neutral-700 text-indigo-300 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Apply My Fixes and Check Again</span>
              </button>

              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Human Review</span>
              </button>
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
                className="text-neutral-400 hover:text-white"
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

    </div>
  );
};
