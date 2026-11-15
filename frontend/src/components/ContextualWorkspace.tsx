import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Sparkles, ShieldAlert, GitFork, CheckCircle2, Lock,
  X, ChevronRight, Layers, Sliders, ExternalLink, RefreshCw
} from 'lucide-react';
import { BrandProfile, VerificationResult } from '../types';
import { ErrorBoundary } from './ui/ErrorBoundary';

// Lazy-load view components for optimized bundle performance
const KnowledgeGraphView = lazy(() => import('./KnowledgeGraphView').then(m => ({ default: m.KnowledgeGraphView })));
const DependencyIntelligenceStudio = lazy(() => import('./DependencyIntelligenceStudio').then(m => ({ default: m.DependencyIntelligenceStudio })));
const AssetInspector = lazy(() => import('./AssetInspector').then(m => ({ default: m.AssetInspector })));
const BlastRadiusSimulator = lazy(() => import('./BlastRadiusSimulator').then(m => ({ default: m.BlastRadiusSimulator })));
const MultimodalInspectionView = lazy(() => import('./MultimodalInspectionView').then(m => ({ default: m.MultimodalInspectionView })));
const CampaignIntelligenceView = lazy(() => import('./CampaignIntelligenceView').then(m => ({ default: m.CampaignIntelligenceView })));
const RiskIntelligenceView = lazy(() => import('./RiskIntelligenceView').then(m => ({ default: m.RiskIntelligenceView })));
const ApprovalCenterView = lazy(() => import('./ApprovalCenterView').then(m => ({ default: m.ApprovalCenterView })));
const BrandKnowledgeBaseView = lazy(() => import('./BrandKnowledgeBaseView').then(m => ({ default: m.BrandKnowledgeBaseView })));
const GovernanceAnalyticsView = lazy(() => import('./GovernanceAnalyticsView').then(m => ({ default: m.GovernanceAnalyticsView })));
const AuditTrustCenterView = lazy(() => import('./AuditTrustCenterView').then(m => ({ default: m.AuditTrustCenterView })));
const PublicVerificationView = lazy(() => import('./PublicVerificationView').then(m => ({ default: m.PublicVerificationView })));

export type WorkspaceCategory =
  | 'brand-knowledge'
  | 'content-intelligence'
  | 'risk-intelligence'
  | 'impact-simulation'
  | 'governance-approval'
  | 'trust-verification';

interface ContextualWorkspaceProps {
  activeCategory: WorkspaceCategory | null;
  onClose: () => void;
  selectedBrandId: string;
  setSelectedBrandId: (id: string) => void;
  brands: BrandProfile[];
  onSignRelease?: (result: VerificationResult, reviewerName: string) => Promise<void>;
  initialSubTab?: string;
}

const WorkspaceLoading: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white dark:bg-slate-950 transition-colors">
    <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-wide">
      Loading {label}...
    </span>
  </div>
);

export const ContextualWorkspace: React.FC<ContextualWorkspaceProps> = ({
  activeCategory,
  onClose,
  selectedBrandId,
  setSelectedBrandId,
  brands,
  onSignRelease,
  initialSubTab,
}) => {
  // Sub-tab selection state per category
  const [subTab, setSubTab] = useState<string>('default');

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    } else {
      // Set sensible default sub-tab per category
      switch (activeCategory) {
        case 'brand-knowledge':
          setSubTab('guidelines');
          break;
        case 'content-intelligence':
          setSubTab('inspector');
          break;
        case 'risk-intelligence':
          setSubTab('risks');
          break;
        case 'impact-simulation':
          setSubTab('simulator');
          break;
        case 'governance-approval':
          setSubTab('approvals');
          break;
        case 'trust-verification':
          setSubTab('ledger');
          break;
        default:
          setSubTab('default');
      }
    }
  }, [activeCategory, initialSubTab]);

  if (!activeCategory) return null;

  const getCategoryMeta = () => {
    switch (activeCategory) {
      case 'brand-knowledge':
        return {
          title: 'Brand Knowledge',
          badge: 'Ground Truth & Guidelines',
          icon: BookOpen,
          accent: 'from-blue-600 to-indigo-600',
          subTabs: [
            { id: 'guidelines', label: 'Guidelines & Master Facts' },
            { id: 'graph', label: 'Interactive Knowledge Graph' },
            { id: 'mutation', label: 'Mutation Workflow Studio' },
          ],
        };
      case 'content-intelligence':
        return {
          title: 'Content Intelligence',
          badge: 'Pre-Publication Review',
          icon: Sparkles,
          accent: 'from-blue-600 to-indigo-600',
          subTabs: [
            { id: 'inspector', label: 'Asset Inspector (Text & Claims)' },
            { id: 'multimodal', label: 'Multimodal Packaging & Vision' },
          ],
        };
      case 'risk-intelligence':
        return {
          title: 'Risk Intelligence',
          badge: 'Compliance & Exposure Analytics',
          icon: ShieldAlert,
          accent: 'from-blue-600 to-indigo-600',
          subTabs: [
            { id: 'risks', label: 'Risk Intelligence Center' },
            { id: 'campaigns', label: 'Campaign-Level Compliance' },
          ],
        };
      case 'impact-simulation':
        return {
          title: 'Impact Simulation',
          badge: 'Digital Twin Blast Radius',
          icon: GitFork,
          accent: 'from-blue-600 to-indigo-600',
          subTabs: [
            { id: 'simulator', label: 'Blast Radius Simulator' },
          ],
        };
      case 'governance-approval':
        return {
          title: 'Governance & Approval',
          badge: 'Human-in-the-Loop Sign-Off',
          icon: CheckCircle2,
          accent: 'from-blue-600 to-indigo-600',
          subTabs: [
            { id: 'approvals', label: 'Review & Approval Queue' },
            { id: 'analytics', label: 'Governance Analytics & SLA' },
          ],
        };
      case 'trust-verification':
        return {
          title: 'Trust & Verification',
          badge: 'Cryptographic Digest & Public Verification',
          icon: Lock,
          accent: 'from-blue-600 to-indigo-600',
          subTabs: [
            { id: 'ledger', label: 'Cryptographic Audit Ledger' },
            { id: 'public-verify', label: 'Public Verification Portal' },
          ],
        };
    }
  };

  const meta = getCategoryMeta();
  const Icon = meta.icon;

  const currentBrand = brands.find((b) => b.brand_id === selectedBrandId);

  return (
    <section
      id="workspace"
      className="scroll-mt-20 py-8 sm:py-12 border-t border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Workspace Control Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Left: Category Title & Breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                  {meta.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">Workspace</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {meta.title}
              </h2>
            </div>
          </div>

          {/* Right: Brand Selector + Sub-Tabs + Close Button */}
          <div className="flex items-center gap-2.5 flex-wrap justify-between md:justify-end">
            
            {/* Active Brand Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">Active Brand:</span>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(e.target.value)}
                className="bg-transparent font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {brands.map((b) => (
                  <option key={b.brand_id} value={b.brand_id} className="dark:bg-slate-900">
                    {b.brand_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Tabs (if category has multiple views) */}
            {meta.subTabs.length > 1 && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {meta.subTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSubTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      subTab === tab.id
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Close Workspace Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-semibold cursor-pointer shadow-2xs"
              title="Close Workspace"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Workspace</span>
            </button>

          </div>

        </div>

        {/* Workspace Canvas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 transition-colors min-h-[500px]">
          <ErrorBoundary fallbackTitle={`Error rendering ${meta.title} workspace`} onReset={onClose}>
            <Suspense fallback={<WorkspaceLoading label={meta.title} />}>
              
              {/* Category 1: Brand Knowledge */}
              {activeCategory === 'brand-knowledge' && (
                <>
                  {subTab === 'guidelines' && (
                    <BrandKnowledgeBaseView brandId={selectedBrandId} onNavigate={() => {}} />
                  )}
                  {subTab === 'graph' && (
                    <KnowledgeGraphView brandId={selectedBrandId} onNavigate={() => {}} />
                  )}
                  {subTab === 'mutation' && (
                    <DependencyIntelligenceStudio brandId={selectedBrandId} />
                  )}
                </>
              )}

              {/* Category 2: Content Intelligence */}
              {activeCategory === 'content-intelligence' && (
                <>
                  {subTab === 'inspector' && (
                    <AssetInspector
                      brandId={selectedBrandId}
                      onSignRelease={onSignRelease || (async () => {})}
                      onNavigate={() => {}}
                    />
                  )}
                  {subTab === 'multimodal' && (
                    <MultimodalInspectionView brandId={selectedBrandId} onNavigate={() => {}} />
                  )}
                </>
              )}

              {/* Category 3: Risk Intelligence */}
              {activeCategory === 'risk-intelligence' && (
                <>
                  {subTab === 'risks' && (
                    <RiskIntelligenceView brandId={selectedBrandId} onNavigate={() => {}} />
                  )}
                  {subTab === 'campaigns' && (
                    <CampaignIntelligenceView brandId={selectedBrandId} onNavigate={() => {}} />
                  )}
                </>
              )}

              {/* Category 4: Impact Simulation */}
              {activeCategory === 'impact-simulation' && (
                <BlastRadiusSimulator brandId={selectedBrandId} onNavigate={() => {}} />
              )}

              {/* Category 5: Governance & Approval */}
              {activeCategory === 'governance-approval' && (
                <>
                  {subTab === 'approvals' && (
                    <ApprovalCenterView brandId={selectedBrandId} onNavigate={() => {}} />
                  )}
                  {subTab === 'analytics' && (
                    <GovernanceAnalyticsView brandId={selectedBrandId} onNavigate={() => {}} />
                  )}
                </>
              )}

              {/* Category 6: Trust & Verification */}
              {activeCategory === 'trust-verification' && (
                <>
                  {subTab === 'ledger' && (
                    <AuditTrustCenterView brandId={selectedBrandId} onNavigate={() => {}} />
                  )}
                  {subTab === 'public-verify' && (
                    <PublicVerificationView
                      initialBrand={currentBrand?.brand_name || 'Aurelle Technologies'}
                      onBack={onClose}
                    />
                  )}
                </>
              )}

            </Suspense>
          </ErrorBoundary>
        </div>

      </div>
    </section>
  );
};
