import React, { useState, useRef } from 'react';
import { 
  Eye, AlertTriangle, CheckCircle2, Sliders, UploadCloud, 
  FileText, Image as ImageIcon, Video, ShieldCheck, Check, Sparkles, AlertOctagon, HelpCircle
} from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { WorkflowBanner } from './ui/WorkflowBanner';

interface MultimodalInspectionViewProps {
  brandId: string;
  onNavigate?: (tab: any) => void;
}

export const MultimodalInspectionView: React.FC<MultimodalInspectionViewProps> = ({ brandId, onNavigate }) => {
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
  const [accentColor, setAccentColor] = useState<string>("#2563EB");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [textColor, setTextColor] = useState<string>("#0F172A");
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
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"><AlertOctagon className="w-3 h-3 text-rose-600" /> CRITICAL</span>;
      case 'HIGH':
        return <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-600" /> HIGH</span>;
      case 'MEDIUM':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"><HelpCircle className="w-3 h-3 text-amber-600" /> MEDIUM</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> LOW</span>;
    }
  };

  const getModalityBadge = (cat: string) => {
    switch (cat) {
      case 'TEXT_INTELLIGENCE':
        return <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1"><FileText className="w-3 h-3 text-slate-600" /> Text Intelligence</span>;
      case 'VISUAL_INTELLIGENCE':
        return <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1"><ImageIcon className="w-3 h-3 text-slate-600" /> Visual Intelligence</span>;
      case 'VIDEO_INTELLIGENCE':
        return <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1"><Video className="w-3 h-3 text-slate-600" /> Video Intelligence</span>;
      case 'ACCESSIBILITY':
        return <span className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1"><Eye className="w-3 h-3 text-slate-600" /> Accessibility</span>;
      default:
        return <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{cat}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Multimodal Inspection"
        description="Inspect uploaded visual assets, packaging, and creative collateral against design rules and contrast guidelines."
        category="Intelligence"
        workspaceName={brandId === 'aurelle-tech' ? 'Aurelle Technologies Inc.' : brandId}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Intelligence' },
          { label: 'Multimodal Inspection', active: true }
        ]}
        helpContext={{
          summary: "Multimodal inspection parses uploaded marketing documents and analyzes visual design tokens to enforce accessibility, legal disclaimer legibility, and brand lockups.",
          terms: [
            { term: "WCAG 2.1 AA Contrast", definition: "Mandates minimum 4.5:1 text-to-background contrast ratio for statutory legibility." },
            { term: "Mandatory Disclaimer Size", definition: "Enforces 8.0pt statutory minimum type size under FTC Dot Com Disclosures Standard." },
            { term: "Logo Safe Zone", definition: "Guarantees 24px minimum clear-space padding surrounding master brand logos." },
            { term: "File Whitelist", definition: "Permits PDF, DOCX, TXT, MD, PNG, JPG, and MP4/MOV up to 25MB with malware extension screening." }
          ]
        }}
        primaryAction={{
          label: "View Campaign Intelligence",
          onClick: () => onNavigate && onNavigate('campaigns'),
          icon: <Sparkles className="w-3.5 h-3.5" />
        }}
      />

      {/* Tab Switcher & Modes */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
            Inspection Workspaces
          </span>
          <span className="text-[11px] text-slate-500">
            Switch between raw document parsing and visual design token analysis
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('file_inspect')}
            className={`px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 min-h-[36px] ${
              activeTab === 'file_inspect'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Multimodal File Inspector</span>
            <span className="sm:hidden">File Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab('token_studio')}
            className={`px-3 py-2 sm:py-1.5 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 min-h-[36px] ${
              activeTab === 'token_studio'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Visual Design Tokens</span>
            <span className="sm:hidden">Design Tokens</span>
          </button>
        </div>
      </div>

      {activeTab === 'file_inspect' ? (
        <div className="space-y-6">
          {/* Preset Buttons */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                Quick Test Artifact Presets
              </span>
              <span className="text-[11px] text-slate-500">Click any preset to run live inspection</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {PRESET_FILES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-left transition-all hover:bg-slate-100 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                      {preset.type}
                    </span>
                    <span className="text-[10px] text-slate-500">{preset.filename}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {preset.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Dropzone */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 text-center shadow-xs">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.pdf,.docx,.png,.jpg,.jpeg,.mp4,.mov"
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-4 sm:p-8 cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50"
            >
              <UploadCloud className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-900 mb-1">
                Drag and drop your file here, or <span className="underline">browse</span>
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Supported formats: <strong>Plain Text (TXT, MD)</strong>, <strong>Documents (PDF, DOCX)</strong>, <strong>Images (PNG, JPG)</strong>, and <strong>Videos (MP4, MOV)</strong>.
              </p>
              {uploadedFile && (
                <div className="mt-4 inline-flex items-center gap-2 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-800">
                  <FileText className="w-3.5 h-3.5" />
                  {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {isFileInspecting && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-900">Inspecting Multimodal Asset...</div>
              <p className="text-xs text-slate-500">
                Running AST text parsing, brand palette colorimetry, frame-level OpenCV analysis, and WCAG AA contrast verification.
              </p>
            </div>
          )}

          {/* Error Message */}
          {inspectError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              {inspectError}
            </div>
          )}

          {/* Inspection Report */}
          {fileInspectionReport && (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{fileInspectionReport.filename}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      {fileInspectionReport.file_type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Checksum: {fileInspectionReport.sha256.substring(0, 16)}...
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Inspection completed with {fileInspectionReport.findings_count} findings across multimodal evaluation rules.
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-slate-900">
                      {fileInspectionReport.findings_count}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Total Findings</div>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-emerald-700">
                      {fileInspectionReport.compliance_status || "COMPLETED"}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-slate-500">Pipeline Gate</div>
                  </div>
                </div>
              </div>

              {/* Finding Cards */}
              <div className="space-y-3">
                {fileInspectionReport.findings.map((f: any, idx: number) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(f.severity)}
                        {getModalityBadge(f.category)}
                        <span className="text-xs font-bold text-slate-900">{f.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                        <span>Location: <strong>{f.exact_location}</strong></span>
                        <span className="text-slate-300">•</span>
                        <span>Confidence: <strong>{(f.confidence * 100).toFixed(0)}%</strong></span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {f.explanation}
                    </p>

                    {/* Source Rule Citation */}
                    {f.relevant_rule && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                          <span>Approved Brand Policy:</span>
                          <strong className="text-slate-900 font-mono">{f.relevant_rule}</strong>
                        </div>
                      </div>
                    )}

                    {/* Suggested Minimal Correction */}
                    {f.suggested_correction && (
                      <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 text-xs space-y-1">
                        <div className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Suggested Minimal Correction
                        </div>
                        <div className="text-slate-900 font-mono text-xs bg-white p-2 rounded border border-emerald-200">
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
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-slate-700" />
                Creative Spec Tokens
              </h3>

              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Asset Lockup Title</label>
                <input
                  type="text"
                  value={assetTitle}
                  onChange={(e) => setAssetTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 font-medium shadow-xs"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Background Hex</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-xs">
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
                      className="w-full bg-transparent text-xs text-slate-800 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Text Color Hex</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-xs">
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
                      className="w-full bg-transparent text-xs text-slate-800 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Primary Brand Hex</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-xs">
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
                      className="w-full bg-transparent text-xs text-slate-800 font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">Accent Brand Hex</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-xs">
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
                      className="w-full bg-transparent text-xs text-slate-800 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Clearance & Typography */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Logo Padding / Safe Zone</span>
                    <span className="text-slate-900 font-mono font-bold">{logoPadding}px (Min: {minLogoClearance}px)</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={logoPadding}
                    onChange={(e) => setLogoPadding(Number(e.target.value))}
                    className="w-full accent-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">Mandatory Disclaimer Font Size</span>
                    <span className="text-slate-900 font-mono font-bold">{disclaimerFontSize} pt (Min: 8.0 pt)</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="14"
                    step="0.5"
                    value={disclaimerFontSize}
                    onChange={(e) => setDisclaimerFontSize(Number(e.target.value))}
                    className="w-full accent-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-700">Registered Trademark (™) in Lockup</span>
                  <input
                    type="checkbox"
                    checked={hasTrademarkSymbol}
                    onChange={(e) => setHasTrademarkSymbol(e.target.checked)}
                    className="w-4 h-4 accent-slate-900 rounded"
                  />
                </div>
              </div>

              <button
                onClick={handleInspectTokens}
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all disabled:opacity-50 shadow-xs cursor-pointer"
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
              className="border border-slate-200 rounded-xl p-6 min-h-[160px] flex flex-col justify-between transition-colors shadow-xs relative overflow-hidden"
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
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                  Lockup Mock
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
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
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    {inspectionResult.status === "PASSED" ? (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        SPEC PASSED
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        {inspectionResult.violations_count} VIOLATION(S)
                      </span>
                    )}
                    <span className="text-xs text-slate-600">
                      WCAG AA Contrast: <strong className="text-slate-900 font-mono">{inspectionResult.contrast_ratio}:1</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Engine: Multimodal Colorimetry v1.0
                  </span>
                </div>

                <div className="space-y-2">
                  {inspectionResult.findings.map((finding: any, idx: number) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                        finding.severity === "CRITICAL" || finding.severity === "HIGH"
                          ? "bg-rose-50 border-rose-200 text-rose-900"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="mt-0.5">
                        {finding.severity === "CRITICAL" || finding.severity === "HIGH" ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>{finding.category}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200">
                            {finding.severity}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">{finding.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Workflow Banner: Next Step in Governance Journey */}
      <WorkflowBanner
        currentStage="Multimodal Inspection"
        nextStageTitle="Campaign Intelligence"
        nextStageDescription="Track how inspected assets, social ads, and banners are organized into active marketing campaigns across your enterprise."
        nextStageActionLabel="Go to Campaign Intelligence"
        onNavigateNext={() => onNavigate && onNavigate('campaigns')}
        governanceHint="Visual tokens and disclaimer legibility compliance records are linked to the asset's permanent audit record."
      />
    </div>
  );
};
