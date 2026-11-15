import React from 'react';
import { WifiOff, ShieldAlert } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="bg-rose-950/90 border-b border-rose-800/60 px-4 sm:px-6 py-2.5 text-rose-200 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-md transition-all shadow-lg animate-in fade-in">
      <div className="flex items-center gap-2.5">
        <div className="w-5 h-5 rounded-full bg-rose-900/80 border border-rose-700/60 flex items-center justify-center shrink-0">
          <WifiOff className="w-3 h-3 text-rose-300" />
        </div>
        <div>
          <span className="font-bold text-rose-100">Offline Security Boundary Active:</span>{' '}
          <span className="text-rose-300/90">
            Network disconnected. Operating in secure read-only mode to prevent unverified brand drift.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-rose-400 font-mono">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <span>Mutations &amp; Releases Paused</span>
      </div>
    </div>
  );
};
