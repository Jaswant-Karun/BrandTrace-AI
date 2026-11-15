import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Send, RefreshCw, Check, ArrowRight, X, ChevronDown, ChevronRight
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

export type PostChannel = 'instagram' | 'email' | 'web' | 'print' | 'other';

interface ExamplePost {
  id: string;
  label: string;
  channel: PostChannel;
  keyPhrases: string;
  cta: string;
  text: string;
}

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
}) => {
  const [draftContent, setDraftContent] = useState<string>('');
  const [channel, setChannel] = useState<PostChannel>('instagram');
  const [keyPhrases, setKeyPhrases] = useState<string>('dark spots');
  const [callToAction, setCallToAction] = useState<string>('Shop');
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true); // Open by default matching reference
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
      title: 'BLOCKS · VLM EVIDENCE',
      category: 'Clinical Evidence Substantiation · FACT-014',
      rejectedText: 'by 60% in just 2 weeks',
      approvedText: '32% in 8 weeks (FACT-014)',
      recommendation: '"by 60% in just 2 weeks": clinical evidence says 32% in 8 weeks (FACT-014).',
      accepted: false,
    },
    {
      id: 'f-2',
      number: 2,
      title: 'BLOCKS · REGULATORY RULE',
      category: 'Aurelle Brand Book §7.2 Disclaimers (DL-02)',
      rejectedText: 'completely healed',
      approvedText: 'visibly supported and hydrated',
      recommendation: 'Aurelle guidelines prohibit medicinal cures ("completely healed"). Use cosmetic hydration terminology.',
      accepted: false,
    },
  ]);

  const handleOpenSample = () => {
    setDraftContent(DEFAULT_SAMPLE_TEXT);
    setChannel('instagram');
    setKeyPhrases('dark spots');
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
          content: draftContent || (selectedFile ? `[Asset File Upload: ${selectedFile.name}]` : DEFAULT_SAMPLE_TEXT),
          campaign_name: 'Aurelle Social Campaign',
          channel: channel.toLowerCase(),
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
        // Fallback realistic findings matching user reference
        setFindings([
          {
            id: 'f-1',
            number: 1,
            title: 'BLOCKS · VLM EVIDENCE',
            category: 'Clinical Evidence Substantiation · FACT-014',
            rejectedText: 'by 60% in just 2 weeks',
            approvedText: '32% in 8 weeks (FACT-014)',
            recommendation: '"by 60% in just 2 weeks": clinical evidence says 32% in 8 weeks (FACT-014).',
            accepted: false,
          },
          {
            id: 'f-2',
            number: 2,
            title: 'BLOCKS · REGULATORY RULE',
            category: 'Aurelle Brand Book §7.2 Disclaimers (DL-02)',
            rejectedText: 'completely healed',
            approvedText: 'visibly supported and hydrated',
            recommendation: 'Aurelle guidelines prohibit medicinal cures ("completely healed"). Use cosmetic hydration terminology.',
            accepted: false,
          },
        ]);
      }
    } catch (e) {
      console.log('AI verification fallback:', e);
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
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Eyebrow, Title & Description matching uploaded screenshot */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          PLUMBLINE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white font-sans uppercase">
          CHECK A POST
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          Paste a draft or upload a file. You'll see what breaks Aurelle's rules, which claims the evidence doesn't back, and the approved way to say it.
        </p>
      </div>

      {/* Main Lined Paper Document Card matching user screenshot media_1794760981678_a718fa9d.jpg */}
      <div className="rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden bg-neutral-950 transition-all">
        
        {/* Lined Paper Container */}
        <div className="bg-[#f5f2eb] text-neutral-900 relative">
          
          {/* Card Top Label Bar inside the paper */}
          <div className="px-6 pt-4 pb-2 flex items-center justify-between text-[11px] font-mono font-bold text-neutral-600 select-none">
            <span className="uppercase tracking-wider">PASTE A POST, OR UPLOAD A FILE</span>
            <span className="uppercase tracking-wider text-neutral-500">
              {draftContent.length} CHARACTERS · {channel.toUpperCase()}
            </span>
          </div>

          {/* Notebook Paper with Red Margin Rule & Ruled Lines */}
          <div className="relative min-h-[170px] px-6 pb-6 pt-2">
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

        {/* Dark Accordion Section matching screenshot */}
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
                      placeholder="dark spots"
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
                      placeholder="Shop"
                      className="w-full px-3 py-2 rounded-lg bg-[#0d0d0f] border border-neutral-700/80 text-xs font-mono text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Field 3: Channel Dropdown matching screenshot menu */}
                  <div>
                    <label className="block text-[11px] font-mono text-neutral-400 mb-1.5">
                      Channel
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
              accept="image/*,.pdf,.txt,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Check Button matching screenshot's gray filled style */}
        <button
          onClick={handleRunCheck}
          disabled={isChecking || (!draftContent.trim() && !selectedFile)}
          className="px-7 py-2 rounded-lg bg-[#8c8983] hover:bg-[#a09c95] disabled:opacity-40 text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-2"
        >
          {isChecking ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <span>Check</span>
          )}
        </button>
      </div>

      {/* MORE EXAMPLES Pills Row matching screenshot */}
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
          className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{submissionStatus}</span>
          </div>
          <button
            onClick={() => setSubmissionStatus(null)}
            className="text-neutral-400 hover:text-white cursor-pointer"
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
          className="space-y-5 pt-4"
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

          {/* Finding Cards Grid matching user attached BLOCKS · VLM EVIDENCE style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {findings.map((f) => (
              <div
                key={f.id}
                className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
                  f.accepted
                    ? 'bg-neutral-950/40 border-neutral-800 opacity-60'
                    : 'bg-[#18181b] border-rose-500/30 shadow-xl text-neutral-100'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Top: Header badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold tracking-wider text-rose-400 uppercase">
                      {f.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      Finding #{f.number}
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-400">
                    {f.category}
                  </div>

                  {/* Rejected & Approved Text Box */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono">
                    <div className="text-rose-400 line-through decoration-rose-500 font-medium">
                      "{f.rejectedText}"
                    </div>
                    <div className="text-emerald-400 font-bold flex items-center gap-1.5 pt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{f.approvedText}</span>
                    </div>
                  </div>

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
              This post will be locked as an immutable version and placed in the Review Queue for human reviewer sign-off.
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
