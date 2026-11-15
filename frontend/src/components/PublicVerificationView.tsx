import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, RefreshCw, AlertTriangle, HelpCircle, 
  Upload, FileText, Hash, ArrowLeft,
  Search, Lock, Check, AlertCircle, Copy
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface PublicVerificationViewProps {
  initialBrand?: string;
  onBack?: () => void;
}

type TabMode = 'text' | 'image' | 'seal';

interface VerificationResult {
  status: 'APPROVED' | 'OUTDATED' | 'MODIFIED' | 'UNKNOWN';
  is_authentic: boolean;
  ledger_state: string;
  seal_code?: string;
  brand_name?: string;
  asset_title?: string;
  approved_version?: string;
  sealed_date?: string;
  computed_hash: string;
  recorded_hash?: string;
  verification_method: string;
  explanation: string;
  disclaimer?: string;
}

export const PublicVerificationView: React.FC<PublicVerificationViewProps> = ({
  initialBrand = 'Velora Money',
  onBack
}) => {
  const [brandName, setBrandName] = useState<string>(initialBrand);
  const [activeTab, setActiveTab] = useState<TabMode>('seal');
  
  // Inputs
  const [sealCodeInput, setSealCodeInput] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSealInput, setImageSealInput] = useState<string>('');
  
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Tab 1: Check Seal
  const handleCheckSeal = async () => {
    if (!sealCodeInput.trim()) {
      setErrorMessage('Please enter a valid seal code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const data = await apiClient.publicVerification.verifySeal({
        seal_code: sealCodeInput.trim(),
        brand_id: brandName.toLowerCase().replace(/\s+/g, '-')
      });
      setResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to complete seal verification.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 2: Check Text
  const handleCheckText = async () => {
    if (!textInput.trim()) {
      setErrorMessage('Please enter or paste the content text to verify.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const data = await apiClient.publicVerification.verifyText({
        content_text: textInput.trim(),
        brand_id: brandName.toLowerCase().replace(/\s+/g, '-')
      });
      setResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to complete content text verification.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 3: Check Image
  const handleCheckImage = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select an image file (PNG, JPG, or WEBP).');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('brand_id', brandName.toLowerCase().replace(/\s+/g, '-'));
      if (imageSealInput.trim()) {
        formData.append('seal_code', imageSealInput.trim());
      }
      const data = await apiClient.publicVerification.verifyImage(formData);
      setResult(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to complete image verification.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-sans selection:bg-slate-900 selection:text-white p-3 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation / Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Application
          </button>
        )}

        {/* Top Reference Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-100/70 via-rose-50/60 to-amber-50/40 border border-purple-200/50 p-6 sm:p-8 md:p-10 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left text block */}
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold tracking-wider uppercase">
                <span className="w-4 h-0.5 bg-indigo-600 rounded-full" />
                <span>PUBLIC VERIFICATION • NO SIGN-IN NEEDED</span>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                  Is this really from <span className="text-indigo-950 underline decoration-indigo-300 decoration-wavy decoration-1">{brandName}</span>?
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Every piece {brandName} approves gets a signed seal. Paste a post, upload an image or enter a seal code. 
                BrandTrace tells you if it's <strong className="font-semibold text-emerald-800">approved</strong>, <strong className="font-semibold text-amber-800">outdated</strong>, or <strong className="font-semibold text-rose-800">modified</strong> after approval, and shows exactly what changed.
              </p>

              {/* Brand quick switcher */}
              <div className="pt-1 flex items-center gap-2 text-xs text-slate-500">
                <span>Select Brand:</span>
                <select
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="bg-white/80 border border-slate-200 rounded-md px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-none"
                >
                  <option value="Velora Money">Velora Money</option>
                  <option value="Apex Dynamics">Apex Dynamics</option>
                  <option value="Aurelle Technologies">Aurelle Technologies</option>
                  <option value="Aurelle Technologies Inc.">Aurelle Technologies Inc.</option>
                  <option value="Novus Health Solutions">Novus Health</option>
                </select>
              </div>
            </div>

            {/* Right circular status badges */}
            <div className="flex items-center gap-3 sm:gap-4 self-center lg:self-auto shrink-0">
              
              {/* APPROVED Circle */}
              <div className={`flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-all ${
                result?.status === 'APPROVED' 
                  ? 'bg-emerald-500 text-white border-emerald-600 ring-4 ring-emerald-200 shadow-md scale-105' 
                  : 'bg-emerald-500/90 text-white border-emerald-600/40 shadow-xs'
              }`}>
                <Check className="w-6 h-6 stroke-[3] mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider">APPROVED</span>
              </div>

              {/* OUTDATED Circle */}
              <div className={`flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-all ${
                result?.status === 'OUTDATED'
                  ? 'bg-amber-500 text-white border-amber-600 ring-4 ring-amber-200 shadow-md scale-105'
                  : 'bg-amber-500/90 text-white border-amber-600/40 shadow-xs'
              }`}>
                <RefreshCw className="w-5 h-5 stroke-[2.5] mb-1" />
                <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider">OUTDATED</span>
              </div>

              {/* MODIFIED Circle */}
              <div className={`flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-all ${
                result?.status === 'MODIFIED'
                  ? 'bg-rose-500 text-white border-rose-600 ring-4 ring-rose-200 shadow-md scale-105'
                  : 'bg-rose-500/90 text-white border-rose-600/40 shadow-xs'
              }`}>
                <span className="text-xl font-black leading-none mb-0.5">≠</span>
                <span className="text-[10px] sm:text-[11px] font-extrabold tracking-wider">MODIFIED</span>
              </div>
            </div>

          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Interactive Verification Studio (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
            
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => { setActiveTab('text'); setResult(null); setErrorMessage(null); }}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-white text-slate-900 border border-slate-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste text</span>
              </button>

              <button
                onClick={() => { setActiveTab('image'); setResult(null); setErrorMessage(null); }}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'image'
                    ? 'bg-white text-slate-900 border border-slate-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload an image</span>
              </button>

              <button
                onClick={() => { setActiveTab('seal'); setResult(null); setErrorMessage(null); }}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'seal'
                    ? 'bg-white text-slate-900 border border-slate-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Seal code</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* TAB CONTENT */}
            {activeTab === 'seal' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Seal code
                  </label>
                  <input
                    type="text"
                    placeholder="VLM-XXXX-XXXX or BT-SEAL-..."
                    value={sealCodeInput}
                    onChange={(e) => setSealCodeInput(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs font-mono"
                  />
                  <p className="text-[11px] text-slate-500">
                    Enter the tamper-evident seal code displayed on the published asset or certificate.
                  </p>
                </div>

                <button
                  onClick={handleCheckSeal}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Check seal
                </button>
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Marketing / Release Copy
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Paste the marketing copy, headline, social post, or press release text to verify..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500">
                    Whitespace and quote styles are ignored. Substantive alterations will be flagged.
                  </p>
                </div>

                <button
                  onClick={handleCheckText}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Check text
                </button>
              </div>
            )}

            {activeTab === 'image' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Asset Image File
                  </label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-5 text-center bg-slate-50/40 transition-colors">
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="public-image-file"
                    />
                    <label htmlFor="public-image-file" className="cursor-pointer space-y-2 block">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="text-xs text-slate-700 font-medium">
                        {selectedFile ? (
                          <span className="font-semibold text-indigo-700">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                        ) : (
                          <span>Click to upload PNG, JPG, or WEBP image</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">Max file size 25MB. Exact byte-level SHA-256 match will be computed.</p>
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Accompanying Seal Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Optional BT-SEAL-... to cross-reference hash"
                    value={imageSealInput}
                    onChange={(e) => setImageSealInput(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 shadow-2xs font-mono"
                  />
                </div>

                <button
                  onClick={handleCheckImage}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Check image
                </button>
              </div>
            )}

            {/* VERIFICATION RESULT CARD */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 pt-5 border-t border-slate-200 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Verification Outcome
                  </span>
                  
                  {/* Status Pill */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    result.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    result.status === 'OUTDATED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    result.status === 'MODIFIED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                    'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}>
                    {result.status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {result.status === 'OUTDATED' && <RefreshCw className="w-3.5 h-3.5" />}
                    {result.status === 'MODIFIED' && <AlertTriangle className="w-3.5 h-3.5" />}
                    {result.status === 'UNKNOWN' && <HelpCircle className="w-3.5 h-3.5" />}
                    <span>{result.status}</span>
                  </span>
                </div>

                {/* Explanation */}
                <div className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                  result.status === 'APPROVED' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' :
                  result.status === 'OUTDATED' ? 'bg-amber-50/70 border-amber-200 text-amber-900' :
                  result.status === 'MODIFIED' ? 'bg-rose-50/70 border-rose-200 text-rose-900' :
                  'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <p className="font-medium">{result.explanation}</p>
                  {result.disclaimer && (
                    <p className="text-[11px] mt-1.5 opacity-90 italic">
                      Notice: {result.disclaimer}
                    </p>
                  )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {result.seal_code && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Seal Code</span>
                      <span className="font-mono font-semibold text-slate-800 truncate block">{result.seal_code}</span>
                    </div>
                  )}

                  {result.approved_version && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Release Version</span>
                      <span className="font-semibold text-slate-800">{result.approved_version}</span>
                    </div>
                  )}

                  {result.asset_title && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Asset Name</span>
                      <span className="font-semibold text-slate-800 truncate block">{result.asset_title}</span>
                    </div>
                  )}

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 col-span-2 sm:col-span-3">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-mono mb-1">
                      <span>SHA-256 Digest ({result.verification_method})</span>
                      <button
                        onClick={() => handleCopyHash(result.computed_hash)}
                        className="hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <span className="font-mono text-[11px] text-slate-700 break-all select-all block">
                      {result.computed_hash}
                    </span>
                  </div>
                </div>

              </motion.div>
            )}

          </div>

          {/* Right Column: Reference "How it works" Card (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 self-start">
            <h2 className="text-base font-bold text-slate-900">
              How it works
            </h2>

            <ol className="space-y-4 text-xs text-slate-600 leading-relaxed list-none counter-reset-items">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-bold text-[11px] flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  When a reviewer approves a piece, BrandTrace signs it with SHA-256 tamper-evident digest chaining over the exact text, the image file and the version.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-bold text-[11px] flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Whitespace and quote styles are ignored. Any other change, even one digit in a price, breaks the match.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-bold text-[11px] flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Images are matched by file hash, then by visual fingerprint; near matches have their text read and compared.
                </span>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 font-bold text-[11px] flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  If a fact changes and the piece is updated, its old seal shows as outdated.
                </span>
              </li>
            </ol>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Zero-knowledge public verification. No corporate authentication required.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
