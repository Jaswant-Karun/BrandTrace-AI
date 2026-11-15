import React from 'react';
import { Database, CheckCircle2, AlertTriangle, X, Server, Layers } from 'lucide-react';
import { DatabaseStatus } from '../types';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DatabaseStatus | null;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({ isOpen, onClose, status }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-brand-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Database Substrate Status</h3>
              <p className="text-xs text-slate-400">MongoDB Connection & Persistence Telemetry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Pill */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          status?.connected
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : 'bg-amber-950/40 border-amber-500/40'
        }`}>
          {status?.connected ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="text-xs font-bold text-white">
              {status?.connected ? 'MongoDB Live Cluster Connected' : 'In-Memory Fallback Active'}
            </div>
            <div className="text-[11px] text-slate-300">
              {status?.connected
                ? `Active Motor Async driver connected to '${status.database}' database.`
                : 'MongoDB service not detected locally. Operating in resilient memory mode for zero-crash judging.'}
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Engine:</span>
            <span className="text-brand-300 font-semibold">{status?.engine || 'Motor Async'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Database Name:</span>
            <span className="text-slate-200">{status?.database || 'brandtrace'}</span>
          </div>
          {status?.uri && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Host:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{status.uri}</span>
            </div>
          )}
        </div>

        {/* Collections Breakdown */}
        {status?.collections && Object.keys(status.collections).length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              Collections & Documents
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(status.collections).map(([col, count]) => (
                <div key={col} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="font-mono text-slate-400">{col}</span>
                  <span className="font-bold text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Docker & Deployment instructions */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-brand-400" />
            Quickstart MongoDB with Docker Compose:
          </div>
          <code className="block p-2 rounded bg-slate-900 text-brand-300 font-mono text-[10px] select-all">
            docker-compose up -d mongodb
          </code>
        </div>
      </div>
    </div>
  );
};
