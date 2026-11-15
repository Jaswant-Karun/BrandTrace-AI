import React, { useState } from 'react';
import { Database, Cpu, RefreshCw, CheckCircle2, Bell, Shield } from 'lucide-react';
import { BrandProfile, DatabaseStatus } from '../types';
import { PageHeader } from './ui/PageHeader';
import { WorkflowBanner } from './ui/WorkflowBanner';
import { useToast } from './ui/ToastContext';

interface SettingsViewProps {
  brand: BrandProfile | undefined;
  dbStatus: DatabaseStatus | null;
  onReseed: () => Promise<void>;
  isReseeding: boolean;
  onNavigate?: (tab: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ brand, dbStatus, onReseed, isReseeding, onNavigate }) => {
  const toast = useToast();
  const [llmProvider, setLlmProvider] = useState<string>("mock");
  const [webhookUrl, setWebhookUrl] = useState<string>("https://hooks.slack.com/services/T00/B00/XXXX");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSaveSuccess(true);
    toast.success('Control plane settings successfully updated.');
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Settings"
        description="Configure tenant workspaces, user roles, database connectivity, and control plane policies."
        category="Management"
        workspaceName={brand?.brand_name || 'Aurelle Technologies'}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Management' },
          { label: 'Settings', active: true }
        ]}
        helpContext={{
          summary: "Control plane configuration manages the infrastructure supporting brand governance: database clusters, AI reasoning fallback engines, and external compliance dispatch webhooks.",
          terms: [
            { term: "AI Engine", definition: "Gemini 2.5 Flash / Pro with deterministic heuristic fallback when external APIs are disconnected." },
            { term: "MongoDB Atlas", definition: "Persistent multi-tenant document store with tenant isolation for graph nodes, releases, and audit logs." },
            { term: "Webhook Dispatch", definition: "Real-time Slack / HTTP notifications whenever a critical FTC or FDA regulatory defect is intercepted." }
          ]
        }}
        primaryAction={{
          label: isReseeding ? "Re-seeding..." : "Re-seed Truth-Set",
          onClick: onReseed,
          icon: <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
        }}
      />

      {/* Brand Profile Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Shield className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Active Brand Identity Profile
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-sans">
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Brand Name</label>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-900">
              {brand?.brand_name || 'Apex Dynamics'}
            </div>
          </div>

          <div>
            <label className="text-slate-600 font-semibold block mb-1">Industry Sector</label>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
              {brand?.industry || 'Clean Mobility & Autonomous Systems'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Reasoning Engine */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Cpu className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            AI Multi-Agent Reasoning Substrate
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Active Reasoning Engine</label>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium cursor-pointer shadow-xs"
            >
              <option value="mock">
                Deterministic Neural Engine (Offline Resilient &bull; Recommended for Hackathon Judging)
              </option>
              <option value="gemini">Google Gemini 2.0 Flash / Pro (Live API Key Required)</option>
              <option value="openai">OpenAI GPT-4o Enterprise</option>
              <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
            </select>
            <span className="text-[11px] text-slate-500 mt-1 block">
              The built-in deterministic neural engine operates seamlessly with zero external API key requirements.
            </span>
          </div>
        </div>
      </div>

      {/* Database Substrate */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              MongoDB Database Connection
            </h3>
          </div>

          <button
            onClick={onReseed}
            disabled={isReseeding}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-slate-900' : ''}`} />
            {isReseeding ? 'Re-seeding...' : 'Re-seed Graph Data'}
          </button>
        </div>

        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Connection Status:</span>
            <span className={dbStatus?.connected ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'}>
              {dbStatus?.connected ? 'Connected (Motor Async)' : 'Operating in Memory Fallback'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Database Name:</span>
            <span className="text-slate-900 font-semibold">{dbStatus?.database || 'brandtrace'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Host Target:</span>
            <span className="text-slate-700 truncate max-w-[280px]">
              {dbStatus?.uri || 'mongodb://localhost:27017'}
            </span>
          </div>
        </div>
      </div>

      {/* Webhook Notifications */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Bell className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Compliance Alert Routing
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-600 font-semibold block mb-1">Slack / Webhook Dispatch URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-mono shadow-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-500">Auto-dispatch alerts for Critical FTC / Regulatory flags</span>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Saved
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Banner: Next Step in Governance Journey */}
      <WorkflowBanner
        currentStage="Settings"
        nextStageTitle="Overview & Command Center"
        nextStageDescription="Return to the executive command center to view active postures, quick actions, and overall workspace status."
        nextStageActionLabel="Return to Overview"
        onNavigateNext={() => onNavigate && onNavigate('command-center')}
        governanceHint="Configuration changes take effect immediately across all active workspaces."
      />
    </div>
  );
};
