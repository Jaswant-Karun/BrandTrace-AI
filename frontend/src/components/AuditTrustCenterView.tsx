import React, { useEffect, useState } from 'react';
import { 
  Lock, ShieldCheck, Download, Search, CheckCircle2, AlertTriangle, 
  Key, AlertOctagon, RefreshCw, Sparkles, Check, XCircle, FileText
} from 'lucide-react';
import { ReleaseLedgerEntry } from '../types';

interface AuditTrustCenterViewProps {
  brandId: string;
}

export const AuditTrustCenterView: React.FC<AuditTrustCenterViewProps> = ({ brandId }) => {
  const [releases, setReleases] = useState<ReleaseLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Interactive Cryptographic Verification Tool
  const [verifyIdentifier, setVerifyIdentifier] = useState<string>('AST-01');
  const [verifyContent, setVerifyContent] = useState<string>('520 Miles of Zero Compromise. Powered by QuantumCell™ 800V Architecture. The Apex GT arrives.');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    loadLedger();
  }, [brandId]);

  const loadLedger = () => {
    setIsLoading(true);
    fetch(`/api/releases?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => {
        setReleases(data || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handleVerifySeal = async (idToTest?: string, contentToTest?: string) => {
    const id = idToTest !== undefined ? idToTest : verifyIdentifier;
    const content = contentToTest !== undefined ? contentToTest : verifyContent;
    
    if (!id.trim()) return;
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/ledger/verify-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: id,
          content_to_test: content.trim() ? content : null
        })
      });
      if (!res.ok) throw new Error('Verification failed');
      const data = await res.json();
      setVerificationResult(data);
    } catch (e: any) {
      console.error(e);
      setVerificationResult({
        state: 'ERROR',
        is_authentic: false,
        explanation: e.message || 'Verification endpoint call failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportAudit = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(releases, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `brandtrace_audit_ledger_${brandId}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const filtered = releases.filter(
    (r) =>
      r.asset_title.toLowerCase().includes(search.toLowerCase()) ||
      r.audit_stamp.toLowerCase().includes(search.toLowerCase()) ||
      r.reviewer.toLowerCase().includes(search.toLowerCase())
  );

  const getVerificationStateBadge = (state: string) => {
    switch (state) {
      case 'VALID_UNCHANGED':
        return (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            VALID &amp; UNCHANGED
          </span>
        );
      case 'MODIFIED_AFTER_APPROVAL':
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />
            MODIFIED AFTER APPROVAL (TAMPERED)
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            SUPERSEDED BY NEW RELEASE
          </span>
        );
      case 'REVOKED':
        return (
          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            REVOKED
          </span>
        );
      case 'UNKNOWN_RECORD':
      default:
        return (
          <span className="bg-slate-700/40 text-slate-400 border border-slate-600 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            UNKNOWN RECORD
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Immutable Audit &amp; Trust Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Verifiable release ledger with cryptographic SHA-256 digest chains. Records user identity, approval decisions, previous &amp; updated versions, and tamper detection.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          Export Audit Manifest JSON
        </button>
      </div>

      {/* Truthful Cryptographic Disclosure */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-400 flex items-start gap-2.5">
        <Key className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-300">Cryptographic Integrity Model:</strong> BrandTrace release manifests utilize internal SHA-256 Merkle-style digest chains over canonical JSON manifests. This provides verifiable tamper detection against unauthorized database mutation, distinguishing genuine approved copies from altered or superseded records without claiming external third-party PKI certification.
        </div>
      </div>

      {/* Interactive 5-State Verification Tool */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Cryptographic Content Seal Verifier (5-State Engine)
          </h3>
          <span className="text-[11px] font-mono text-slate-500">Live SHA-256 Ledger Traversal</span>
        </div>

        {/* Quick Test State Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            Demo Verification Scenarios:
          </span>
          <button
            onClick={() => {
              setVerifyIdentifier('AST-01');
              setVerifyContent('520 Miles of Zero Compromise. Powered by QuantumCell™ 800V Architecture. The Apex GT arrives.');
              handleVerifySeal('AST-01', '520 Miles of Zero Compromise. Powered by QuantumCell™ 800V Architecture. The Apex GT arrives.');
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all font-medium"
          >
            1. Valid &amp; Unchanged Copy
          </button>
          <button
            onClick={() => {
              setVerifyIdentifier('AST-01');
              setVerifyContent('TAMPERED COPY: 700 Miles of Unapproved Range with Zero Verification.');
              handleVerifySeal('AST-01', 'TAMPERED COPY: 700 Miles of Unapproved Range with Zero Verification.');
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all font-medium"
          >
            2. Modified After Approval (Tampered)
          </button>
          <button
            onClick={() => {
              setVerifyIdentifier('SUPERSEDED-AST-PRC-V1');
              setVerifyContent('Apex Connect Monthly is ₹499/mo.');
              handleVerifySeal('SUPERSEDED-AST-PRC-V1', 'Apex Connect Monthly is ₹499/mo.');
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all font-medium"
          >
            3. Superseded Version
          </button>
          <button
            onClick={() => {
              setVerifyIdentifier('UNKNOWN-SEAL-XYZ');
              setVerifyContent('Random unverified text string');
              handleVerifySeal('UNKNOWN-SEAL-XYZ', 'Random unverified text string');
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all font-medium"
          >
            4. Unknown Record
          </button>
        </div>

        {/* Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="text-xs text-slate-400 font-medium block mb-1">
              Resource ID or Audit Hash
            </label>
            <input
              type="text"
              value={verifyIdentifier}
              onChange={(e) => setVerifyIdentifier(e.target.value)}
              placeholder="e.g. AST-01 or BT-SEAL-..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-6">
            <label className="text-xs text-slate-400 font-medium block mb-1">
              Live Release Content to Test (Checks for In-Flight Mutation)
            </label>
            <input
              type="text"
              value={verifyContent}
              onChange={(e) => setVerifyContent(e.target.value)}
              placeholder="Enter text payload to compare against recorded SHA-256 seal"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => handleVerifySeal()}
              disabled={isVerifying}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Hashing...
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Result Display */}
        {verificationResult && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                {getVerificationStateBadge(verificationResult.state)}
                <span className="text-xs font-bold text-white">
                  {verificationResult.resource_id ? `Resource: ${verificationResult.resource_id}` : 'Seal Lookup Result'}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Authentic Release Gate: <strong className={verificationResult.is_authentic ? 'text-emerald-400' : 'text-red-400'}>
                  {verificationResult.is_authentic ? 'VERIFIED_AUTHENTIC' : 'VERIFICATION_FAILED'}
                </strong>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {verificationResult.explanation}
            </p>

            {/* Hash Comparison Table */}
            {verificationResult.recorded_sha256 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono pt-1">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Recorded Ledger Hash:</div>
                  <div className="text-cyan-300 break-all">{verificationResult.recorded_sha256}</div>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Computed Content Hash:</div>
                  <div className={verificationResult.is_authentic ? 'text-emerald-300 break-all' : 'text-red-400 break-all font-bold'}>
                    {verificationResult.computed_sha256 || 'N/A (Identical)'}
                  </div>
                </div>
              </div>
            )}

            {verificationResult.user_identity && (
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Signer: <strong className="text-slate-200">{verificationResult.user_identity}</strong></span>
                <span>Role: <strong className="text-slate-200">{verificationResult.user_role}</strong></span>
                <span>Decision: <strong className="text-emerald-300 font-mono">{verificationResult.approval_decision}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Cryptographic Release Manifests
            </span>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {releases.length} Sealed Entries
            </span>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search release title, reviewer, stamp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Ledger Rows */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading ledger manifests from database...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No matching release records found.</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map((item, idx) => (
              <div key={idx} className="p-4 hover:bg-slate-900/40 transition-colors space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.asset_title}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                      {item.asset_id}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">{item.channel}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                      {item.decision}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(item.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-serif italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  "{item.content}"
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2 pt-1">
                  <div>
                    Reviewer: <strong className="text-slate-200">{item.reviewer}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <Lock className="w-3 h-3" />
                    <span>Seal: {item.audit_stamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
