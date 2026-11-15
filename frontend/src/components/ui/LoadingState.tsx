import React from 'react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading Governance Records...",
  subtext = "Querying MongoDB Atlas with tenant isolation..."
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[280px] space-y-3 shadow-xs">
      <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      <div className="text-sm font-bold text-slate-900 tracking-wide">{message}</div>
      <p className="text-xs text-slate-500 max-w-sm">{subtext}</p>
    </div>
  );
};
