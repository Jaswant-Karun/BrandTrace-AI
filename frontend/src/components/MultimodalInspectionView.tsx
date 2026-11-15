import React, { useState } from 'react';
import { Eye, ShieldCheck, AlertTriangle, CheckCircle2, Sparkles, Sliders } from 'lucide-react';

interface MultimodalInspectionViewProps {
  brandId: string;
}

export const MultimodalInspectionView: React.FC<MultimodalInspectionViewProps> = ({ brandId }) => {
  const [assetTitle, setAssetTitle] = useState<string>("Q1 Billboard & Digital Display Creative Lockup");
  const [channel, setChannel] = useState<string>("Digital Display / Social");
  const [primaryColor, setPrimaryColor] = useState<string>("#0F172A");
  const [accentColor, setAccentColor] = useState<string>("#06B6D4");
  const [backgroundColor, setBackgroundColor] = useState<string>("#020617");
  const [textColor, setTextColor] = useState<string>("#F8FAFC");
  const [logoPadding, setLogoPadding] = useState<number>(24);
  const [minLogoClearance, setMinLogoClearance] = useState<number>(20);
  const [disclaimerFontSize, setDisclaimerFontSize] = useState<number>(9.0);
  const [hasTrademarkSymbol, setHasTrademarkSymbol] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<any>(null);

  const handleInspect = async () => {
    setIsLoading(true);
    setInspectionResult(null);

    try {
      const res = await fetch('/api/multimodal/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          asset_title: assetTitle,
          channel: channel,
          primary_color_hex: primaryColor,
          accent_color_hex: accentColor,
          background_color_hex: backgroundColor,
          text_color_hex: textColor,
          logo_padding_px: Number(logoPadding),
          min_logo_clearance_px: Number(minLogoClearance),
          disclaimer_font_size_pt: Number(disclaimerFontSize),
          has_trademark_symbol_in_lockup: hasTrademarkSymbol
        })
      });
      if (!res.ok) throw new Error('Inspection failed');
      const data = await res.json();
      setInspectionResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Multimodal Brand &amp; Creative Inspection
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Validates visual brand design tokens: logo safe-zone clearances, WCAG AA legal contrast ratios, and statutory disclaimer sizing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Parameters (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Creative Spec Tokens
            </h3>

            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Asset Lockup Title</label>
              <input
                type="text"
                value={assetTitle}
                onChange={(e) => setAssetTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Background Hex</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Text Color Hex</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Primary Brand Hex</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">Accent Brand Hex</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-200 font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Numeric Clear Space & Font Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Logo Padding ({logoPadding}px)
                </label>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={logoPadding}
                  onChange={(e) => setLogoPadding(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  Disclaimer Size ({disclaimerFontSize}pt)
                </label>
                <input
                  type="range"
                  min="6"
                  max="14"
                  step="0.5"
                  value={disclaimerFontSize}
                  onChange={(e) => setDisclaimerFontSize(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Trademark Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="tmSymbol"
                checked={hasTrademarkSymbol}
                onChange={(e) => setHasTrademarkSymbol(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
              <label htmlFor="tmSymbol" className="text-xs text-slate-300 font-medium cursor-pointer">
                Include registered trademark symbol (™/®) in primary logo lockup
              </label>
            </div>

            <button
              onClick={handleInspect}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Analyzing Multimodal Design Tokens...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 stroke-[2.5]" />
                  Execute Multimodal Inspection
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Preview & Inspection Report (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Simulated Lockup Canvas */}
          <div
            className="rounded-2xl p-8 border border-slate-800 transition-all flex flex-col justify-between min-h-[220px]"
            style={{ backgroundColor: backgroundColor, color: textColor }}
          >
            <div className="flex items-center justify-between">
              <div
                className="border border-dashed border-cyan-400/50 rounded-lg inline-flex items-center gap-2 font-black text-sm tracking-widest uppercase"
                style={{ padding: `${logoPadding}px` }}
              >
                APEX DYNAMICS{hasTrademarkSymbol ? '™' : ''}
              </div>
              <span className="text-[10px] font-mono opacity-60">Aspect: 16:9</span>
            </div>

            <div className="mt-6 space-y-1">
              <div className="font-extrabold text-lg" style={{ color: accentColor }}>
                Aerodynamic Performance Re-Engineered.
              </div>
              <p
                className="opacity-75 leading-relaxed font-sans"
                style={{ fontSize: `${disclaimerFontSize}pt` }}
              >
                *Mandatory Legal Disclaimer: 520 miles EPA-estimated range with QuantumCell™ Architecture. Driver supervision required at all times.
              </p>
            </div>
          </div>

          {/* Inspection Report */}
          {inspectionResult && (
            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase ${
                        inspectionResult.overall_status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {inspectionResult.overall_status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Contrast: {inspectionResult.contrast_ratio}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-white">{inspectionResult.visual_fidelity_score}%</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Visual Token Score
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {inspectionResult.checks.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {c.status === 'PASSED' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {c.check}
                      </div>
                      <p className="text-slate-400 text-[11px]">{c.details}</p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{c.citation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
