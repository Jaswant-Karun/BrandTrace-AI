import React from 'react';
import { Sparkles } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  category?: string;
  workspaceName?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'emerald';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon,
  category,
  workspaceName,
  primaryAction,
  secondaryAction,
  children,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {category && (
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                {category}
              </span>
            )}
            {workspaceName && (
              <span className="text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Workspace: <strong className="text-slate-800 font-semibold">{workspaceName}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                {icon}
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs ${
                primaryAction.variant === 'emerald'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : primaryAction.variant === 'secondary'
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {primaryAction.icon || <Sparkles className="w-3.5 h-3.5" />}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};
