import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-100 rounded-md ${className}`} />
);

export const CardSkeleton: React.FC = () => (
  <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <Skeleton className="h-7 w-16" />
    <Skeleton className="h-3 w-36" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
    <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-24 ml-auto" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 flex gap-4 items-center">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-48" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-6 w-20 rounded-md ml-auto" />
        </div>
      ))}
    </div>
  </div>
);
