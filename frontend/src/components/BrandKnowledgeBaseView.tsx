import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Plus, ExternalLink, Edit2, Flame, Calendar, Tag } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { PageHeader } from './ui/PageHeader';
import { WorkflowBanner } from './ui/WorkflowBanner';
import { EmptyState } from './ui/EmptyState';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { useToast } from './ui/ToastContext';

interface BrandKnowledgeBaseViewProps {
  brandId: string;
  onNavigate?: (tab: any) => void;
}

export const BrandKnowledgeBaseView: React.FC<BrandKnowledgeBaseViewProps> = ({ brandId, onNavigate }) => {
  const toast = useToast();
  const [graphData, setGraphData] = useState<any>(null);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  
  // Registration modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationMode, setRegistrationMode] = useState<'FACT' | 'GUIDELINE'>('FACT');
  const [formData, setFormData] = useState({
    name: '',
    category: 'PRICE',
    current_value: '',
    unit: '',
    description: '',
    source_citation: '',
    department_owner: 'Brand Governance Committee',
    source_date: '',
    expiry_date: '',
    evidence_reference: '',
    restricted_terms: '',
    required_phrases: '',
    severity: 'HIGH'
  });

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: 'PRICE',
    current_value: '',
    unit: '',
    description: '',
    source_citation: '',
    department_owner: '',
    source_date: '',
    expiry_date: '',
    evidence_reference: '',
    restricted_terms: '',
    required_phrases: ''
  });

  const loadGraphData = () => {
    fetch(`/api/brands/${brandId}/graph`)
      .then((res) => res.json())
      .then((data) => setGraphData(data))
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load brand knowledge graph data.');
      });
  };

  useEffect(() => {
    loadGraphData();
  }, [brandId]);

  const handleCreateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (registrationMode === 'FACT' && !formData.current_value)) {
      toast.warning('Please enter fact/guideline name and required value/rule.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (registrationMode === 'FACT') {
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
        
        // Also persist to API endpoint with dates and restricted terminology
        await fetch('/api/facts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: brandId,
            name: formData.name,
            category: formData.category,
            current_value: formData.current_value,
            unit: formData.unit,
            description: formData.description,
            source_citation: formData.source_citation,
            department_owner: formData.department_owner,
            source_date: formData.source_date || '2026-01-15',
            expiry_date: formData.expiry_date || undefined,
            evidence_reference: formData.evidence_reference || undefined,
            restricted_terms: formData.restricted_terms ? formData.restricted_terms.split(',').map((s) => s.trim()).filter(Boolean) : [],
            required_phrases: formData.required_phrases ? formData.required_phrases.split(',').map((s) => s.trim()).filter(Boolean) : []
          })
        });

        toast.success(`Approved Fact "${formData.name}" successfully registered in MongoDB Atlas & Brand Graph!`);
      } else {
        await fetch('/api/guidelines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: brandId,
            title: formData.name,
            category: formData.category,
            rule_statement: formData.description || formData.current_value,
            severity: formData.severity,
            source_citation: formData.source_citation,
            effective_date: formData.source_date || '2026-01-15',
            expiry_date: formData.expiry_date || undefined,
            restricted_terms: formData.restricted_terms ? formData.restricted_terms.split(',').map((s) => s.trim()).filter(Boolean) : [],
            required_phrases: formData.required_phrases ? formData.required_phrases.split(',').map((s) => s.trim()).filter(Boolean) : []
          })
        });

        toast.success(`Brand Guideline "${formData.name}" registered in MongoDB Atlas & BKG Guardrails!`);
      }

      setIsModalOpen(false);
      setFormData({
        name: '',
        category: 'PRICE',
        current_value: '',
        unit: '',
        description: '',
        source_citation: '',
        department_owner: 'Brand Governance Committee',
        source_date: '',
        expiry_date: '',
        evidence_reference: '',
        restricted_terms: '',
        required_phrases: '',
        severity: 'HIGH'
      });
      loadGraphData();
    } catch (err: any) {
      console.error('Failed to create fact/guideline:', err);
      toast.error('Failed to register: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (node: any) => {
    setEditingNode(node);
    const d = node.data || {};
    const props = d.properties || {};
    setEditFormData({
      name: d.label ? d.label.split(':')[0] : '',
      category: props.category || (d.nodeType === 'APPROVED_FACT' ? 'PRICE' : 'GUIDELINE'),
      current_value: props.current_value || (d.label && d.label.includes(':') ? d.label.split(':')[1].trim() : ''),
      unit: props.unit || '',
      description: d.description || '',
      source_citation: props.citation || props.source_citation || '',
      department_owner: props.department_owner || 'Brand Governance Committee',
      source_date: props.source_date || '2026-01-15',
      expiry_date: props.expiry_date || '',
      evidence_reference: props.evidence_reference || '',
      restricted_terms: props.restricted_terms ? props.restricted_terms.join(', ') : '',
      required_phrases: props.required_phrases ? props.required_phrases.join(', ') : ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !editFormData.current_value) {
      toast.warning('Please enter an approved value.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/facts/${editingNode.id}?brand_id=${brandId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          category: editFormData.category,
          current_value: editFormData.current_value,
          unit: editFormData.unit,
          description: editFormData.description,
          source_citation: editFormData.source_citation,
          department_owner: editFormData.department_owner,
          source_date: editFormData.source_date || undefined,
          expiry_date: editFormData.expiry_date || undefined,
          evidence_reference: editFormData.evidence_reference || undefined,
          restricted_terms: editFormData.restricted_terms ? editFormData.restricted_terms.split(',').map((s) => s.trim()).filter(Boolean) : [],
          required_phrases: editFormData.required_phrases ? editFormData.required_phrases.split(',').map((s) => s.trim()).filter(Boolean) : []
        })
      });

      if (!res.ok) throw new Error('Update failed');
      toast.success(`Fact "${editFormData.name}" updated with authorized audit trail!`);
      setIsEditModalOpen(false);
      loadGraphData();
    } catch (err: any) {
      console.error('Update failed:', err);
      toast.error('Failed to update: ' + (err.message || 'Server error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const allNodes = graphData?.nodes || [];

  const filteredNodes = allNodes.filter((n: any) => {
    const nodeType = n.data?.nodeType;
    const matchesTab = activeTab === 'ALL' || nodeType === activeTab;
    const matchesSearch =
      search.trim() === '' ||
      (n.data?.label || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.data?.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.data?.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Brand Knowledge"
        description="Manage the approved facts, rules and guidelines that your organisation uses."
        icon={<BookOpen className="w-4 h-4 text-white" />}
        category="Workspace"
        workspaceName={brandId === 'aurelle-tech' ? 'Aurelle Technologies Inc.' : brandId}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Workspace' },
          { label: 'Brand Knowledge', active: true }
        ]}
        helpContext={{
          summary: "Brand Knowledge represents certified corporate ground truth. All claims scanned in Content Intelligence are resolved against these nodes, and any changes can be simulated in the Digital Twin before committing.",
          terms: [
            { term: "Approved Fact (PRICE/SPEC)", definition: "Empirically validated corporate data, such as subscription pricing (₹499) or battery range (520 miles)." },
            { term: "Approved Claim", definition: "Legally substantiated marketing claim accompanied by statutory certification or lab test numbers." },
            { term: "Trademark Guideline", definition: "Strict typographical, casing, and symbol lockup rules for registered intellectual property." },
            { term: "Statutory Regulation", definition: "External legal mandate (FTC, FDA, Lanham Act, NHTSA) mapped into the brand guardrails." }
          ]
        }}
        primaryAction={{
          label: "Register Approved Fact",
          onClick: () => setIsModalOpen(true),
          icon: <Plus className="w-3.5 h-3.5" />
        }}
        secondaryAction={{
          label: "Simulate Mutation",
          onClick: () => onNavigate && onNavigate('impact-simulator'),
          icon: <ExternalLink className="w-3.5 h-3.5" />
        }}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-semibold text-slate-900">Certified Knowledge Repository</span>
          <Badge variant="neutral" size="sm">{filteredNodes.length} Nodes</Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search facts, guidelines, citations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto">
        {['ALL', 'APPROVED_FACT', 'APPROVED_CLAIM', 'TRADEMARK', 'TONE_ATTRIBUTE', 'REGULATION'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap text-xs ${
              activeTab === tab
                ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Knowledge Cards Grid or Empty State */}
      {filteredNodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((n: any) => {
            const d = n.data || {};
            const props = d.properties || {};
            const isFact = d.nodeType === 'APPROVED_FACT';
            return (
              <div
                key={d.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <Badge variant={isFact ? 'brand' : 'neutral'} size="sm">
                      {d.nodeType ? d.nodeType.replace(/_/g, ' ') : 'KNOWLEDGE NODE'}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">{d.id}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-1">{d.label}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{d.description}</p>
                  </div>
                </div>

                {/* Citations & Metadata */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-mono">
                  {props.citation && (
                    <div className="flex items-start gap-1">
                      <span className="text-slate-500 font-sans shrink-0">Citation:</span>
                      <span className="text-emerald-800 font-medium truncate">{props.citation}</span>
                    </div>
                  )}
                  {props.current_value && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-sans">Approved Value:</span>
                      <span className="text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        {props.current_value}
                      </span>
                    </div>
                  )}
                  {props.exact_mark && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-sans">Registered Mark:</span>
                      <span className="text-purple-800 font-bold">{props.exact_mark}</span>
                    </div>
                  )}
                  {props.source_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-500 font-sans">Source Date:</span>
                      <span className="text-slate-700 font-mono">{props.source_date}</span>
                    </div>
                  )}
                  {props.expiry_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      <span className="text-amber-700 font-sans">Expires:</span>
                      <span className="text-amber-800 font-mono">{props.expiry_date}</span>
                    </div>
                  )}
                  {props.restricted_terms && props.restricted_terms.length > 0 && (
                    <div className="flex items-start gap-1">
                      <Tag className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-rose-700 font-sans shrink-0">Restricted:</span>
                      <span className="text-rose-800 truncate">{props.restricted_terms.join(', ')}</span>
                    </div>
                  )}
                  {props.department_owner && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-sans">Owner:</span>
                      <span className="text-slate-700 font-sans">{props.department_owner}</span>
                    </div>
                  )}
                </div>

                {/* Card Action Footers */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenEdit(n)}
                    icon={<Edit2 className="w-3 h-3" />}
                  >
                    Edit Fact
                  </Button>
                  {isFact && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => onNavigate && onNavigate('impact-simulator')}
                      icon={<Flame className="w-3 h-3 text-amber-500" />}
                    >
                      Simulate
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Knowledge Nodes Match Your Filter"
          description={`No brand facts or guidelines found matching "${search || activeTab}". Try clearing your search query or registering a new approved fact.`}
          actionLabel="Register Approved Fact"
          onAction={() => setIsModalOpen(true)}
          icon={<BookOpen className="w-6 h-6 text-slate-500" />}
        />
      )}

      {/* Register Approved Fact / Guideline Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={registrationMode === 'FACT' ? 'Register Approved Brand Fact' : 'Register Brand Guideline & Policy'}
        subtitle="Adds an immutable truth node into the Brand Knowledge Graph and MongoDB Atlas."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateFact} isLoading={isSubmitting}>
              {registrationMode === 'FACT' ? 'Register Certified Fact' : 'Register Policy Guideline'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateFact} className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setRegistrationMode('FACT')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                registrationMode === 'FACT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Approved Fact (Price, Claim, Spec)
            </button>
            <button
              type="button"
              onClick={() => setRegistrationMode('GUIDELINE')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                registrationMode === 'GUIDELINE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Brand Guideline &amp; Guardrails
            </button>
          </div>

          <Input
            label={registrationMode === 'FACT' ? 'Fact Name / Identifier' : 'Guideline Title'}
            placeholder={registrationMode === 'FACT' ? 'e.g. Aurelle Cloud Studio Monthly Subscription' : 'e.g. Clean Energy Lifecycle Substantiation'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            requiredIndicator
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={registrationMode === 'FACT' ? [
                { value: 'PRICE', label: 'PRICE (Commercial)' },
                { value: 'SPECIFICATION', label: 'SPECIFICATION (Technical)' },
                { value: 'CLAIM', label: 'CLAIM (Performance)' },
                { value: 'STATUTORY', label: 'STATUTORY (Legal)' },
                { value: 'POLICY', label: 'POLICY (Corporate)' }
              ] : [
                { value: 'VOICE', label: 'VOICE & TONE' },
                { value: 'REGULATORY', label: 'REGULATORY MANDATE' },
                { value: 'TRADEMARK', label: 'TRADEMARK & TYPOGRAPHY' },
                { value: 'SUSTAINABILITY', label: 'SUSTAINABILITY (Green Guides)' }
              ]}
            />

            <Input
              label={registrationMode === 'FACT' ? 'Approved Value' : 'Primary Rule Requirement'}
              placeholder={registrationMode === 'FACT' ? 'e.g. ₹599' : 'e.g. Must state EPA-estimated'}
              value={formData.current_value}
              onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
              requiredIndicator={registrationMode === 'FACT'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Source Effective Date"
              placeholder="YYYY-MM-DD"
              value={formData.source_date}
              onChange={(e) => setFormData({ ...formData, source_date: e.target.value })}
              helperText="Date this truth node became legally effective."
            />
            <Input
              label="Expiry Date (Optional)"
              placeholder="YYYY-MM-DD"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              helperText="Set if promotional or seasonal fact."
            />
          </div>

          <Input
            label="Statutory / Legal Source Citation"
            placeholder="e.g. Executive Pricing Resolution #2026-AUT / EPA Cycle Certificate #EV-APX-982"
            value={formData.source_citation}
            onChange={(e) => setFormData({ ...formData, source_citation: e.target.value })}
            helperText="Provides statutory or corporate verification proof for multi-agent compliance audits."
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Restricted Terminology (Comma-separated)"
              placeholder="e.g. insane, miraculous, 100% cure"
              value={formData.restricted_terms}
              onChange={(e) => setFormData({ ...formData, restricted_terms: e.target.value })}
            />
            <Input
              label="Required Phrases (Comma-separated)"
              placeholder="e.g. EPA-estimated, IEC 62133"
              value={formData.required_phrases}
              onChange={(e) => setFormData({ ...formData, required_phrases: e.target.value })}
            />
          </div>

          <Input
            label="Department Owner"
            placeholder="e.g. Commercial Pricing Committee"
            value={formData.department_owner}
            onChange={(e) => setFormData({ ...formData, department_owner: e.target.value })}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              Description / Policy Scope
            </label>
            <textarea
              rows={2}
              placeholder="Detailed explanation of the certified truth condition and applicability."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </form>
      </Modal>

      {/* Edit Approved Fact Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Fact: ${editingNode?.id || ''}`}
        subtitle="Modifies certified fact attributes and writes an immutable audit event to MongoDB."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateFact} isLoading={isSubmitting}>
              Save Authorized Updates
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateFact} className="space-y-4">
          <Input
            label="Fact Name"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            requiredIndicator
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Category"
              value={editFormData.category}
              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              options={[
                { value: 'PRICE', label: 'PRICE (Commercial)' },
                { value: 'SPECIFICATION', label: 'SPECIFICATION (Technical)' },
                { value: 'CLAIM', label: 'CLAIM (Performance)' },
                { value: 'STATUTORY', label: 'STATUTORY (Legal)' },
                { value: 'POLICY', label: 'POLICY (Corporate)' }
              ]}
            />
            <Input
              label="Approved Value"
              value={editFormData.current_value}
              onChange={(e) => setEditFormData({ ...editFormData, current_value: e.target.value })}
              requiredIndicator
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Source Effective Date"
              value={editFormData.source_date}
              onChange={(e) => setEditFormData({ ...editFormData, source_date: e.target.value })}
            />
            <Input
              label="Expiry Date (Optional)"
              value={editFormData.expiry_date}
              onChange={(e) => setEditFormData({ ...editFormData, expiry_date: e.target.value })}
            />
          </div>

          <Input
            label="Statutory / Legal Source Citation"
            value={editFormData.source_citation}
            onChange={(e) => setEditFormData({ ...editFormData, source_citation: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Restricted Terminology (Comma-separated)"
              value={editFormData.restricted_terms}
              onChange={(e) => setEditFormData({ ...editFormData, restricted_terms: e.target.value })}
            />
            <Input
              label="Required Phrases (Comma-separated)"
              value={editFormData.required_phrases}
              onChange={(e) => setEditFormData({ ...editFormData, required_phrases: e.target.value })}
            />
          </div>

          <Input
            label="Department Owner"
            value={editFormData.department_owner}
            onChange={(e) => setEditFormData({ ...editFormData, department_owner: e.target.value })}
          />

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              Description
            </label>
            <textarea
              rows={2}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 text-slate-900 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </form>
      </Modal>

      {/* Workflow Banner: Next Step in Governance Journey */}
      <WorkflowBanner
        currentStage="Brand Knowledge"
        nextStageTitle="Content Intelligence (Multi-Agent Inspection)"
        nextStageDescription="Now that you know what your brand allows, submit marketing copy to detect claims, tone violations, and missing qualifiers."
        nextStageActionLabel="Proceed to Content Intelligence"
        onNavigateNext={() => onNavigate && onNavigate('content-studio')}
        governanceHint="Content intelligence inspects copy against these approved facts in under 800ms with token-level citations."
      />
    </div>
  );
};
