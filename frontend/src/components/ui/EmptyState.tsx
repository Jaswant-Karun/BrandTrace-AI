import React from 'react';
import { Layers } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Records Found",
  description = "No matching records exist in this brand workspace.",
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[260px] space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
        {icon || <Layers className="w-6 h-6 text-cyan-400" />}
      </div>
      <div className="text-sm font-bold text-white">{title}</div>
      <p className="text-xs text-slate-400 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
