import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  error?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Governance Operation Error",
  error = "An error occurred while communicating with the BrandTrace API.",
  onRetry
}) => {
  return (
    <div className="bg-[#0B0F19] border border-red-500/30 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="text-sm font-bold text-white">{title}</div>
      <p className="text-xs text-red-300 max-w-md">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
