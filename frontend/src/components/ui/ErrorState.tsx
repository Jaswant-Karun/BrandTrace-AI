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
    <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
      <div className="w-10 h-10 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <p className="text-xs text-rose-800 max-w-md">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
};
