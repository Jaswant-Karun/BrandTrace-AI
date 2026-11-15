import React from 'react';
import { apiClient } from '../../services/apiClient';

interface Guideline {
  guideline_id?: string;
  title?: string;
  rule_statement?: string;
  category?: string;
  severity?: string;
  effective_date?: string;
  expiry_date?: string;
  status?: string;
}

interface CreatorGuidelineHealthProps {
  brandName?: string;
}

export const CreatorGuidelineHealth: React.FC<CreatorGuidelineHealthProps> = ({
  brandName = 'Aurelle Skin',
}) => {
  const [guidelines, setGuidelines] = React.useState<Guideline[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiClient
      .request<Guideline[]>('/api/guidelines?brand_id=aurelle-tech', { skipCache: true })
      .then(setGuidelines)
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load guideline data.');
      });
  }, []);

  const now = Date.now();
  const expired = guidelines.filter((guideline) => {
    const expiry = guideline.expiry_date ? Date.parse(guideline.expiry_date) : NaN;
    return Number.isFinite(expiry) && expiry < now;
  });
  const categories = new Set(guidelines.map((guideline) => guideline.category).filter(Boolean));
  const mandatory = guidelines.filter((guideline) =>
    ['CRITICAL', 'HIGH'].includes((guideline.severity || '').toUpperCase()),
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          BRANDTRACE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">GUIDELINE HEALTH</h1>
        <p className="text-xs sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          Evidence-backed guideline availability and freshness. Reviewer agreement metrics are unavailable because
          the backend does not expose decision-level health data.
        </p>
      </div>

      {error && <div className="p-4 rounded-xl border border-rose-800 bg-rose-950/30 text-sm text-rose-200">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['GUIDELINES', guidelines.length],
          ['MANDATORY', mandatory.length],
          ['CATEGORIES', categories.size],
          ['EXPIRED', expired.length],
        ].map(([label, value]) => (
          <div key={label} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4">
            <div className="text-2xl sm:text-4xl font-extrabold text-white font-mono">{value}</div>
            <div className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      <div className="p-5 rounded-2xl bg-neutral-950 border border-amber-900/60 space-y-2">
        <h2 className="text-lg font-black text-amber-300 uppercase">Decision health unavailable</h2>
        <p className="text-sm text-neutral-300 leading-relaxed">
          The current API provides guideline records but no persisted reviewer decisions, conflict records, or
          Wilson-bound inputs. Agreement percentages and health scores are intentionally not shown.
        </p>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 text-xs font-mono uppercase tracking-wider text-neutral-400">
          Current guideline records
        </div>
        {guidelines.length === 0 && !error ? (
          <div className="p-6 text-sm text-neutral-400">No persisted guidelines are available for this brand.</div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {guidelines.map((guideline) => (
              <div key={guideline.guideline_id || guideline.title} className="p-4 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-white">{guideline.guideline_id || 'GUIDELINE'}</span>
                  <span className="text-[10px] uppercase text-neutral-400">{guideline.category || 'Uncategorized'}</span>
                  <span className="text-[10px] uppercase text-neutral-400">{guideline.severity || 'Unspecified severity'}</span>
                </div>
                <p className="text-sm text-neutral-300">{guideline.title || guideline.rule_statement || 'Untitled guideline'}</p>
                {guideline.expiry_date && <p className="text-xs text-neutral-500">Expires {guideline.expiry_date}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
