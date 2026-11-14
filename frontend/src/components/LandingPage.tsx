import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, GitFork, ArrowRight, Lock, 
  Sparkles, CheckCircle2, ChevronRight,
  Database, Network, Eye, LineChart
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: (targetTab?: string) => void;
  brandName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-base">BRANDTRACE</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded">
                Control Plane
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Autonomous Brand Intelligence &amp; Governance</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#features" className="hover:text-slate-900 transition-colors">Capabilities</a>
          <a href="#bdig" className="hover:text-slate-900 transition-colors">Dependency Intelligence</a>
          <a href="#architecture" className="hover:text-slate-900 transition-colors">Architecture</a>
          <a href="#trust" className="hover:text-slate-900 transition-colors">Security &amp; Trust</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onEnterApp('command-center')}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            Launch Control Plane
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 max-w-6xl mx-auto w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 mb-6 shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Brand Dependency Intelligence Graph (BDIG) Active
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6"
        >
          The Autonomous Brand Intelligence &amp; Governance Control Plane
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8 sm:mb-10"
        >
          Every brand decision connected. Every risk traceable. Every release accountable.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-12 sm:mb-16"
        >
          <button
            onClick={() => onEnterApp('bdig')}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <GitFork className="w-4 h-4 text-white" />
            Explore Dependency Graph
          </button>

          <button
            onClick={() => onEnterApp('content-studio')}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-slate-700" />
            Test Content Studio
          </button>
        </motion.div>

        {/* Live Interactive Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 text-left shadow-lg max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span className="text-xs font-mono text-slate-500 ml-2">
                BrandTrace BDIG Simulation // FACT-PRC-01 Mutation
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              Sub-second Traversal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mutated Fact</span>
              <div className="font-bold text-slate-900 text-sm">Product Subscription Price</div>
              <div className="font-mono text-xs text-rose-700 font-semibold">₹499 ➔ ₹599</div>
              <div className="text-[11px] text-slate-500">Pricing Committee Resolution</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exposed Touchpoints</span>
              <div className="font-bold text-slate-900 text-sm">4 Resources Discovered</div>
              <div className="text-[11px] text-slate-600">Meta Ads, Google PPC, Checkout, B2B PDF</div>
              <div className="text-[10px] font-bold text-amber-800">3 Departments Notified</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Release Gate</span>
              <div className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Zero Silent Overwrites
              </div>
              <div className="text-[11px] text-slate-600">Routed to Department Reviewers</div>
              <div className="text-[10px] font-mono text-slate-500">Proof: SHA256-EDT-v1</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Pillars Section */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto w-full border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Enterprise Architecture</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Engineered for Multi-Departmental Governance
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Move beyond static PDF style guides and disconnected legal review chains. BrandTrace connects strategy, creative releases, and regulatory compliance into an active intelligence graph.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
              <GitFork className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Dependency Intelligence</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Maps every advertisement, document, and website to approved facts. When a claim or price shifts, instantly traces affected touchpoints.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Multi-Agent Pipeline</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Voice &amp; Persona, Claim Truth-Set, and Regulatory Compliance agents cross-verify assets in parallel with token-level explainability.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Multimodal Inspection</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enforces logo safe-zone clearances, WCAG AA legal disclaimer contrast ratios, palette harmony, and trademark lockup standards.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Tamper-Evident Ledger</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every approved release receives an immutable SHA-256 cryptographic stamp recorded to the release ledger with zero silent republishing.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Demonstration (₹499 -> ₹599) */}
      <section id="bdig" className="py-12 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full border-t border-slate-200">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-8 lg:p-12">
          <div className="max-w-2xl mb-10 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Live Case Study</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              What Happens When Product Price Changes?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              In traditional enterprises, price updates result in weeks of misaligned ads and customer disputes. In BrandTrace, it takes 3 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Step 1: Fact Mutation</div>
              <div className="font-bold text-slate-900 text-sm">Price: ₹499 ➔ ₹599</div>
              <p className="text-slate-600 font-sans text-[11px] leading-relaxed">
                Initiated by Commercial Pricing Committee for fleet telematics tier.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Step 2: DAG Traversal</div>
              <div className="font-bold text-slate-900 text-sm">4 Downstream Assets</div>
              <p className="text-slate-600 font-sans text-[11px] leading-relaxed">
                Discovers Meta Ads, Google PPC, Pricing Web Checkout, and Sales PDF brochure.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Step 3: Task Routing</div>
              <div className="font-bold text-slate-900 text-sm">4 Revision Tasks</div>
              <p className="text-slate-600 font-sans text-[11px] leading-relaxed">
                Routes to Performance Lead, E-Commerce Director, and Sales Enablement Lead.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Step 4: Seal v2.0</div>
              <div className="font-bold text-emerald-800 text-sm">Human Sign-Off</div>
              <p className="text-slate-600 font-sans text-[11px] leading-relaxed">
                Promotes to v2.0 only after explicit authorized sign-off. Never silent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Information */}
      <section id="trust" className="py-20 px-6 max-w-6xl mx-auto w-full border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Database className="w-5 h-5 text-slate-800" />
              MongoDB Persistence
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enterprise Motor Async persistence with resilient in-memory fallback for zero-dependency offline judging and disaster recovery.
            </p>
          </div>

          <div className="space-y-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Lock className="w-5 h-5 text-slate-800" />
              Cryptographic Provenance
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every release is stamped with a SHA-256 tamper-evident digest incorporating content hashes, verified policy versions, and reviewer identity.
            </p>
          </div>

          <div className="space-y-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <LineChart className="w-5 h-5 text-slate-800" />
              Statutory Regulation Support
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pre-seeded with FTC Green Guides 16 CFR §260, EU Green Claims Directive COM/2023/166, FDA 21 CFR §202.1 Fair Balance, and Lanham Act §43(a).
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <footer className="border-t border-slate-200 py-16 px-6 bg-slate-50 text-center space-y-6">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          Ready to Connect Your Brand Intelligence?
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Evaluate the enterprise control plane in live interactive mode with pre-seeded brand graphs.
        </p>
        <button
          onClick={() => onEnterApp('command-center')}
          className="px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
          Launch BrandTrace Control Plane
        </button>
        <div className="text-[11px] text-slate-400 font-mono pt-4">
          BrandTrace AI — Enterprise Brand Intelligence & Governance Platform &bull; Apache-2.0
        </div>
      </footer>
    </div>
  );
};
