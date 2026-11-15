import React from 'react';
import { ArrowRight, HelpCircle, CheckCircle } from 'lucide-react';

export interface WorkflowBannerProps {
  currentStage: string;
  nextStageTitle: string;
  nextStageDescription: string;
  nextStageActionLabel: string;
  onNavigateNext: () => void;
  governanceHint?: string;
}

export const WorkflowBanner: React.FC<WorkflowBannerProps> = ({
  currentStage,
  nextStageTitle,
  nextStageDescription,
  nextStageActionLabel,
  onNavigateNext,
  governanceHint,
}) => {
  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
              Current Stage: {currentStage}
            </span>
            <span className="text-slate-400 text-xs">→</span>
            <span className="text-[11px] font-semibold text-slate-700">
              Next Step: {nextStageTitle}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {nextStageDescription}
          </p>
          {governanceHint && (
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{governanceHint}</span>
            </p>
          )}
        </div>

        <button
          onClick={onNavigateNext}
          className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold rounded-lg border border-slate-300 transition-all flex items-center gap-2 cursor-pointer shadow-2xs shrink-0 hover:border-slate-400"
        >
          <span>{nextStageActionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </div>
  );
};
