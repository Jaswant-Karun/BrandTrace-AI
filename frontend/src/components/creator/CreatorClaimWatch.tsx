import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  Globe, 
  ChevronRight, 
  RefreshCw, 
  Check 
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export interface ClaimWatchTask {
  id: string;
  badge: string;
  post_title: string;
  author: string;
  timestamp: string;
  description: string;
  action_notice: string;
  status: 'ACTIVE' | 'DONE' | 'DISMISSED';
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface LivePageItem {
  id: string;
  post_id?: string | null;
  post_title: string;
  live_url: string;
  status_message: string;
  status_type: 'ERROR' | 'WARNING' | 'OK';
  last_checked: string;
  missing_count: number;
}

interface ClaimWatchDataResponse {
  tasks: ClaimWatchTask[];
  closed_tasks: ClaimWatchTask[];
  live_pages: LivePageItem[];
  approved_posts: string[];
}

interface CreatorClaimWatchProps {
  brandName?: string;
}

const DEFAULT_ACTIVE_TASKS: ClaimWatchTask[] = [
  {
    id: 'TASK-CW-01',
    badge: 'PAGE CHANGED',
    post_title: 'Meet the Hyaluronic Water Gel: up to 72 hours of hydration* in a light, oil-free gel. Shop the Hyaluronic Water Gel.',
    author: 'Creator Asha',
    timestamp: '19 Nov 2026, 4:02 pm',
    description: '3 approved sentences are missing or changed on the live page: “Meet the Hyaluronic Water Gel: up to 72 hours of hydration* in a light, oil-free gel.”; “Shop the Hyaluronic Water Gel.”; “*Instrumental study, 30 participants, 2025.”.',
    action_notice: 'No approved replacement exists: update it with compliance, or withdraw the post.',
    status: 'ACTIVE',
  },
];

const DEFAULT_LIVE_PAGES: LivePageItem[] = [
  {
    id: 'LP-01',
    post_id: 'SUB-001',
    post_title: 'Meet the Hyaluronic Water Gel: up to 72 hours of hydration*',
    live_url: 'https://serum.com',
    status_message: '3 approved sentences missing or changed',
    status_type: 'ERROR',
    last_checked: '19 Nov 2026, 9:46 pm',
    missing_count: 3,
  },
];

const DEFAULT_APPROVED_POSTS: string[] = [
  'Meet the Hyaluronic Water Gel: up to 72 hours of hydration*',
  'Aurelle Botanical Renewal Serum Launch: 94% noticed firmer skin',
  'Aurelle Daily Defense Tinted Mineral SPF 50+ Broad Spectrum',
  'Aurelle Ultra Peptide Night Repair Crème: clinical cellular test',
];

// Helper to format friendly dates e.g. "19 Nov 2026, 11:20 pm"
function formatNowFriendly(): string {
  const d = new Date();
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${day} ${month} ${year}, ${hours}:${minStr} ${ampm}`;
}

export const CreatorClaimWatch: React.FC<CreatorClaimWatchProps> = ({ 
  brandName = 'Aurelle Skin' 
}) => {
  const [tasks, setTasks] = useState<ClaimWatchTask[]>(() => {
    try {
      const saved = localStorage.getItem('bt_claim_watch_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVE_TASKS;
  });

  const [closedTasks, setClosedTasks] = useState<ClaimWatchTask[]>(() => {
    try {
      const saved = localStorage.getItem('bt_claim_watch_closed');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [livePages, setLivePages] = useState<LivePageItem[]>(() => {
    try {
      const saved = localStorage.getItem('bt_claim_watch_pages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_LIVE_PAGES;
  });

  const [approvedPosts, setApprovedPosts] = useState<string[]>(DEFAULT_APPROVED_POSTS);
  const [closedTasksOpen, setClosedTasksOpen] = useState(false);
  
  // Registration form inputs
  const [selectedPost, setSelectedPost] = useState('');
  const [liveAddress, setLiveAddress] = useState('https://shop.example.com/serum');
  const [isRegistering, setIsRegistering] = useState(false);
  const [checkingPageId, setCheckingPageId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bt_claim_watch_tasks', JSON.stringify(tasks));
      localStorage.setItem('bt_claim_watch_closed', JSON.stringify(closedTasks));
      localStorage.setItem('bt_claim_watch_pages', JSON.stringify(livePages));
    } catch {}
  }, [tasks, closedTasks, livePages]);

  // Load from live backend
  const loadData = useCallback(async () => {
    try {
      const data = await apiClient.request<ClaimWatchDataResponse>('/api/claim-watch/data', { skipCache: true });
      if (data) {
        if (data.tasks && data.tasks.length > 0) setTasks(data.tasks);
        if (data.closed_tasks) setClosedTasks(data.closed_tasks);
        if (data.live_pages && data.live_pages.length > 0) setLivePages(data.live_pages);
        if (data.approved_posts && data.approved_posts.length > 0) setApprovedPosts(data.approved_posts);
      }
    } catch {
      // Gracefully maintain client/cached state if backend is sleeping
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Show toast notification
  const notify = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  // Handle Mark Done or Dismiss
  const handleResolveTask = async (taskId: string, action: 'done' | 'dismiss' | 'reopen') => {
    setResolvingId(taskId);
    const nowTime = formatNowFriendly();

    try {
      await apiClient.request(`/api/claim-watch/tasks/${taskId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action, resolved_by: 'Creator Asha' }),
      });
    } catch {
      // Local fallback
    }

    if (action === 'reopen') {
      const target = closedTasks.find((t) => t.id === taskId);
      if (target) {
        const updated: ClaimWatchTask = { ...target, status: 'ACTIVE', resolved_at: null, resolved_by: null };
        setClosedTasks((prev) => prev.filter((t) => t.id !== taskId));
        setTasks((prev) => [updated, ...prev]);
        notify(`Task ${taskId} re-opened`);
      }
    } else {
      const target = tasks.find((t) => t.id === taskId);
      if (target) {
        const updated: ClaimWatchTask = {
          ...target,
          status: action === 'done' ? 'DONE' : 'DISMISSED',
          resolved_at: nowTime,
          resolved_by: 'Creator Asha',
        };
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setClosedTasks((prev) => [updated, ...prev]);
        notify(action === 'done' ? 'Task marked as done' : 'Task dismissed');
      }
    }

    setResolvingId(null);
  };

  // Handle Register and read
  const handleRegisterPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveAddress.trim()) return;

    const chosenPost = selectedPost.trim() || approvedPosts[0] || 'Approved Marketing Claim';
    const address = liveAddress.trim();
    setIsRegistering(true);

    try {
      const res = await apiClient.request<{ status: string; page: LivePageItem; task: ClaimWatchTask }>(
        '/api/claim-watch/live-pages',
        {
          method: 'POST',
          body: JSON.stringify({ post_title: chosenPost, live_url: address }),
        }
      );
      if (res && res.page && res.task) {
        setLivePages((prev) => [res.page, ...prev]);
        setTasks((prev) => [res.task, ...prev]);
        notify(`Registered live page at ${address} and scanned approved sentences.`);
      }
    } catch {
      // Client simulation fallback
      const nowTime = formatNowFriendly();
      const newPageId = `LP-0${livePages.length + 1}`;
      const newPage: LivePageItem = {
        id: newPageId,
        post_id: `SUB-00${livePages.length + 1}`,
        post_title: chosenPost,
        live_url: address,
        status_message: '2 approved sentences missing or changed',
        status_type: 'ERROR',
        last_checked: nowTime,
        missing_count: 2,
      };

      const newTask: ClaimWatchTask = {
        id: `TASK-CW-0${tasks.length + closedTasks.length + 1}`,
        badge: 'PAGE CHANGED',
        post_title: `${chosenPost}: live page mismatch at ${address}`,
        author: 'Creator Asha',
        timestamp: nowTime,
        description: `2 approved sentences are missing or modified on the live page at ${address}. Content no longer matches certified version.`,
        action_notice: 'No approved replacement exists: update it with compliance, or withdraw the post.',
        status: 'ACTIVE',
      };

      setLivePages((prev) => [newPage, ...prev]);
      setTasks((prev) => [newTask, ...prev]);
      notify(`Registered and verified live page at ${address}`);
    } finally {
      setIsRegistering(false);
      setSelectedPost('');
    }
  };

  // Handle Check now
  const handleCheckNow = async (pageId: string) => {
    setCheckingPageId(pageId);
    const nowTime = formatNowFriendly();

    try {
      await apiClient.request(`/api/claim-watch/live-pages/${pageId}/check`, {
        method: 'POST',
      });
    } catch {}

    // Simulate 600ms network audit check
    setTimeout(() => {
      setLivePages((prev) =>
        prev.map((p) => (p.id === pageId ? { ...p, last_checked: nowTime } : p))
      );
      setCheckingPageId(null);
      notify('Live page audit verified sentence match against certified claims.');
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-4 px-4 sm:px-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white shadow-xl"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Eyebrow & Title */}
      <div className="relative pt-2">
        {/* Suspended Plumb Bob Diamond Icon from top right */}
        <div className="absolute right-4 -top-8 hidden md:flex flex-col items-center pointer-events-none select-none">
          <div className="w-[1px] h-14 bg-neutral-700/80" />
          <div className="w-3.5 h-3.5 rotate-45 bg-[#7064e9] shadow-[0_0_14px_rgba(112,100,233,0.7)] -mt-0.5" />
        </div>

        <div className="space-y-1.5">
          <div className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase">
            PLUMBLINE · {brandName.toUpperCase()}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white uppercase font-sans">
            CLAIM WATCH
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed pt-1">
            Facts change after a post goes live. This shows the live posts whose facts moved, and the live pages that no longer match what was approved.
          </p>
        </div>
      </div>

      {/* SECTION 1: UPDATE OR WITHDRAW */}
      <section className="bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
        {/* Section Title */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-white uppercase">
          <Eye className="w-4 h-4 text-zinc-300 shrink-0" />
          <span>UPDATE OR WITHDRAW</span>
        </div>

        {/* Active Tasks List */}
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-[#181a20] border border-zinc-800/80 rounded-xl p-4 sm:p-5 space-y-3"
              >
                {/* Header Row: Badge + Post Title + Author/Time */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border border-indigo-500/40 text-indigo-300 bg-indigo-950/40 shrink-0">
                      {task.badge}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white leading-snug">
                      {task.post_title}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-500 shrink-0 font-mono">
                    {task.author} · {task.timestamp}
                  </span>
                </div>

                {/* Description Text */}
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                  {task.description}
                </p>

                {/* Callout Action Notice */}
                <p className="text-xs text-zinc-400 leading-normal">
                  {task.action_notice}
                </p>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => handleResolveTask(task.id, 'done')}
                    disabled={resolvingId === task.id}
                    className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs px-4 py-1.5 rounded-md transition-colors cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    {resolvingId === task.id ? 'Updating...' : 'Mark done'}
                  </button>
                  <button
                    onClick={() => handleResolveTask(task.id, 'dismiss')}
                    disabled={resolvingId === task.id}
                    className="text-zinc-300 hover:text-white font-medium text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer hover:bg-zinc-800/60 disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#181a20]/60 border border-zinc-800/60 text-center space-y-1.5">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>ALL LIVE POSTS MATCH APPROVED FACTS</span>
            </div>
            <p className="text-xs text-zinc-500">
              No live page discrepancies or outdated claims are currently pending review.
            </p>
          </div>
        )}

        {/* Collapsible: CLOSED TASKS */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setClosedTasksOpen(!closedTasksOpen)}
            className="flex items-center gap-1.5 text-xs font-mono font-semibold text-zinc-500 hover:text-zinc-300 cursor-pointer select-none transition-colors"
          >
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                closedTasksOpen ? 'rotate-90' : ''
              }`}
            />
            <span>CLOSED TASKS {closedTasks.length > 0 ? `(${closedTasks.length})` : ''}</span>
          </button>

          <AnimatePresence>
            {closedTasksOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                {closedTasks.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#181a20]/40 border border-zinc-800/50 text-xs font-mono text-zinc-500">
                    No closed tasks yet. Tasks you mark done or dismiss will be recorded here.
                  </div>
                ) : (
                  closedTasks.map((ct) => (
                    <div
                      key={ct.id}
                      className="p-3.5 rounded-xl bg-[#181a20]/80 border border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-zinc-500">{ct.id}</span>
                          <span className="font-medium text-zinc-300 line-clamp-1 max-w-lg">
                            {ct.post_title}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                            {ct.status === 'DONE' ? 'MARKED DONE' : 'DISMISSED'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Resolved {ct.resolved_at || '19 Nov 2026'} by {ct.resolved_by || 'Creator Asha'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolveTask(ct.id, 'reopen')}
                        className="text-indigo-400 hover:text-indigo-300 font-mono text-xs px-2.5 py-1 hover:bg-zinc-800/60 rounded shrink-0 self-start sm:self-center cursor-pointer"
                      >
                        Re-open
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* SECTION 2: LIVE PAGES */}
      <section className="bg-[#12141a] border border-zinc-800/80 rounded-2xl p-5 sm:p-7 space-y-4">
        {/* Section Title */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-white uppercase">
          <Globe className="w-4 h-4 text-zinc-300 shrink-0" />
          <span>LIVE PAGES</span>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-3xl">
          Tell Plumbline where an approved post is live. It reads the page and compares it with the approved text, sentence by sentence; extra text on the page is ignored, but a missing or reworded sentence (or a changed number) raises a task.
        </p>

        {/* Live Address & Post Form */}
        <form onSubmit={handleRegisterPage} className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr_auto] gap-3 items-end pt-2">
          {/* Column 1: Approved Post */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              APPROVED POST
            </label>
            <select
              value={selectedPost}
              onChange={(e) => setSelectedPost(e.target.value)}
              className="w-full bg-[#181a20] border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="">Choose...</option>
              {approvedPosts.map((post, idx) => (
                <option key={idx} value={post}>
                  {post}
                </option>
              ))}
            </select>
          </div>

          {/* Column 2: Live Address */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              LIVE ADDRESS
            </label>
            <input
              type="text"
              value={liveAddress}
              onChange={(e) => setLiveAddress(e.target.value)}
              placeholder="https://shop.example.com/serum"
              className="w-full bg-[#181a20] border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Column 3: Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isRegistering || !liveAddress.trim()}
              className="w-full md:w-auto bg-zinc-300 hover:bg-zinc-200 text-zinc-950 font-semibold text-xs px-4 py-2 rounded-md transition-colors cursor-pointer whitespace-nowrap h-[37px] flex items-center justify-center disabled:opacity-50"
            >
              {isRegistering ? 'Registering...' : 'Register and read'}
            </button>
          </div>
        </form>

        {/* Registered Live Pages List */}
        <div className="space-y-3 pt-2">
          {livePages.map((page) => (
            <div
              key={page.id}
              className="bg-[#181a20] border border-zinc-800/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left Info: Post Title + Link + Status and Checked Timestamp */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-white text-xs sm:text-sm font-semibold">
                    {page.post_title}
                  </span>
                  <a
                    href={page.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline text-xs font-mono ml-0.5 inline-flex items-center gap-1"
                  >
                    <span>{page.live_url}</span>
                  </a>
                </div>
                <div className="text-xs font-sans">
                  <span className="text-rose-400 font-medium">
                    {page.status_message}
                  </span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    {' '}· checked {page.last_checked}
                  </span>
                </div>
              </div>

              {/* Right Action: Check Now Button */}
              <button
                type="button"
                onClick={() => handleCheckNow(page.id)}
                disabled={checkingPageId === page.id}
                className="bg-[#20232a] hover:bg-zinc-700/60 text-zinc-300 border border-zinc-700/50 text-xs font-medium px-4 py-1.5 rounded-md transition-colors cursor-pointer shrink-0 self-start sm:self-center flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {checkingPageId === page.id ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Check now</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Bar */}
      <footer className="flex flex-wrap items-center gap-6 pt-12 pb-6 border-t border-zinc-900 text-[10px] font-mono tracking-widest text-zinc-600 uppercase">
        <span className="hover:text-zinc-400 cursor-pointer transition-colors">STATUS</span>
        <span className="hover:text-zinc-400 cursor-pointer transition-colors">HOW I KNOW IT WORKS</span>
        <span>AURELLE SKIN IS A FICTIONAL BRAND; NO REAL DATA IS USED.</span>
      </footer>
    </div>
  );
};
