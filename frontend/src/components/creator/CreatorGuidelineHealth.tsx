import React from 'react';

interface GuidelineRuleStat {
  code: string;
  name: string;
  flags: number;
  upheld: number;
  overruled: number;
  dismissed: number;
  agreement: number;
  lowerBound: number;
  status: 'Still advisory' | 'Too few decisions (n < 10)' | 'Ready to block';
}

const HEALTH_STATS: GuidelineRuleStat[] = [
  {
    code: 'TN-03',
    name: 'Avoid all-caps words (brand name and standard acronyms excepted)',
    flags: 29,
    upheld: 18,
    overruled: 10,
    dismissed: 0,
    agreement: 64,
    lowerBound: 46,
    status: 'Still advisory',
  },
  {
    code: 'TN-01',
    name: 'Tone is warm and energetic, never hype or pressure',
    flags: 15,
    upheld: 10,
    overruled: 0,
    dismissed: 0,
    agreement: 100,
    lowerBound: 72,
    status: 'Still advisory',
  },
  {
    code: 'GM10',
    name: 'Numbers over three digits get commas',
    flags: 18,
    upheld: 6,
    overruled: 0,
    dismissed: 0,
    agreement: 100,
    lowerBound: 61,
    status: 'Too few decisions (n < 10)',
  },
  {
    code: 'CL-03',
    name: 'Environmental claims must be specific and substantiated',
    flags: 3,
    upheld: 2,
    overruled: 0,
    dismissed: 0,
    agreement: 100,
    lowerBound: 34,
    status: 'Too few decisions (n < 10)',
  },
  {
    code: 'CL-01',
    name: 'Regulated efficacy phrases need a matching fact and compliance sign-off',
    flags: 4,
    upheld: 1,
    overruled: 0,
    dismissed: 0,
    agreement: 100,
    lowerBound: 21,
    status: 'Too few decisions (n < 10)',
  },
];

interface CreatorGuidelineHealthProps {
  brandName?: string;
}

export const CreatorGuidelineHealth: React.FC<CreatorGuidelineHealthProps> = ({
  brandName = 'Aurelle Skin',
}) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Breadcrumb & Section Header */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
          BRANDTRACE · {brandName.toUpperCase()}
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white font-sans uppercase">
          GUIDELINE HEALTH
        </h1>
        <p className="text-xs sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
          How often reviewers agree with each rule. A rule they keep overruling is probably worded unclearly.
        </p>
      </div>

      {/* Emerald Green Status Banner */}
      <div className="p-5 sm:p-7 rounded-2xl bg-neutral-950 border border-emerald-900/60 shadow-xl space-y-3">
        <h2 className="text-xl sm:text-3xl font-black font-sans text-emerald-400 uppercase tracking-tight">
          NO RULE LOOKS UNCLEAR YET
        </h2>
        <p className="text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed max-w-3xl">
          Your submitted drafts only. Private pre-checks never count. Accepted fixes and upholds count as agreeing; overrules and dismissals as disagreeing. The lower bound is a 95% Wilson bound: we are 95% sure agreement is at least that high. A brand rule is ready to block once its lower bound reaches 80%; a rule may be unclear once we are 95% sure reviewers disagree at least a quarter of the time. Under 10 decisions is too few to say either.
        </p>
      </div>

      {/* Interactive Chart: HOW OFTEN REVIEWERS AGREE WITH EACH RULE */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
        <div>
          <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
            HOW OFTEN REVIEWERS AGREE WITH EACH RULE
          </h3>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Dot: share of decisions that agreed. Line: the range we are 95% sure it lies in. A brand rule is ready to block once the whole range is right of the plumb line.
          </p>
        </div>

        {/* Chart View with Plumb Line */}
        <div className="relative pt-6 pb-4">
          
          {/* Vertical 80% Plumb Line */}
          <div className="absolute top-0 bottom-0 left-[80%] w-[1px] bg-white z-20 pointer-events-none flex flex-col items-center">
            <span className="text-[9px] font-mono font-bold text-white bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded -mt-3 shadow-md whitespace-nowrap">
              READY TO BLOCK · 80%
            </span>
          </div>

          {/* Ruler Marks at 0%, 50%, 100% */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-800">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>

          {/* Rows for Rules */}
          <div className="space-y-6 pb-6">
            {HEALTH_STATS.map((stat) => (
              <div key={stat.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{stat.code}</span>
                    <span className="text-neutral-400 font-sans truncate max-w-md hidden sm:inline">
                      {stat.name}
                    </span>
                  </div>
                  <span className="font-bold text-indigo-300">{stat.agreement}%</span>
                </div>

                {/* Range Bar + Dot */}
                <div className="relative h-3 bg-neutral-900/60 rounded flex items-center">
                  {/* Range line (95% Wilson bound) */}
                  <div
                    style={{
                      left: `${stat.lowerBound}%`,
                      width: `${Math.max(4, stat.agreement - stat.lowerBound)}%`,
                    }}
                    className="absolute h-[2px] bg-indigo-500/80 rounded"
                  />

                  {/* Dot (share of decisions) */}
                  <div
                    style={{ left: `calc(${stat.agreement}% - 5px)` }}
                    className="absolute w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                  />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Mobile Health Stats Card List (< 640px) */}
      <div className="block sm:hidden space-y-3">
        {HEALTH_STATS.map((row) => (
          <div
            key={row.code}
            className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 shadow-lg"
          >
            <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 pb-2">
              <span className="font-mono font-bold text-xs text-white px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                {row.code}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300">
                {row.status}
              </span>
            </div>

            <p className="text-xs font-sans text-neutral-300 leading-snug">
              {row.name}
            </p>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
              <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="text-[10px] text-neutral-400">AGREEMENT</div>
                <div className="text-sm font-bold text-white">{row.agreement}%</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="text-[10px] text-emerald-400">UPHELD</div>
                <div className="text-sm font-bold text-emerald-400">{row.upheld}</div>
              </div>
              <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="text-[10px] text-rose-400">OVERRULED</div>
                <div className="text-sm font-bold text-rose-400">{row.overruled}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-neutral-900">
              <span>95% Lower Bound: {row.lowerBound}%</span>
              <span>Total Flags: {row.flags}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Health Data Table (>= 640px) */}
      <div className="hidden sm:block bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-neutral-800/80 bg-neutral-900/60 text-neutral-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">RULE</th>
                <th className="py-3 px-3 text-center">FLAGS</th>
                <th className="py-3 px-3 text-center">UPHELD</th>
                <th className="py-3 px-3 text-center">OVERRULED</th>
                <th className="py-3 px-3 text-center">DISMISSED</th>
                <th className="py-3 px-3 text-center">AGREEMENT</th>
                <th className="py-3 px-3 text-center">LOWER BOUND</th>
                <th className="py-3 px-4 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900 text-neutral-200">
              {HEALTH_STATS.map((row) => (
                <tr key={row.code} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-sans">
                    <span className="font-mono font-bold text-white mr-2">{row.code}</span>
                    <span className="text-neutral-400 text-[11px]">{row.name}</span>
                  </td>
                  <td className="py-3.5 px-3 text-center text-neutral-300">{row.flags}</td>
                  <td className="py-3.5 px-3 text-center text-emerald-400">{row.upheld}</td>
                  <td className="py-3.5 px-3 text-center text-rose-400">{row.overruled}</td>
                  <td className="py-3.5 px-3 text-center text-neutral-500">{row.dismissed}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-white">{row.agreement}%</td>
                  <td className="py-3.5 px-3 text-center text-neutral-400">{row.lowerBound}%</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

