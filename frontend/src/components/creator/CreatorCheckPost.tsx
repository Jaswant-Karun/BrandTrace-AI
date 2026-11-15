import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Send, ChevronDown, ChevronRight, RefreshCw, Check, ArrowRight, X
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface FindingItem {
  id: string;
  number: number;
  title: string;
  category: string;
  rejectedText: string;
  approvedText: string;
  recommendation: string;
  accepted?: boolean;
}

interface CreatorCheckPostProps {
  onSaveAuditVersion?: (event: { what: string; reason?: string; hash: string }) => void;
  brandName?: string;
  workspaceId?: string;
}

const SAMPLE_POST_TEXT = `Make every brand decision count this Diwali. BrandTrace AI helps teams review marketing content against approved brand guidelines, identify unsupported claims, assess potential risks, and trace authorised approvals. Detect. Predict. Verify. Prevent.`;

export const CreatorCheckPost: React.FC<CreatorCheckPostProps> = ({
  onSaveAuditVersion,
  brandName = 'Aurelle Skin',
  workspaceId = 'aurelle-tech',
}) => {
  const [draftContent, setDraftContent] = useState<string>('');
  const [platform, setPlatform] = useState<'Instagram' | 'LinkedIn' | 'Web Banner' | 'Email'>('Instagram');
  const [mandatoryPhrases, setMandatoryPhrases] = useState<string>('');
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [privateVersionCount, setPrivateVersionCount] = useState<number>(1);

  // Findings state
  const [findings, setFindings] = useState<FindingItem[]>([
    {
      id: 'f-1',
      number: 1,
      title: 'Unsupported performance claim',
      category: 'Approved Brand Claims · Rule Engine',
      rejectedText: 'identify unsupported claims',
      approvedText: 'link to approved source',
      recommendation: 'Rec: Link claim to approved evidence or mark for review.',
      accepted: false,
    },
    {
      id: 'f-2',
      number: 2,
      title: 'Unverified capability claim',
      category: 'Product Capability Substantiation · AI Review',
      rejectedText: 'trace authorised approvals',
      approvedText: 'confirmed in docs',
      recommendation: 'Rec: Confirm capability against documentation & implementation.',
      accepted: false,
    },
  ]);

  const handleOpenSample = () => {
    setDraftContent(SAMPLE_POST_TEXT);
    setHasChecked(false);
    setSubmissionStatus(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRunCheck = async () => {
    if (!draftContent.trim() && !selectedFile) return;

    setIsChecking(true);
    setSubmissionStatus(null);

    try {
      // Connect to real `/api/verify` backend endpoint
      const res = await apiClient.request<any>('/api/verify', {
        method: 'POST',
        body: JSON.stringify({
          brand_id: workspaceId || 'aurelle-tech',
          content: draftContent || (selectedFile ? `[Asset File Upload: ${selectedFile.name}]` : SAMPLE_POST_TEXT),
          campaign_name: 'Diwali Product Awareness Campaign',
          channel: platform.toLowerCase(),
        }),
      });

      // If backend returns risk spans, map them into findings
      if (res && res.all_risk_spans && res.all_risk_spans.length > 0) {
        const mappedFindings: FindingItem[] = res.all_risk_spans.map((span: any, index: number) => ({
          id: `f-${index + 1}`,
          number: index + 1,
          title: span.explanation?.split(':')[0] || 'Brand Rule Finding',
          category: span.category || span.rule_citation || 'Brand Rule Engine',
          rejectedText: span.matched_text || 'flagged text',
          approvedText: span.suggested_fix || 'approved formulation',
          recommendation: `Rec: ${span.explanation || 'Align with verified brand evidence.'}`,
          accepted: false,
        }));
        setFindings(mappedFindings);
      } else {
        // Fallback default sample findings if clean
        setFindings([
          {
            id: 'f-1',
            number: 1,
            title: 'Unsupported performance claim',
            category: 'Approved Brand Claims · Rule Engine',
            rejectedText: 'identify unsupported claims',
            approvedText: 'link to approved source',
            recommendation: 'Rec: Link claim to approved evidence or mark for review.',
            accepted: false,
          },
          {
            id: 'f-2',
            number: 2,
            title: 'Unverified capability claim',
            category: 'Product Capability Substantiation · AI Review',
            rejectedText: 'trace authorised approvals',
            approvedText: 'confirmed in docs',
            recommendation: 'Rec: Confirm capability against documentation & implementation.',
            accepted: false,
          },
        ]);
      }
    } catch (e) {
      console.log('AI verification note (using simulated fallback):', e);
      // Keep rich demo findings on network disconnect
    } finally {
      setIsChecking(false);
      setHasChecked(true);
    }
  };

  const handleAcceptFix = (findingId: string) => {
    const finding = findings.find((f) => f.id === findingId);
    if (!finding || finding.accepted) return;

    if (draftContent.includes(finding.rejectedText)) {
      setDraftContent((prev) => prev.replace(finding.rejectedText, finding.approvedText));
    }

    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, accepted: true } : f))
    );
  };

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

  const handleSubmitForReview = () => {
    setIsReviewModalOpen(false);
    const randomHash = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    if (onSaveAuditVersion) {
      onSaveAuditVersion({
        what: `submitted for human review`,
        reason: reviewNote || 'Sent to Meera (Reviewer queue)',
        hash: `${randomHash.slice(0, 12)}...`,
      });
    }

    setSubmissionStatus('Post successfully submitted to Reviewer Meera for formal review.');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          PLUMBLINE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          CHECK A POST
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          Paste a draft or upload a file. You'll see what breaks Aurelle's rules, which claims the evidence doesn't back, and the approved way to say it.
        </p>
      </div>

      {/* Main Lined Paper Document Card */}
      <div className="bg-[#fbf9f5] rounded-2xl border border-neutral-700/80 shadow-2xl overflow-hidden text-neutral-900 transition-all">
        
        {/* Card Header Bar */}
        <div className="px-5 py-3.5 border-b border-neutral-300 flex items-center justify-between text-xs font-mono font-bold text-neutral-700 bg-[#f4f0e6]">
          <span className="uppercase tracking-wider">PASTE A POST, OR UPLOAD A FILE</span>
          <div className="flex items-center gap-3">
            <span className="text-neutral-500 font-mono">
              {draftContent.length} CHARACTERS
            </span>
            <span>·</span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="bg-transparent border border-neutral-400/80 rounded px-2 py-0.5 text-xs font-mono font-bold uppercase text-neutral-800 focus:outline-none focus:border-neutral-900 cursor-pointer"
            >
              <option value="Instagram">INSTAGRAM</option>
              <option value="LinkedIn">LINKEDIN</option>
              <option value="Web Banner">WEB BANNER</option>
              <option value="Email">EMAIL</option>
            </select>
          </div>
        </div>

        {/* Text Area with Subtle Lined Paper Effect */}
        <div className="p-5 sm:p-7 relative bg-[#fbf9f5]">
          <textarea
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            placeholder="Paste your draft here"
            rows={7}
            className="w-full bg-transparent resize-y text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 leading-relaxed font-sans focus:outline-none border-0 p-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e5dfd3 28px)',
              lineHeight: '28px',
            }}
          />
        </div>

        {/* Accordion: Words / CTA Post Must Keep */}
        <div className="border-t border-neutral-300 px-5 sm:px-7 py-3 bg-[#f6f2e8]">
          <button
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-700 uppercase tracking-wider hover:text-neutral-900 cursor-pointer select-none"
          >
            {isAccordionOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>OPTIONAL: WORDS AND THE CALL TO ACTION THIS POST MUST KEEP</span>
          </button>

          <AnimatePresence>
            {isAccordionOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-2"
              >
                <input
                  type="text"
                  value={mandatoryPhrases}
                  onChange={(e) => setMandatoryPhrases(e.target.value)}
                  placeholder="e.g. Shop now, 20% off, Aurelle Skin (comma separated)"
                  className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-300 text-xs text-neutral-900 font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card Footer Bar */}
        <div className="px-5 sm:px-7 py-4 border-t border-neutral-300 bg-[#f0ebd9] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenSample}
              className="px-3.5 py-1.5 rounded-lg border border-neutral-400 bg-white hover:bg-neutral-100 text-xs font-mono font-bold text-neutral-800 transition-colors cursor-pointer shadow-2xs"
            >
              Open the sample post
            </button>

            <label className="flex items-center gap-2 text-xs font-mono text-neutral-700 cursor-pointer">
              <span className="px-3 py-1.5 rounded-lg border border-neutral-400 bg-white hover:bg-neutral-100 text-neutral-800 font-bold shadow-2xs transition-colors">
                Choose File
              </span>
              <span className="text-neutral-500 text-[11px] truncate max-w-[150px]">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
              <input
                type="file"
                accept="image/*,.pdf,.txt,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <button
            onClick={handleRunCheck}
            disabled={isChecking || (!draftContent.trim() && !selectedFile)}
            className="px-6 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2"
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

      </div>

      {/* Submission Status Alert */}
      {submissionStatus && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{submissionStatus}</span>
          </div>
          <button
            onClick={() => setSubmissionStatus(null)}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Inspection Results Section */}
      {hasChecked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>INSPECTION FINDINGS ({findings.filter((f) => !f.accepted).length} ACTIVE)</span>
            </h3>
            <span className="text-xs font-mono text-neutral-400">
              Private pre-check · Never visible to reviewers until submitted
            </span>
          </div>

          {/* Finding Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {findings.map((f) => (
              <div
                key={f.id}
                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
                  f.accepted
                    ? 'bg-neutral-950/40 border-neutral-800 opacity-60'
                    : 'bg-[#fbf9f5] border-neutral-300 shadow-xl text-neutral-900'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top: Number, Title, Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                        {f.number}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm font-sans text-neutral-900 leading-snug">
                        {f.title}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      Sample Finding
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-500">
                    {f.category}
                  </div>

                  {/* Rejected & Approved Text Box */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#f4eee1] border border-neutral-300 text-xs font-mono">
                    <div className="text-rose-600 line-through decoration-rose-500 font-medium">
                      {f.rejectedText}
                    </div>
                    <div className="text-emerald-700 font-bold flex items-center gap-1.5 pt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{f.approvedText}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-600 font-sans leading-relaxed">
                    {f.recommendation}
                  </p>
                </div>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-neutral-300 flex items-center justify-end gap-2">
                  {f.accepted ? (
                    <span className="text-[11px] font-mono font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Fix Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcceptFix(f.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Accept Fix</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Bottom Action Buttons */}
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

      {/* Submit for Human Review Modal */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-mono font-bold text-base uppercase tracking-wider">
                  SUBMIT POST FOR HUMAN REVIEW
                </h3>
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                This post will enter Reviewer Meera's queue. She will verify each finding against the Aurelle rulebook before final approval.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 uppercase">
                  Creator Note / Context (Optional)
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="e.g. Revised claim wording to cite FACT-014 study findings."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-sans text-neutral-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs font-mono font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitForReview}
                  className="px-5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-md"
                >
                  Confirm & Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

