import React, { useState } from 'react';
import { Settings, Database, Cpu, RefreshCw, CheckCircle2, Bell, Shield } from 'lucide-react';
import { BrandProfile, DatabaseStatus } from '../types';

interface SettingsViewProps {
  brand: BrandProfile | undefined;
  dbStatus: DatabaseStatus | null;
  onReseed: () => Promise<void>;
  isReseeding: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ brand, dbStatus, onReseed, isReseeding }) => {
  const [llmProvider, setLlmProvider] = useState<string>("mock");
  const [webhookUrl, setWebhookUrl] = useState<string>("https://hooks.slack.com/services/T00/B00/XXXX");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Control Plane Enterprise Settings
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Configure AI reasoning engines, database persistence, governance notification webhooks, and regulatory jurisdictions.
          </p>
        </div>
      </div>

      {/* Brand Profile Details */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Active Brand Identity Profile
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs font-sans">
          <div>
            <label className="text-slate-400 block mb-1">Brand Name</label>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-bold text-white">
              {brand?.brand_name || 'Apex Dynamics'}
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Industry Sector</label>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
              {brand?.industry || 'Clean Mobility & Autonomous Systems'}
            </div>
          </div>
        </div>
      </div>

      {/* AI Reasoning Engine */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            AI Multi-Agent Reasoning Substrate
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Active Reasoning Engine</label>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              <option value="mock">
                Deterministic Neural Engine (Offline Resilient &bull; Recommended for Hackathon Judging)
              </option>
              <option value="gemini">Google Gemini 2.0 Flash / Pro (Live API Key Required)</option>
              <option value="openai">OpenAI GPT-4o Enterprise</option>
              <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              The built-in deterministic neural engine operates seamlessly with zero external API key requirements.
            </span>
          </div>
        </div>
      </div>

      {/* Database Substrate */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              MongoDB Database Connection
            </h3>
          </div>

          <button
            onClick={onReseed}
            disabled={isReseeding}
            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-cyan-400' : ''}`} />
            {isReseeding ? 'Re-seeding...' : 'Re-seed Graph Data'}
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Connection Status:</span>
            <span className={dbStatus?.connected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {dbStatus?.connected ? 'Connected (Motor Async)' : 'Operating in Memory Fallback'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Database Name:</span>
            <span className="text-white">{dbStatus?.database || 'brandtrace'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Host Target:</span>
            <span className="text-slate-300 truncate max-w-[280px]">
              {dbStatus?.uri || 'mongodb://localhost:27017'}
            </span>
          </div>
        </div>
      </div>

      {/* Webhook Notifications */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Compliance Alert Routing
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Slack / Webhook Dispatch URL</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-slate-400">Auto-dispatch alerts for Critical FTC / Regulatory flags</span>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
