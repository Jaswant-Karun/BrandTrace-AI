import React, { useEffect, useState } from 'react';
import { 
  Lock, ShieldCheck, Download, Search, CheckCircle2, AlertTriangle, 
  AlertOctagon, RefreshCw, XCircle, Shield, FileCheck
} from 'lucide-react';
import { ReleaseLedgerEntry } from '../types';
import { PageHeader } from './ui/PageHeader';

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
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            VALID &amp; UNCHANGED
          </span>
        );
      case 'MODIFIED_AFTER_APPROVAL':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            MODIFIED AFTER APPROVAL (TAMPERED)
          </span>
        );
      case 'SUPERSEDED':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-amber-600" />
            SUPERSEDED BY NEW RELEASE
          </span>
        );
      case 'REVOKED':
        return (
          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-600" />
            REVOKED BY COMPLIANCE
          </span>
        );
      case 'UNKNOWN_RECORD':
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            UNKNOWN / UNVERIFIED RECORD
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Trust & Audit Ledger"
        description="Immutable record of approved releases with SHA-256 cryptographic proof digests. Use the interactive 5-state verifier to test for tampering or revocation."
        category="Cryptographic Assurance"
        workspaceName={brandId || 'aurelle-tech'}
        primaryAction={{
          label: "Export Audit Manifest JSON",
          onClick: handleExportAudit,
          icon: <Download className="w-3.5 h-3.5" />
        }}
      />

      {actionSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <span className="font-medium">{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 cursor-pointer">✕</button>
        </div>
      )}

      {/* 5-STATE INTERACTIVE CRYPTOGRAPHIC VERIFIER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-800" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Interactive Cryptographic Content Verifier
              </h3>
              <p className="text-[11px] text-slate-500">
                Tests and verifies immutable integrity against 5 statutory release states.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
            SHA-256 MERKLE CHAIN
          </span>
        </div>

        {/* 5 One-Click Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Select Test Scenario to Demonstrate Integrity Verification:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {VERIFY_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => applyPreset(p)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  verifyIdentifier === p.id && verifyContent === p.content
                    ? 'bg-slate-100 border-slate-300 ring-1 ring-slate-400 text-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="font-semibold text-xs text-slate-900 mb-0.5 truncate">{p.name}</div>
                <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{p.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Record ID / Resource ID / Seal
            </label>
            <input
              type="text"
              value={verifyIdentifier}
              onChange={(e) => setVerifyIdentifier(e.target.value)}
              placeholder="e.g. AST-AUR-01 or BT-SEAL-..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400 shadow-xs"
            />
          </div>
          <div className="md:col-span-8">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Live Content Text to Verify Against Sealed Record
            </label>
            <input
              type="text"
              value={verifyContent}
              onChange={(e) => setVerifyContent(e.target.value)}
              placeholder="Paste content to verify..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => handleVerifySeal()}
            disabled={isVerifying}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isVerifying ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Verification Outcome:</span>
                {getVerificationStateBadge(verificationResult.state)}
              </div>
              {verificationResult.approved_version && (
                <span className="text-xs font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Version: {verificationResult.approved_version}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
              {verificationResult.explanation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold mb-1">
                  Computed Content Hash (SHA-256)
                </span>
                <span className="text-slate-900 font-semibold break-all">{verificationResult.computed_content_hash}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold mb-1">
                  Recorded Ledger Hash (SHA-256)
                </span>
                <span className="text-slate-900 font-semibold break-all">
                  {verificationResult.recorded_content_hash || 'No recorded hash (Unregistered)'}
                </span>
              </div>
            </div>

            {verificationResult.relevant_sources && verificationResult.relevant_sources.length > 0 && (
              <div className="text-xs flex items-center gap-2 pt-1">
                <span className="text-slate-500">Relevant Cited Sources:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {verificationResult.relevant_sources.map((s: string, idx: number) => (
                    <span key={idx} className="bg-white text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-mono text-[10px]">
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
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-800" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
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
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-400 w-64 shadow-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading immutable release records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No release records found.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 font-sans">
                {filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono">
                      <span className="text-slate-900 font-bold">{r.asset_id}</span>
                      <span className="block text-[10px] text-slate-500">
                        {r.release_id || 'v2.0'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{r.asset_title}</div>
                      <div className="text-[11px] text-slate-500">{r.channel}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-700 font-medium">{r.reviewer}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.decision === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : r.decision === 'SUPERSEDED'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {r.decision}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-700">
                      {r.audit_stamp}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
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
                          className="px-2 py-1 rounded-md bg-white hover:bg-slate-50 text-[10px] font-semibold text-amber-800 border border-slate-200 shadow-xs cursor-pointer"
                        >
                          Supersede
                        </button>
                        <button
                          onClick={() => {
                            setActionTargetId(r.asset_id);
                            setActiveActionModal('REVOKE');
                          }}
                          title="Revoke release"
                          className="px-2 py-1 rounded-md bg-white hover:bg-slate-50 text-[10px] font-semibold text-rose-700 border border-slate-200 shadow-xs cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-slate-800" />
              {activeActionModal === 'REVOKE' ? 'Revoke Release Record' : 'Supersede Release Record'}
            </h3>

            <div className="text-xs text-slate-600 space-y-1">
              <div>Target Record: <strong className="font-mono text-slate-900">{actionTargetId}</strong></div>
              <p className="text-slate-500 text-[11px]">
                {activeActionModal === 'REVOKE'
                  ? 'Officially marks this release as REVOKED in the immutable audit ledger.'
                  : 'Supersedes this version with a new authorized release version.'}
              </p>
            </div>

            {activeActionModal === 'REVOKE' ? (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Revocation Reason</label>
                <input
                  type="text"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Non-compliant pricing or regulatory recall"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400 shadow-xs"
                />
              </div>
            ) : (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">New Approved Version Label</label>
                <input
                  type="text"
                  value={newVersionLabel}
                  onChange={(e) => setNewVersionLabel(e.target.value)}
                  placeholder="e.g. v2.0-FINAL"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-400 shadow-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveActionModal(null)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={activeActionModal === 'REVOKE' ? handleRevokeSubmit : handleSupersedeSubmit}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer shadow-xs"
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
