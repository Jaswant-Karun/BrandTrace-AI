import React, { useState } from 'react';
import { Sparkles, HelpCircle, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem } from './Breadcrumb';

interface ContextHelpItem {
  term: string;
  definition: string;
}

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  category?: string;
  workspaceName?: string;
  breadcrumbs?: BreadcrumbItem[];
  helpContext?: {
    summary: string;
    terms?: ContextHelpItem[];
  };
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
  breadcrumbs,
  helpContext,
  primaryAction,
  secondaryAction,
  children,
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs mb-4 sm:mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5 max-w-3xl">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <div className="mb-2">
              <Breadcrumb items={breadcrumbs} />
            </div>
          ) : (
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
          )}

          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                {icon}
              </div>
            )}
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
            {description}
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 pt-1 sm:pt-0 shrink-0">
          {helpContext && (
            <button
              onClick={() => setIsHelpOpen(!isHelpOpen)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isHelpOpen
                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Toggle contextual help and terminology"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>{isHelpOpen ? 'Hide Help' : 'Context & Terms'}</span>
              {isHelpOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className={`px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs ${
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

      {/* Expandable Contextual Help Drawer */}
      {helpContext && isHelpOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100 bg-sky-50/40 -mx-4 -mb-4 p-4 sm:-mx-6 sm:-mb-6 sm:p-6 rounded-b-xl border-x-0 border-b-0 space-y-3">
          <div className="flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-sky-700 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-900">
                Contextual Help &amp; Governance Principles
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {helpContext.summary}
              </p>
            </div>
          </div>

          {helpContext.terms && helpContext.terms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {helpContext.terms.map((t, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-sky-100 shadow-2xs space-y-0.5">
                  <div className="text-[11px] font-semibold text-sky-950 font-mono">
                    {t.term}
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">
                    {t.definition}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
