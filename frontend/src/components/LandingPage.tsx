import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck, GitFork, ArrowRight, Lock, 
  Sparkles, Layers, FileCheck, CheckCircle2, ChevronRight,
  Database, Network, Eye, LineChart
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: (targetTab?: string) => void;
  brandName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 bg-[#0B0F19]/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white text-base">BRANDTRACE</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                Control Plane
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous Brand Intelligence & Governance</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
          <a href="#bdig" className="hover:text-white transition-colors">Dependency Intelligence</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#trust" className="hover:text-white transition-colors">Security & Trust</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onEnterApp('command-center')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            Launch Control Plane
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-6xl mx-auto w-full text-center overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 mb-6 shadow-md"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Brand Dependency Intelligence Graph (BDIG) Active
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] max-w-4xl mx-auto mb-6"
        >
          The Autonomous Brand Intelligence &amp; Governance Control Plane
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed mb-10"
        >
          <em>Every brand decision connected. Every risk traceable. Every release accountable.</em>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={() => onEnterApp('bdig')}
            className="px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-sm hover:bg-slate-100 flex items-center gap-2 shadow-xl shadow-white/10 transition-all cursor-pointer"
          >
            <GitFork className="w-4 h-4 text-blue-600" />
            Explore Dependency Graph
          </button>

          <button
            onClick={() => onEnterApp('content-studio')}
            className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Test Content Studio
          </button>
        </motion.div>

        {/* Live Interactive Preview Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-left shadow-2xl shadow-black/80 max-w-4xl mx-auto backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">
                BrandTrace BDIG Simulation // FACT-PRC-01 Mutation
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
              Sub-second Traversal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mutated Fact</span>
              <div className="font-bold text-white text-sm">Product Subscription Price</div>
              <div className="font-mono text-xs text-rose-400 font-semibold">₹499 ➔ ₹599</div>
              <div className="text-[11px] text-slate-400">Pricing Committee Resolution</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exposed Touchpoints</span>
              <div className="font-bold text-white text-sm">4 Resources Discovered</div>
              <div className="text-[11px] text-slate-300">Meta Ads, Google PPC, Checkout, B2B PDF</div>
              <div className="text-[10px] font-bold text-amber-400">3 Departments Notified</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Release Gate</span>
              <div className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Zero Silent Overwrites
              </div>
              <div className="text-[11px] text-slate-300">Routed to Department Reviewers</div>
              <div className="text-[10px] font-mono text-cyan-400">Proof: SHA256-EDT-v1</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Pillars Section */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto w-full border-t border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Enterprise Architecture</h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered for Multi-Departmental Governance
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Move beyond static PDF style guides and disconnected legal review chains. BrandTrace connects strategy, creative releases, and regulatory compliance into an active intelligence graph.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <GitFork className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Dependency Intelligence</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maps every advertisement, document, and website to approved facts. When a claim or price shifts, instantly traces affected touchpoints.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Network className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Multi-Agent Pipeline</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Voice &amp; Persona, Claim Truth-Set, and Regulatory Compliance agents cross-verify assets in parallel with token-level explainability.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Multimodal Inspection</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforces logo safe-zone clearances, WCAG AA legal disclaimer contrast ratios, palette harmony, and trademark lockup standards.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B0F19] border border-slate-800/80 hover:border-slate-700 transition-all space-y-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Tamper-Evident Ledger</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every approved release receives an immutable SHA-256 cryptographic stamp recorded to the release ledger with zero silent republishing.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Demonstration (₹499 -> ₹599) */}
      <section id="bdig" className="py-20 px-6 max-w-6xl mx-auto w-full border-t border-slate-800/80">
        <div className="bg-[#0B0F19] border border-slate-800/80 rounded-3xl p-8 lg:p-12">
          <div className="max-w-2xl mb-10 space-y-2">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Live Case Study</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              What Happens When Product Price Changes?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              In traditional enterprises, price updates result in weeks of misaligned ads and customer disputes. In BrandTrace, it takes 3 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Step 1: Fact Mutation</div>
              <div className="font-bold text-white text-sm">Price: ₹499 ➔ ₹599</div>
              <p className="text-slate-400 font-sans text-[11px]">
                Initiated by Commercial Pricing Committee for fleet telematics tier.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Step 2: DAG Traversal</div>
              <div className="font-bold text-cyan-400 text-sm">4 Downstream Assets</div>
              <p className="text-slate-400 font-sans text-[11px]">
                Discovers Meta Ads, Google PPC, Pricing Web Checkout, and Sales PDF brochure.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Step 3: Task Routing</div>
              <div className="font-bold text-amber-400 text-sm">4 Revision Tasks</div>
              <p className="text-slate-400 font-sans text-[11px]">
                Routes to Performance Lead, E-Commerce Director, and Sales Enablement Lead.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Step 4: Seal v2.0</div>
              <div className="font-bold text-emerald-400 text-sm">Human Sign-Off</div>
              <p className="text-slate-400 font-sans text-[11px]">
                Promotes to v2.0 only after explicit authorized sign-off. Never silent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust Information */}
      <section id="trust" className="py-20 px-6 max-w-6xl mx-auto w-full border-t border-slate-800/80">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Database className="w-5 h-5 text-emerald-400" />
              MongoDB Persistence
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise Motor Async persistence with resilient in-memory fallback for zero-dependency offline judging and disaster recovery.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Lock className="w-5 h-5 text-blue-400" />
              Cryptographic Provenance
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every release is stamped with a SHA-256 tamper-evident digest incorporating content hashes, verified policy versions, and reviewer identity.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <LineChart className="w-5 h-5 text-cyan-400" />
              Statutory Regulation Support
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pre-seeded with FTC Green Guides 16 CFR §260, EU Green Claims Directive COM/2023/166, FDA 21 CFR §202.1 Fair Balance, and Lanham Act §43(a).
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <footer className="border-t border-slate-800/80 py-16 px-6 bg-[#0B0F19] text-center space-y-6">
        <h3 className="text-2xl font-bold text-white tracking-tight">
          Ready to Connect Your Brand Intelligence?
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Evaluate the enterprise control plane in live interactive mode with pre-seeded brand graphs.
        </p>
        <button
          onClick={() => onEnterApp('command-center')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          Launch BrandTrace Control Plane
        </button>
        <div className="text-[11px] text-slate-400 font-mono pt-4">
          BrandTrace AI — International AI Hackathon Submission &bull; Apache-2.0
        </div>
      </footer>
    </div>
  );
};
