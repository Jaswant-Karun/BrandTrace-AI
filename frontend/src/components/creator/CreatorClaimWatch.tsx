import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Eye, CheckCircle2, ChevronRight, ChevronDown, RefreshCw, Plus, ExternalLink } from 'lucide-react';

interface LivePageItem {
  id: string;
  approvedPostTitle: string;
  url: string;
  registeredDate: string;
  status: '100% MATCH' | 'DRIFT DETECTED';
  lastChecked: string;
}

interface CreatorClaimWatchProps {
  brandName?: string;
}

export const CreatorClaimWatch: React.FC<CreatorClaimWatchProps> = ({
  brandName = 'Aurelle Skin',
}) => {
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [liveUrl, setLiveUrl] = useState<string>('https://shop.example.com/serum');
  const [isClosedTasksOpen, setIsClosedTasksOpen] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [livePages, setLivePages] = useState<LivePageItem[]>([
    {
      id: 'lp-1',
      approvedPostTitle: 'Aurelle Vitamin C Launch Post (Approved 12 Nov)',
      url: 'https://shop.example.com/serum',
      registeredDate: '12 Nov 2026',
      status: '100% MATCH',
      lastChecked: '5 mins ago',
    },
  ]);

  const handleRegisterAndRead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveUrl.trim()) return;

    setIsRegistering(true);
    setFeedbackMsg(null);

    // Simulate scanning and sentence-by-sentence comparison
    setTimeout(() => {
      const newPage: LivePageItem = {
        id: `lp-${Date.now()}`,
        approvedPostTitle: selectedPost || 'Aurelle Diwali Campaign Draft (Approved)',
        url: liveUrl,
        registeredDate: 'Today',
        status: '100% MATCH',
        lastChecked: 'Just now',
      };
      setLivePages((prev) => [newPage, ...prev]);
      setIsRegistering(false);
      setFeedbackMsg(`Successfully registered ${liveUrl}. Page content verified against approved claims with zero drift.`);
    }, 900);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          PLUMBLINE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          CLAIM WATCH
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          Facts change after a post goes live. This shows the live posts whose facts moved, and the live pages that no longer match what was approved.
        </p>
      </div>

      {/* Section 1: UPDATE OR WITHDRAW */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
          <Eye className="w-4 h-4 text-indigo-400" />
          <span>UPDATE OR WITHDRAW</span>
        </div>

        <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
          Nothing needs updating. Every live post's facts are as they were when it was approved. Posts checked before the watch existed have no fact record: check them again to include them.
        </p>

        {/* Closed Tasks Accordion */}
        <div className="pt-2">
          <button
            onClick={() => setIsClosedTasksOpen(!isClosedTasksOpen)}
            className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-300 cursor-pointer select-none"
          >
            {isClosedTasksOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>CLOSED TASKS</span>
          </button>

          <AnimatePresence>
            {isClosedTasksOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 text-xs font-mono text-neutral-400 space-y-1.5"
              >
                <div>Task #102: Verified FACT-014 study revision across shop.example.com (Resolved 10 Nov)</div>
                <div>Task #098: Updated Diwali early bird embargo date (Resolved 5 Nov)</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Section 2: LIVE PAGES */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-white uppercase tracking-wider">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>LIVE PAGES</span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans leading-relaxed">
            Tell Plumbline where an approved post is live. It reads the page and compares it with the approved text, sentence by sentence; extra text on the page is ignored, but a missing or reworded sentence (or a changed number) raises a task.
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegisterAndRead} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            
            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                APPROVED POST
              </label>
              <select
                value={selectedPost}
                onChange={(e) => setSelectedPost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-sans text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Choose...</option>
                <option value="Aurelle Vitamin C Launch Post (Approved 12 Nov)">
                  Aurelle Vitamin C Launch Post (Approved 12 Nov)
                </option>
                <option value="Diwali Festive Teaser (Approved 8 Nov)">
                  Diwali Festive Teaser (Approved 8 Nov)
                </option>
              </select>
            </div>

            <div className="md:col-span-5 space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                LIVE ADDRESS
              </label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://shop.example.com/serum"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-sans text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isRegistering || !liveUrl.trim()}
                className="w-full py-2 px-3 rounded-xl bg-neutral-200 hover:bg-white text-neutral-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reading...</span>
                  </>
                ) : (
                  <span>Register and read</span>
                )}
              </button>
            </div>

          </div>
        </form>

        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 text-xs font-mono flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </motion.div>
        )}

        {/* Monitored Live Pages Table */}
        <div className="pt-3 border-t border-neutral-900">
          <div className="text-[11px] font-mono font-bold uppercase text-neutral-400 mb-2">
            MONITORED LIVE POSTS ({livePages.length})
          </div>

          <div className="divide-y divide-neutral-900 bg-neutral-900/40 rounded-xl border border-neutral-800/80 overflow-hidden text-xs font-mono">
            {livePages.map((page) => (
              <div key={page.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-lg">
                  <div className="font-bold text-white text-xs">{page.approvedPostTitle}</div>
                  <a
                    href={page.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono truncate"
                  >
                    <span>{page.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-neutral-400">
                    Checked {page.lastChecked}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{page.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

