import React, { useState, useEffect } from 'react';
import { CreatorHeader, CreatorTab, TabItem } from './CreatorHeader';
import { CreatorCheckPost } from './CreatorCheckPost';
import { CreatorAuditLog } from './CreatorAuditLog';
import { CreatorRulebook } from './CreatorRulebook';
import { CreatorFactsLedger } from './CreatorFactsLedger';
import { CreatorGuidelineHealth } from './CreatorGuidelineHealth';
import { CreatorClaimWatch } from './CreatorClaimWatch';
import { CheckCircle2, ExternalLink } from 'lucide-react';

export type DashboardRole = 'agency' | 'reviewer' | 'compliance' | 'brand-owner';

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
    'brand-owner': {
      userName: 'BRAND OWNER KABIR',
      roleName: 'BRAND OWNER',
      title: 'GUIDELINE HEALTH',
      defaultTab: 'health' as CreatorTab,
      tabs: [
        { id: 'check' as CreatorTab, label: 'CHECK A POST' },
        { id: 'audit' as CreatorTab, label: 'AUDIT LOG' },
        { id: 'rulebook' as CreatorTab, label: 'RULEBOOK' },
        { id: 'facts' as CreatorTab, label: 'FACTS' },
        { id: 'health' as CreatorTab, label: 'GUIDELINE HEALTH' },
        { id: 'watch' as CreatorTab, label: 'CLAIM WATCH' },
      ],
    },
  }[role];

  const [activeTab, setActiveTab] = useState<CreatorTab>(roleConfig.defaultTab);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

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
        
        {/* CHECK A POST tab */}
        {activeTab === 'check' && (
          <div className="space-y-6">
            <CreatorCheckPost
              brandName={brandName}
              onSaveAuditVersion={() => {}}
            />
          </div>
        )}

        {/* REVIEW QUEUE tab (for Reviewer & Compliance) */}
        {activeTab === 'queue' && (
          <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
            <div className="space-y-2">
              <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                BRANDTRACE · {brandName.toUpperCase()}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
                REVIEW QUEUE
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 font-sans max-w-2xl leading-relaxed">
                Posts sent for review, riskiest first. Drafts people check privately never appear here.
              </p>
            </div>

            {/* 4 Top KPI Metric Cards matching reference */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">22</div>
                <div className="text-xs font-mono text-neutral-400 uppercase font-semibold">WAITING</div>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-[#ff6358] font-mono">15</div>
                <div className="text-xs font-mono text-neutral-400 uppercase font-semibold">BLOCKING, STILL WAITING</div>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-purple-400 font-mono">5</div>
                <div className="text-xs font-mono text-neutral-400 uppercase font-semibold">NEED COMPLIANCE</div>
              </div>
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 space-y-1">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono">3</div>
                <div className="text-xs font-mono text-neutral-400 uppercase font-semibold">APPROVED</div>
              </div>
            </div>

            {/* Posts List matching reference */}
            <div className="space-y-3 pt-2">
              {[
                {
                  id: 'post-1',
                  blockingCount: 6,
                  status: 'APPROVED',
                  statusColor: 'emerald',
                  title: 'Meet the NEW Aurelle Vitamin-C serum!!! 100% natural, eco-friendly and clinically proven to fade dark spot...',
                  meta: 'Creator Asha · employee · instagram · version 2 · 5 claim or confidential',
                  badges: ['REVIEW', 'COMPLIANCE'],
                },
                {
                  id: 'post-2',
                  blockingCount: 5,
                  status: 'SUBMITTED',
                  statusColor: 'purple',
                  title: 'Ceramide Barrier Cream is the treatment for eczema and dry, itchy skin. Doctor approved and guaranteed r...',
                  meta: 'Creator Asha · employee · web · version 2 · 5 claim or confidential',
                  badges: ['1 REVIEW', '2 COMPLIANCE'],
                },
                {
                  id: 'post-3',
                  blockingCount: 0,
                  status: 'IN REVIEW',
                  statusColor: 'amber',
                  title: 'READ our GUIDE and BROWSE the RANGE. OPEN the CATALOGUE, SEE the SHADES, PICK a SET and ENJOY t...',
                  meta: 'Creator Asha · employee · instagram · version 2 · 0 claim or confidential',
                  badges: ['1 REVIEW'],
                },
                {
                  id: 'post-4',
                  blockingCount: 0,
                  status: 'IN REVIEW',
                  statusColor: 'amber',
                  title: 'Learn the basics of a DIY face mask, a LED light routine, AHA and BHA. Shop the Vitamin C Brightening Ser...',
                  meta: 'Creator Asha · employee · instagram · version 2 · 0 claim or confidential',
                  badges: ['1 REVIEW'],
                },
                {
                  id: 'post-5',
                  blockingCount: 0,
                  status: 'IN REVIEW',
                  statusColor: 'amber',
                  title: 'A short glossary: GMP, BPA, SLS, FDA, PETA and TEWL explained in plain words. Shop the Vitamin C Brighte...',
                  meta: 'Creator Asha · employee · instagram · version 2 · 0 claim or confidential',
                  badges: ['1 REVIEW'],
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    {/* Left Blocking indicator */}
                    <div className="flex flex-col items-center justify-center shrink-0 w-16 pt-0.5">
                      <span className={`text-2xl font-black font-mono ${item.blockingCount > 0 ? 'text-[#ff6358]' : 'text-neutral-500'}`}>
                        {item.blockingCount}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">
                        BLOCKING
                      </span>
                      <div className={`w-8 h-1 rounded-full mt-1.5 ${item.blockingCount > 0 ? 'bg-[#ff6358]' : 'bg-neutral-800'}`} />
                    </div>

                    {/* Middle: Content & Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider ${
                          item.statusColor === 'emerald'
                            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                            : item.statusColor === 'purple'
                            ? 'bg-purple-950/80 border border-purple-500/40 text-purple-300'
                            : 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                        }`}>
                          {item.status}
                        </span>
                        {item.badges.map((b, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800">
                            {b.includes('REVIEW') && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                            {b}
                          </span>
                        ))}
                      </div>

                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors leading-snug">
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
                </div>
              ))}
            </div>
          </div>
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
