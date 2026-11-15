import React, { useEffect, useState } from 'react';
import { 
  Lock, ShieldCheck, Download, Search, CheckCircle2, AlertTriangle, 
  AlertOctagon, RefreshCw, XCircle, Shield, FileCheck
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
  const [verifyIdentifier, setVerifyIdentifier] = useState<string>('AST-AUR-01');
  const [verifyContent, setVerifyContent] = useState<string>(
    'Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included.'
  );
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Revoke & Supersede Modal State
  const [activeActionModal, setActiveActionModal] = useState<'REVOKE' | 'SUPERSEDE' | null>(null);
  const [actionTargetId, setActionTargetId] = useState<string>('');
  const [actionReason, setActionReason] = useState<string>('');
  const [newVersionLabel, setNewVersionLabel] = useState<string>('v2.0');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadLedger();
  }, [brandId]);

  const loadLedger = () => {
    setIsLoading(true);
    fetch(`/api/releases?brand_id=${brandId || 'aurelle-tech'}`)
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

  // 5 Signature Test Presets for Instant State Verification
  const VERIFY_PRESETS = [
    {
      name: '1. Valid & Unchanged (v2.0)',
      id: 'AST-AUR-01',
      content: 'Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹599 per month. Real-time audio rendering included.',
      description: 'Authentic approved Aurelle release matching immutable SHA-256 digest.'
    },
    {
      name: '2. Modified After Approval (Tampered)',
      id: 'AST-AUR-01',
      content: 'Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹499 per month. [TAMPERED_DISCOUNT_INJECTED]',
      description: 'Simulates unauthorized post-approval modification. Detects cryptographic hash mismatch.'
    },
    {
      name: '3. Superseded Release',
      id: 'AST-AUR-HIST-01',
      content: 'Unlock next-generation spatial computing with Aurelle Cloud Studio for only ₹499 per month.',
      description: 'Historical v1 release that was formally superseded by newer approved v2.0.'
    },
    {
      name: '4. Revoked Release',
      id: 'AST-AUR-RECALLED',
      content: 'Aurelle Pulse Smart Ring provides a medical-grade diagnostic cure for cardiovascular heart disease.',
      description: 'Release officially revoked by enterprise compliance for FDA §870 non-compliance.'
    },
    {
      name: '5. Unknown / Invalid Record',
      id: 'BT-SEAL-FAKE-XYZ-999',
      content: 'Unregistered marketing asset.',
      description: 'Tests detection of untracked or hallucinated release seals.'
    }
  ];

  const applyPreset = (preset: typeof VERIFY_PRESETS[0]) => {
    setVerifyIdentifier(preset.id);
    setVerifyContent(preset.content);
    handleVerifySeal(preset.id, preset.content);
  };

  const handleRevokeSubmit = async () => {
    try {
      const res = await fetch('/api/ledger/revoke-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: actionTargetId,
          revocation_reason: actionReason || 'Regulatory compliance recall',
          revoked_by: 'David Sterling, Compliance Reviewer'
        })
      });
      if (!res.ok) throw new Error('Revocation failed');
      const data = await res.json();
      setActionSuccessMsg(data.message);
      setActiveActionModal(null);
      loadLedger();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSupersedeSubmit = async () => {
    try {
      const res = await fetch('/api/ledger/supersede-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: actionTargetId,
          new_version: newVersionLabel,
          superseded_by: 'Julian Vance, VP Brand Governance'
        })
      });
      if (!res.ok) throw new Error('Superseding failed');
      const data = await res.json();
      setActionSuccessMsg(data.message);
      setActiveActionModal(null);
      loadLedger();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleExportAudit = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(releases, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `brandtrace_audit_ledger_${brandId || 'aurelle-tech'}.json`;
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
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            VALID &amp; UNCHANGED
          </span>
        );
      case 'MODIFIED_AFTER_APPROVAL':
        return (
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            MODIFIED AFTER APPROVAL (TAMPERED)
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            SUPERSEDED BY NEW RELEASE
          </span>
        );
      case 'REVOKED':
        return (
          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-400" />
            REVOKED BY COMPLIANCE
          </span>
        );
      case 'UNKNOWN_RECORD':
      default:
        return (
          <span className="bg-slate-700/40 text-slate-400 border border-slate-600 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            UNKNOWN / UNVERIFIED RECORD
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Multimodal Governance &amp; Verified Release History
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Cryptographic SHA-256 release ledger with Merkle-style block chaining. Every asset approval captures content hashes, approved versioning, source citations, and reviewer identity. Never automatically publishes without explicit human authorization.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          Export Audit Manifest JSON
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 5-STATE INTERACTIVE CRYPTOGRAPHIC VERIFIER */}
      <div className="bg-[#0B0F19] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Interactive Cryptographic Content Verifier
              </h3>
              <p className="text-[11px] text-slate-400">
                Tests and verifies immutable integrity against 5 statutory release states.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/40">
            SHA-256 MERKLE CHAIN
          </span>
        </div>

        {/* 5 One-Click Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
            Select Test Scenario to Demonstrate Integrity Verification:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {VERIFY_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => applyPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  verifyIdentifier === p.id && verifyContent === p.content
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-xs text-white mb-0.5 truncate">{p.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Record ID / Resource ID / Seal
            </label>
            <input
              type="text"
              value={verifyIdentifier}
              onChange={(e) => setVerifyIdentifier(e.target.value)}
              placeholder="e.g. AST-AUR-01 or BT-SEAL-..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>
          <div className="md:col-span-8">
            <label className="text-[11px] font-medium text-slate-400 block mb-1">
              Live Content Text to Verify Against Sealed Record
            </label>
            <input
              type="text"
              value={verifyContent}
              onChange={(e) => setVerifyContent(e.target.value)}
              placeholder="Paste content to verify..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleVerifySeal()}
            disabled={isVerifying}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-600/20"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Computing Cryptographic Digest...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Verify Integrity
              </>
            )}
          </button>
        </div>

        {/* Verification Result Card */}
        {verificationResult && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Verification Outcome:</span>
                {getVerificationStateBadge(verificationResult.state)}
              </div>
              {verificationResult.approved_version && (
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                  Version: {verificationResult.approved_version}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {verificationResult.explanation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold mb-1">
                  Computed Content Hash (SHA-256)
                </span>
                <span className="text-cyan-300 break-all">{verificationResult.computed_content_hash}</span>
              </div>
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px] uppercase font-sans font-bold mb-1">
                  Recorded Ledger Hash (SHA-256)
                </span>
                <span className="text-slate-300 break-all">
                  {verificationResult.recorded_content_hash || 'No recorded hash (Unregistered)'}
                </span>
              </div>
            </div>

            {verificationResult.relevant_sources && verificationResult.relevant_sources.length > 0 && (
              <div className="text-xs flex items-center gap-2 pt-1">
                <span className="text-slate-400">Relevant Cited Sources:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {verificationResult.relevant_sources.map((s: string, idx: number) => (
                    <span key={idx} className="bg-slate-900 text-amber-300 px-2 py-0.5 rounded border border-slate-800 font-mono text-[10px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Release Ledger Table */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Cryptographically Sealed Release Records ({releases.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by title, seal, reviewer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading immutable release records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No release records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Content ID &amp; Version</th>
                  <th className="p-3">Asset Title &amp; Channel</th>
                  <th className="p-3">Reviewer Identity</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Cryptographic Seal</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3 font-mono">
                      <span className="text-cyan-400 font-bold">{r.asset_id}</span>
                      <span className="block text-[10px] text-slate-500">
                        {r.release_id || 'v2.0'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{r.asset_title}</div>
                      <div className="text-[11px] text-slate-400">{r.channel}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-300 font-medium">{r.reviewer}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.decision === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : r.decision === 'SUPERSEDED'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {r.decision}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-amber-400">
                      {r.audit_stamp}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {r.timestamp_iso}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActionTargetId(r.asset_id);
                            setActiveActionModal('SUPERSEDE');
                          }}
                          title="Supersede with new version"
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-amber-300 border border-slate-800"
                        >
                          Supersede
                        </button>
                        <button
                          onClick={() => {
                            setActionTargetId(r.asset_id);
                            setActiveActionModal('REVOKE');
                          }}
                          title="Revoke release"
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-rose-400 border border-slate-800"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke / Supersede Modal */}
      {activeActionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              {activeActionModal === 'REVOKE' ? 'Revoke Release Record' : 'Supersede Release Record'}
            </h3>

            <div className="text-xs text-slate-300 space-y-1">
              <div>Target Record: <strong className="font-mono text-cyan-400">{actionTargetId}</strong></div>
              <p className="text-slate-400 text-[11px]">
                {activeActionModal === 'REVOKE'
                  ? 'Officially marks this release as REVOKED in the immutable audit ledger.'
                  : 'Supersedes this version with a new authorized release version.'}
              </p>
            </div>

            {activeActionModal === 'REVOKE' ? (
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Revocation Reason</label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Non-compliant pricing or regulatory recall"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">New Approved Version Label</label>
                <input
                  type="text"
                  value={newVersionLabel}
                  onChange={(e) => setNewVersionLabel(e.target.value)}
                  placeholder="e.g. v2.0-FINAL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 text-xs hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={activeActionModal === 'REVOKE' ? handleRevokeSubmit : handleSupersedeSubmit}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
