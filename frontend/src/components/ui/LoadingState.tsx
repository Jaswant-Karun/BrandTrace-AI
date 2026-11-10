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
    <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[280px] space-y-3">
      <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      <div className="text-sm font-bold text-white tracking-wide">{message}</div>
      <p className="text-xs text-slate-400 max-w-sm">{subtext}</p>
    </div>
  );
};
