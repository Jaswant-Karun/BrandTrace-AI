import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreatorHeader, CreatorTab, TabItem } from './CreatorHeader';
import { CreatorCheckPost } from './CreatorCheckPost';
import { CreatorAuditLog, AuditEvent } from './CreatorAuditLog';
import { CreatorRulebook } from './CreatorRulebook';
import { CreatorFactsLedger } from './CreatorFactsLedger';
import { CreatorGuidelineHealth } from './CreatorGuidelineHealth';
import { CreatorClaimWatch } from './CreatorClaimWatch';
import { CreatorSubmissionsView } from './CreatorSubmissionsView';
import { useAuth } from '../../context/AuthContext';

interface CreatorDashboardProps {
  onBackToLanding?: () => void;
  brandName?: string;
  initialTab?: CreatorTab;
}

const CREATOR_TABS: TabItem[] = [
  { id: 'check', label: 'CHECK A POST' },
  { id: 'submissions', label: 'MY SUBMISSIONS' },
  { id: 'audit', label: 'AUDIT LOG' },
  { id: 'rulebook', label: 'RULEBOOK' },
  { id: 'facts', label: 'FACTS' },
  { id: 'health', label: 'GUIDELINE HEALTH' },
  { id: 'watch', label: 'CLAIM WATCH' },
];

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  onBackToLanding,
  brandName = 'Aurelle Skin',
  initialTab = 'check',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<CreatorTab>(initialTab);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [restoredDraft, setRestoredDraft] = useState<string | null>(null);
  const [revisionData, setRevisionData] = useState<{
    submissionId: string;
    content: string;
    channel: any;
    version: number;
    reviewerFeedback: string;
    brandId?: string;
    brandName?: string;
  } | null>(null);

  // Automatically switch role/persona to Creator if user is in another role
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  const handleSaveAuditVersion = (event: { what: string; reason?: string; hash: string }) => {
    const newEvt: AuditEvent = {
      id: `evt-dyn-${Date.now()}`,
      when: 'Just now',
      who: user?.name ? `Creator ${user.name.split(' ')[0]}` : 'Creator Asha',
      what: event.what,
      reason: event.reason || '',
      hash: event.hash,
    };
    setAuditEvents((prev) => [newEvt, ...prev]);
  };

  const handleRestoreDraft = (content: string) => {
    setRestoredDraft(content);
    setActiveTab('check');
  };

  const handleSignOut = () => {
    if (onBackToLanding) {
      onBackToLanding();
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Fixed Header with Plumbline Logo, 7 Tabs, User info & Hanging Plumb Bob */}
      <CreatorHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={handleSignOut}
        userName={user?.name ? user.name.split(',')[0].toUpperCase() : 'CREATOR ASHA'}
        roleName="CREATOR"
        customTabs={CREATOR_TABS}
      />

      {/* Main Tab Content View */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'check' && (
              <CreatorCheckPost
                brandName={brandName}
                initialContent={restoredDraft || undefined}
                role="creator"
                userId={user?.email || 'creator@aurelle.com'}
                userName={user?.name || 'Creator Asha'}
                orgId="ORG-AURELLE"
                revisionData={revisionData}
                onClearRevision={() => setRevisionData(null)}
                onNavigateToSubmissions={() => setActiveTab('submissions')}
                onSaveAuditVersion={handleSaveAuditVersion}
              />
            )}

            {activeTab === 'submissions' && (
              <CreatorSubmissionsView
                role="creator"
                userId={user?.email || 'creator@aurelle.com'}
                userName={user?.name || 'Creator Asha'}
                orgId="ORG-AURELLE"
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
            )}

            {activeTab === 'audit' && (
              <CreatorAuditLog
                brandName={brandName}
                customEvents={auditEvents}
                onRestoreDraft={handleRestoreDraft}
              />
            )}

            {activeTab === 'rulebook' && (
              <CreatorRulebook brandName={brandName} />
            )}

            {activeTab === 'facts' && (
              <CreatorFactsLedger brandName={brandName} role="creator" />
            )}

            {activeTab === 'health' && (
              <CreatorGuidelineHealth brandName={brandName} />
            )}

            {activeTab === 'watch' && (
              <CreatorClaimWatch brandName={brandName} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer matching reference screenshots */}
      <footer className="border-t border-neutral-800/60 py-6 px-4 sm:px-8 bg-black text-[11px] font-mono text-neutral-500">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="hover:text-neutral-400 cursor-pointer">STATUS</span>
            <span>·</span>
            <span className="hover:text-neutral-400 cursor-pointer">HOW I KNOW IT WORKS</span>
          </div>

          <div className="uppercase tracking-wider text-neutral-600">
            AURELLE SKIN IS A FICTIONAL BRAND; NO REAL DATA IS USED.
          </div>
        </div>
      </footer>

    </div>
  );
};
