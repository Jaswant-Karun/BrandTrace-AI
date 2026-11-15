import React, { useEffect, useState } from 'react';
import { BookOpen, Search, CheckCircle2, Stamp, Layers, Sparkles, Shield } from 'lucide-react';

interface BrandKnowledgeBaseViewProps {
  brandId: string;
}

export const BrandKnowledgeBaseView: React.FC<BrandKnowledgeBaseViewProps> = ({ brandId }) => {
  const [graphData, setGraphData] = useState<any>(null);
  const [facts, setFacts] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  useEffect(() => {
    fetch(`/api/brands/${brandId}/graph`)
      .then((res) => res.json())
      .then((data) => setGraphData(data))
      .catch((err) => console.error(err));

    fetch(`/api/facts?brand_id=${brandId}`)
      .then((res) => res.json())
      .then((data) => setFacts(data || []))
      .catch((err) => console.error(err));
  }, [brandId]);

  const allNodes = graphData?.nodes || [];

  const filteredNodes = allNodes.filter((n: any) => {
    const nodeType = n.data.nodeType;
    const matchesTab = activeTab === 'ALL' || nodeType === activeTab;
    const matchesSearch =
      search.trim() === '' ||
      n.data.label.toLowerCase().includes(search.toLowerCase()) ||
      n.data.id.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Brand Knowledge Base &amp; Truth-Set
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Source-of-truth registry: Approved commercial facts, verified laboratory claims, registered marks, and tone taxonomies.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {['ALL', 'APPROVED_FACT', 'APPROVED_CLAIM', 'TRADEMARK', 'TONE_ATTRIBUTE', 'REGULATION'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[#0B0F19] text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Knowledge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNodes.map((n: any) => {
          const d = n.data;
          const props = d.properties || {};
          return (
            <div
              key={d.id}
              className="bg-[#0B0F19] border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded">
                  {d.nodeType.replace(/_/g, ' ')}
                </span>
                <span className="text-xs font-mono text-slate-400">{d.id}</span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">{d.label}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{d.description}</p>
              </div>

              {/* Citations & Metadata */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400 font-mono">
                {props.citation && (
                  <div>
                    <span className="text-slate-400 font-sans">Citation:</span>{' '}
                    <span className="text-emerald-300">{props.citation}</span>
                  </div>
                )}
                {props.current_value && (
                  <div>
                    <span className="text-slate-400 font-sans">Approved Value:</span>{' '}
                    <span className="text-cyan-300 font-bold">{props.current_value}</span>
                  </div>
                )}
                {props.exact_mark && (
                  <div>
                    <span className="text-slate-400 font-sans">Registered Mark:</span>{' '}
                    <span className="text-purple-300 font-bold">{props.exact_mark}</span>
                  </div>
                )}
                {props.department_owner && (
                  <div>
                    <span className="text-slate-400 font-sans">Owner:</span>{' '}
                    <span className="text-slate-300">{props.department_owner}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
