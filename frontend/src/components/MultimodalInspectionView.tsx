import React, { useState, useRef } from 'react';
import { 
  Eye, AlertTriangle, CheckCircle2, Sliders, UploadCloud, 
  FileText, Image as ImageIcon, Video, ShieldCheck, Check, Sparkles, AlertOctagon, HelpCircle
} from 'lucide-react';

interface MultimodalInspectionViewProps {
  brandId: string;
}

export const MultimodalInspectionView: React.FC<MultimodalInspectionViewProps> = ({ brandId }) => {
  const [activeTab, setActiveTab] = useState<'file_inspect' | 'token_studio'>('file_inspect');

  // File Inspection State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileInspectionReport, setFileInspectionReport] = useState<any>(null);
  const [isFileInspecting, setIsFileInspecting] = useState<boolean>(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Design Token Spec State
  const [assetTitle, setAssetTitle] = useState<string>("Q1 Billboard & Digital Display Creative Lockup");
  const [channel] = useState<string>("Digital Display / Social");
  const [primaryColor, setPrimaryColor] = useState<string>("#0F172A");
  const [accentColor, setAccentColor] = useState<string>("#06B6D4");
  const [backgroundColor, setBackgroundColor] = useState<string>("#020617");
  const [textColor, setTextColor] = useState<string>("#F8FAFC");
  const [logoPadding, setLogoPadding] = useState<number>(24);
  const [minLogoClearance] = useState<number>(20);
  const [disclaimerFontSize, setDisclaimerFontSize] = useState<number>(9.0);
  const [hasTrademarkSymbol, setHasTrademarkSymbol] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<any>(null);

  // Preset file payloads for rapid judging / demo verification
  const PRESET_FILES = [
    {
      title: "Aurelle Studio Subscription Outdated Price (TXT)",
      filename: "aurelle_studio_pricing.txt",
      mimeType: "text/plain",
      type: "TXT",
      content: "Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹499 per month. Real-time audio rendering included."
    },
    {
      title: "Aurelle Pulse Smart Ring Durability (Markdown)",
      filename: "aurelle_pulse_durability.md",
      mimeType: "text/markdown",
      type: "MD",
      content: "# Aurelle Pulse Durability Specifications\n\nCrafted with forged elements, Aurelle Pulse is 100% unbreakable and completely indestructible under any conditions."
    },
    {
      title: "Aurelle Horizon Audio Battery Claim (PDF)",
      filename: "aurelle_horizon_battery_spec.pdf",
      mimeType: "application/pdf",
      type: "PDF",
      content: "Aurelle Horizon™ Spatial Headphones deliver 72-hour battery life with active noise cancellation."
    },
    {
      title: "PR Wire Greenwashing Copy (TXT)",
      filename: "pr_wire_launch.txt",
      mimeType: "text/plain",
      type: "TXT",
      content: "Apex unveils the completely green 100% eco-friendly zero-carbon footprint supercar with hands-free autonomous highway navigation."
    },
    {
      title: "QuantumCell EPA Certification Spec (PDF)",
      filename: "quantumcell_epa_spec.pdf",
      mimeType: "application/pdf",
      type: "PDF",
      content: "Official EPA Certificate #EV-APX-982 verifies 520 miles range under standard testing conditions for Apex GT with QuantumCell™ 800V Architecture."
    }
  ];

  const handleInspectFile = async (fileToInspect: File) => {
    setIsFileInspecting(true);
    setInspectError(null);
    setFileInspectionReport(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToInspect);
      formData.append('brand_id', brandId);

      const res = await fetch('/api/multimodal/upload-and-inspect', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Inspection failed with status ${res.status}`);
      }

      const report = await res.json();
      setFileInspectionReport(report);
    } catch (e: any) {
      console.error(e);
      setInspectError(e.message || "Failed to inspect asset");
    } finally {
      setIsFileInspecting(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_FILES[0]) => {
    const blob = new Blob([preset.content], { type: preset.mimeType });
    const file = new File([blob], preset.filename, { type: preset.mimeType });
    setUploadedFile(file);
    handleInspectFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      handleInspectFile(file);
    }
  };

  const handleInspectTokens = async () => {
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

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><AlertOctagon className="w-3 h-3" /> CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><HelpCircle className="w-3 h-3" /> MEDIUM</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><Check className="w-3 h-3" /> LOW</span>;
    }
  };

  const getModalityBadge = (cat: string) => {
    switch (cat) {
      case 'TEXT_INTELLIGENCE':
        return <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1"><FileText className="w-3 h-3" /> Text Intelligence</span>;
      case 'VISUAL_INTELLIGENCE':
        return <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Visual Intelligence</span>;
      case 'VIDEO_INTELLIGENCE':
        return <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded flex items-center gap-1"><Video className="w-3 h-3" /> Video Intelligence</span>;
      case 'ACCESSIBILITY':
        return <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1"><Eye className="w-3 h-3" /> Accessibility</span>;
      default:
        return <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{cat}</span>;
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
              Multimodal Content Intelligence Workspace
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Enterprise inspection across TXT, MD, PDF, DOCX, PNG, JPG, and video frames. Discovers tone drift, unverified claims, logo clearances, and WCAG AA contrast.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('file_inspect')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'file_inspect'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Multimodal File Inspector
          </button>
          <button
            onClick={() => setActiveTab('token_studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'token_studio'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Visual Design Tokens
          </button>
        </div>
      </div>

      {activeTab === 'file_inspect' ? (
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Quick Test Artifact Presets
              </span>
              <span className="text-[11px] text-slate-500">Click any preset to run live inspection</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_FILES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-cyan-500/40 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                      {preset.type}
                    </span>
                    <span className="text-[10px] text-slate-500">{preset.filename}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    {preset.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.mp4,.mov"
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-xl p-8 cursor-pointer transition-all bg-slate-950/40 hover:bg-cyan-500/5 group"
            >
              <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-cyan-400 mx-auto mb-3 transition-colors" />
              <div className="text-sm font-bold text-white mb-1">
                Drag and drop your file here, or <span className="text-cyan-400 underline">browse</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Supported formats: <strong>Plain Text (TXT, MD)</strong>, <strong>Documents (PDF, DOCX)</strong>, <strong>Images (PNG, JPG)</strong>, and <strong>Videos (MP4, MOV)</strong>.
              </p>
              {uploadedFile && (
                <div className="mt-4 inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300">
                  <FileText className="w-3.5 h-3.5" />
                  {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {isFileInspecting && (
            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-white">Inspecting Multimodal Asset...</div>
              <p className="text-xs text-slate-400">
                Running AST text parsing, brand palette colorimetry, frame-level OpenCV analysis, and WCAG AA contrast verification.
              </p>
            </div>
          )}

          {/* Error Message */}
          {inspectError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              {inspectError}
            </div>
          )}

          {/* Inspection Report */}
          {fileInspectionReport && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{fileInspectionReport.filename}</span>
                    <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                      {fileInspectionReport.file_type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Checksum: {fileInspectionReport.sha256.substring(0, 16)}...
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Inspection completed with {fileInspectionReport.findings_count} findings across multimodal evaluation rules.
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-cyan-400">
                      {fileInspectionReport.findings_count}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Findings</div>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-emerald-400">
                      {fileInspectionReport.compliance_status || "COMPLETED"}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Pipeline Gate</div>
                  </div>
                </div>
              </div>

              {/* Finding Cards */}
              <div className="space-y-3">
                {fileInspectionReport.findings.map((f: any, idx: number) => (
                  <div key={idx} className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(f.severity)}
                        {getModalityBadge(f.category)}
                        <span className="text-xs font-bold text-white">{f.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                        <span>Location: <strong>{f.exact_location}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span>Confidence: <strong>{(f.confidence * 100).toFixed(0)}%</strong></span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {f.explanation}
                    </p>

                    {/* Source Rule Citation */}
                    {f.relevant_rule && (
                      <div className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-3 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Approved Brand Policy:</span>
                          <strong className="text-cyan-300 font-mono">{f.relevant_rule}</strong>
                        </div>
                      </div>
                    )}

                    {/* Suggested Minimal Correction */}
                    {f.suggested_correction && (
                      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-1">
                        <div className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Suggested Minimal Correction
                        </div>
                        <div className="text-slate-200 font-mono text-xs bg-slate-950/80 p-2 rounded-lg border border-emerald-500/10">
                          {f.suggested_correction}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Visual Design Tokens Studio */
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

              {/* Clearance & Typography */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Logo Padding / Safe Zone</span>
                    <span className="text-cyan-400 font-mono font-bold">{logoPadding}px (Min: {minLogoClearance}px)</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={logoPadding}
                    onChange={(e) => setLogoPadding(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Mandatory Disclaimer Font Size</span>
                    <span className="text-cyan-400 font-mono font-bold">{disclaimerFontSize} pt (Min: 8.0 pt)</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="14"
                    step="0.5"
                    value={disclaimerFontSize}
                    onChange={(e) => setDisclaimerFontSize(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300">Registered Trademark (™) in Lockup</span>
                  <input
                    type="checkbox"
                    checked={hasTrademarkSymbol}
                    onChange={(e) => setHasTrademarkSymbol(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded"
                  />
                </div>
              </div>

              <button
                onClick={handleInspectTokens}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-cyan-600/20"
              >
                {isLoading ? "Analyzing Visual Tokens..." : "Inspect Visual Specification"}
              </button>
            </div>
          </div>

          {/* Right Column: Visual Preview & Results (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Visual Simulator Frame */}
            <div 
              style={{ backgroundColor }}
              className="border border-slate-800 rounded-2xl p-6 min-h-[160px] flex flex-col justify-between transition-colors shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div 
                  style={{ padding: `${logoPadding}px`, borderColor: accentColor }}
                  className="border border-dashed rounded-lg inline-flex items-center gap-2"
                >
                  <div 
                    style={{ backgroundColor: primaryColor }}
                    className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs text-white"
                  >
                    A
                  </div>
                  <span style={{ color: textColor }} className="font-bold text-sm tracking-tight">
                    APEX DYNAMICS {hasTrademarkSymbol && "™"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest bg-slate-900/60 px-2 py-1 rounded">
                  Lockup Mock
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/40">
                <p 
                  style={{ 
                    color: textColor,
                    fontSize: `${disclaimerFontSize}pt`
                  }}
                  className="font-medium leading-tight opacity-90"
                >
                  *EPA-estimated range with QuantumCell™ Architecture. Actual figures may vary based on temperature and payload.
                </p>
              </div>
            </div>

            {/* Inspection Findings */}
            {inspectionResult && (
              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    {inspectionResult.status === "PASSED" ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        SPEC PASSED
                      </span>
                    ) : (
                      <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {inspectionResult.violations_count} VIOLATION(S)
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      WCAG AA Contrast: <strong className="text-cyan-300 font-mono">{inspectionResult.contrast_ratio}:1</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Engine: Multimodal Colorimetry v1.0
                  </span>
                </div>

                <div className="space-y-2">
                  {inspectionResult.findings.map((finding: any, idx: number) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                        finding.severity === "CRITICAL" || finding.severity === "HIGH"
                          ? "bg-red-500/10 border-red-500/20 text-red-300"
                          : "bg-slate-950 border-slate-800/80 text-slate-300"
                      }`}
                    >
                      <div className="mt-0.5">
                        {finding.severity === "CRITICAL" || finding.severity === "HIGH" ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>{finding.category}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700">
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{finding.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
