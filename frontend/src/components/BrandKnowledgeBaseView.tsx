import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Plus, CheckCircle2, X } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface BrandKnowledgeBaseViewProps {
  brandId: string;
}

export const BrandKnowledgeBaseView: React.FC<BrandKnowledgeBaseViewProps> = ({ brandId }) => {
  const [graphData, setGraphData] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  
  // Registration modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'PRICE',
    current_value: '',
    unit: '',
    description: '',
    source_citation: '',
    department_owner: 'Brand Governance Committee'
  });

  const loadGraphData = () => {
    fetch(`/api/brands/${brandId}/graph`)
      .then((res) => res.json())
      .then((data) => setGraphData(data))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadGraphData();
  }, [brandId]);

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.current_value) return;

    try {
      setIsSubmitting(true);
      await apiClient.knowledgeBase.createFact({
        workspace_id: brandId,
        org_id: brandId.includes('aurelle') ? 'ORG-AURELLE' : 'ORG-APEX',
        name: formData.name,
        category: formData.category,
        current_value: formData.current_value,
        unit: formData.unit,
        description: formData.description || `${formData.name} officially approved at ${formData.current_value}`,
        source_citation: formData.source_citation || 'Executive Governance Resolution #2026-AUT',
        department_owner: formData.department_owner
      });

      setSuccessMessage(`Approved Fact "${formData.name}" successfully registered in MongoDB Atlas & Brand Knowledge Graph!`);
      setIsModalOpen(false);
      setFormData({
        name: '',
        category: 'PRICE',
        current_value: '',
        unit: '',
        description: '',
        source_citation: '',
        department_owner: 'Brand Governance Committee'
      });
      loadGraphData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to create fact:', err);
      alert('Failed to register fact: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between text-emerald-300 text-xs shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

        <div className="flex items-center gap-3">
          {/* Register Fact CTA */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Register Approved Fact</span>
          </button>

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

      {/* Register Approved Fact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Register Approved Fact
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFact} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Fact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Horizon Watch Ultra Introductory Price"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="PRICE">PRICE</option>
                    <option value="CLAIM">CLAIM</option>
                    <option value="SPECIFICATION">SPECIFICATION</option>
                    <option value="STATUTORY">STATUTORY</option>
                    <option value="POLICY">POLICY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Approved Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹499"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Unit / Cadence</label>
                  <input
                    type="text"
                    placeholder="e.g. per month / unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Department Owner</label>
                  <input
                    type="text"
                    value={formData.department_owner}
                    onChange={(e) => setFormData({ ...formData, department_owner: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Source Citation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Pricing Committee Resolution #2026-Q1"
                  value={formData.source_citation}
                  onChange={(e) => setFormData({ ...formData, source_citation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or regulatory grounding details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Fact in MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
