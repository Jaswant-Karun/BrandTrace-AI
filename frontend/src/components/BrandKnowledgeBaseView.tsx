import React, { useEffect, useState } from 'react';
import { 
  BookOpen, Search, Plus, ExternalLink, Edit2, Flame, Calendar, Tag,
  FileText, Upload, Globe, Trash2, History, CheckCircle2,
  AlertTriangle, FileUp, Layers, Lock, ShieldCheck, ChevronDown, 
  ChevronUp, RefreshCw, Check
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { PageHeader } from './ui/PageHeader';
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

const formatDateSafe = (dateVal: any): string => {
  if (!dateVal) return 'Today';
  try {
    if (typeof dateVal === 'number') {
      const d = new Date(dateVal);
      return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : 'Today';
    }
    if (typeof dateVal === 'string') {
      if (dateVal.includes('T')) return dateVal.split('T')[0];
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
      return dateVal;
    }
    if (dateVal instanceof Date) {
      return !isNaN(dateVal.getTime()) ? dateVal.toISOString().split('T')[0] : 'Today';
    }
  } catch {
    return 'Today';
  }
  return 'Today';
};

export const BrandKnowledgeBaseView: React.FC<BrandKnowledgeBaseViewProps> = ({ brandId, onNavigate }) => {
  const toast = useToast();
  
  // Top-level View Mode: Brand Documents Studio vs Certified Graph Nodes
  const [activeStudioView, setActiveStudioView] = useState<'DOCUMENTS' | 'GRAPH_NODES'>('DOCUMENTS');

  // ==========================================
  // PHASE 4A: BRAND DOCUMENTS STATE
  // ==========================================
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [docSearch, setDocSearch] = useState<string>('');
  const [docFilter, setDocFilter] = useState<'ALL' | 'CUSTOM' | 'DEMO'>('ALL');
  const [docCategory, setDocCategory] = useState<string>('ALL');
  const [expandedDocIds, setExpandedDocIds] = useState<Set<string>>(new Set());

  // Create Document Modal
  const [isCreateDocModalOpen, setIsCreateDocModalOpen] = useState<boolean>(false);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState<boolean>(false);
  const [createDocForm, setCreateDocForm] = useState({
    title: '',
    category: 'BRAND_GUIDELINES',
    description: '',
    raw_content: ''
  });

  // Upload Document Modal
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState<boolean>(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadDocForm, setUploadDocForm] = useState({
    title: '',
    category: 'BRAND_GUIDELINES',
    description: ''
  });

  // Website Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importUrl, setImportUrl] = useState<string>('');
  const [isFetchingPreview, setIsFetchingPreview] = useState<boolean>(false);
  const [websitePreview, setWebsitePreview] = useState<any | null>(null);
  const [importCategory, setImportCategory] = useState<string>('BRAND_GUIDELINES');

  // Edit Document Modal
  const [isEditDocModalOpen, setIsEditDocModalOpen] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editDocForm, setEditDocForm] = useState({
    title: '',
    category: 'BRAND_GUIDELINES',
    description: '',
    raw_content: '',
    change_summary: ''
  });

  // Version History Modal
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);
  const [versionDoc, setVersionDoc] = useState<any | null>(null);
  const [versionList, setVersionList] = useState<any[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState<boolean>(false);

  // Delete Document Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [docToDelete, setDocToDelete] = useState<any | null>(null);

  // ==========================================
  // EXISTING GRAPH NODES STATE (PRESERVED)
  // ==========================================
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

  // ==========================================
  // DATA LOADERS
  // ==========================================
  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await apiClient.documents.list({
        workspace_id: brandId
      });
      setDocuments(docs || []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      toast.error('Failed to load brand documents.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

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
    loadDocuments();
    loadGraphData();
  }, [brandId]);

  const toggleExpandDoc = (id: string) => {
    setExpandedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ==========================================
  // DOCUMENT STUDIO HANDLERS
  // ==========================================

  // 1. Create Document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createDocForm.title.trim() || !createDocForm.raw_content.trim()) {
      toast.warning('Document title and content are required.');
      return;
    }

    setIsSubmittingDoc(true);
    try {
      await apiClient.documents.create({
        workspace_id: brandId,
        org_id: brandId.includes('aurelle') ? 'ORG-AURELLE' : 'ORG-APEX',
        title: createDocForm.title.trim(),
        category: createDocForm.category,
        description: createDocForm.description.trim(),
        raw_content: createDocForm.raw_content.trim()
      });

      toast.success(`Document "${createDocForm.title}" created & indexed into knowledge base!`);
      setIsCreateDocModalOpen(false);
      setCreateDocForm({
        title: '',
        category: 'BRAND_GUIDELINES',
        description: '',
        raw_content: ''
      });
      await loadDocuments();
      loadGraphData();
    } catch (err: any) {
      console.error('Create document error:', err);
      toast.error(err.message || 'Failed to create document.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // 2. Upload Document
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFile) {
      toast.warning('Please select a file to upload (PDF, DOCX, TXT, or MD).');
      return;
    }

    setIsSubmittingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedUploadFile);
      formData.append('workspace_id', brandId);
      formData.append('org_id', brandId.includes('aurelle') ? 'ORG-AURELLE' : 'ORG-APEX');
      formData.append('title', uploadDocForm.title.trim() || selectedUploadFile.name);
      formData.append('category', uploadDocForm.category);
      formData.append('description', uploadDocForm.description.trim());

      const res = await apiClient.documents.upload(formData);
      toast.success(`File "${selectedUploadFile.name}" parsed and indexed successfully (Status: ${res.processing_status})!`);
      setIsUploadDocModalOpen(false);
      setSelectedUploadFile(null);
      setUploadDocForm({ title: '', category: 'BRAND_GUIDELINES', description: '' });
      await loadDocuments();
      loadGraphData();
    } catch (err: any) {
      console.error('Upload document error:', err);
      toast.error(err.message || 'Failed to upload document.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // 3. Website Import Preview & Commit
  const handleFetchWebsitePreview = async () => {
    if (!importUrl.trim()) {
      toast.warning('Please enter a public website URL to import.');
      return;
    }

    setIsFetchingPreview(true);
    try {
      const preview = await apiClient.documents.importWebsitePreview({
        url: importUrl.trim(),
        workspace_id: brandId,
        org_id: brandId.includes('aurelle') ? 'ORG-AURELLE' : 'ORG-APEX'
      });
      setWebsitePreview(preview);
      toast.success('Website content fetched safely. Please review before committing.');
    } catch (err: any) {
      console.error('Fetch website preview error:', err);
      toast.error(err.message || 'Failed to fetch website URL.');
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleCommitWebsiteImport = async () => {
    if (!websitePreview) return;

    setIsSubmittingDoc(true);
    try {
      await apiClient.documents.importWebsiteCommit({
        workspace_id: brandId,
        org_id: brandId.includes('aurelle') ? 'ORG-AURELLE' : 'ORG-APEX',
        url: websitePreview.url,
        title: websitePreview.title || 'Imported Brand Web Page',
        category: importCategory,
        description: websitePreview.description || `Imported content from ${websitePreview.url}`,
        raw_content: websitePreview.extracted_content
      });

      toast.success('Website content committed & indexed into knowledge base!');
      setIsImportModalOpen(false);
      setWebsitePreview(null);
      setImportUrl('');
      await loadDocuments();
      loadGraphData();
    } catch (err: any) {
      console.error('Commit website error:', err);
      toast.error(err.message || 'Failed to commit website content.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // 4. Edit Document
  const handleOpenEditDoc = (doc: any) => {
    if (doc.is_demo) {
      toast.warning('Demo benchmark documents are protected and cannot be modified.');
      return;
    }
    setEditingDoc(doc);
    setEditDocForm({
      title: doc.title,
      category: doc.category,
      description: doc.description,
      raw_content: doc.raw_content,
      change_summary: `Updated version from v${doc.version_number}`
    });
    setIsEditDocModalOpen(true);
  };

  const handleSaveEditDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    setIsSubmittingDoc(true);
    try {
      await apiClient.documents.update(editingDoc.doc_id, {
        title: editDocForm.title.trim(),
        category: editDocForm.category,
        description: editDocForm.description.trim(),
        raw_content: editDocForm.raw_content.trim(),
        change_summary: editDocForm.change_summary.trim()
      });

      toast.success(`Document updated! Previous version archived and version bumped.`);
      setIsEditDocModalOpen(false);
      setEditingDoc(null);
      await loadDocuments();
      loadGraphData();
    } catch (err: any) {
      console.error('Update doc error:', err);
      toast.error(err.message || 'Failed to update document.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // 5. Version History
  const handleOpenVersions = async (doc: any) => {
    setVersionDoc(doc);
    setIsVersionModalOpen(true);
    setIsLoadingVersions(true);
    try {
      const versions = await apiClient.documents.getVersions(doc.doc_id);
      setVersionList(versions || []);
    } catch (err: any) {
      console.error('Failed to load versions:', err);
      toast.error('Failed to retrieve version history.');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // 6. Delete Document
  const handleOpenDeleteDoc = (doc: any) => {
    if (doc.is_demo) {
      toast.warning('Demo benchmark documents are protected and cannot be deleted.');
      return;
    }
    setDocToDelete(doc);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return;
    setIsSubmittingDoc(true);
    try {
      await apiClient.documents.delete(docToDelete.doc_id);
      toast.success(`Document "${docToDelete.title}" and associated embeddings removed.`);
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
      await loadDocuments();
      loadGraphData();
    } catch (err: any) {
      console.error('Delete doc error:', err);
      toast.error(err.message || 'Failed to delete document.');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    // Mode filter
    if (docFilter === 'CUSTOM' && doc.is_demo) return false;
    if (docFilter === 'DEMO' && !doc.is_demo) return false;
    // Category filter
    if (docCategory !== 'ALL' && doc.category !== docCategory) return false;
    // Search query
    if (docSearch.trim()) {
      const q = docSearch.toLowerCase();
      const matchesTitle = (doc.title || '').toLowerCase().includes(q);
      const matchesDesc = (doc.description || '').toLowerCase().includes(q);
      const matchesId = (doc.doc_id || '').toLowerCase().includes(q);
      const matchesContent = (doc.raw_content || '').toLowerCase().includes(q);
      return matchesTitle || matchesDesc || matchesId || matchesContent;
    }
    return true;
  });

  // ==========================================
  // EXISTING GRAPH FACT / GUIDELINE HANDLERS
  // ==========================================
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

        toast.success(`Approved Fact "${formData.name}" successfully registered in Enterprise Brand Knowledge Base!`);
      } else {
        await fetch('/api/guidelines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id: brandId,
            name: formData.name,
            category: formData.category,
            rule_text: formData.description || formData.name,
            severity: formData.severity,
            department_owner: formData.department_owner,
            source_date: formData.source_date || '2026-01-15'
          })
        });

        toast.success(`Brand Guideline "${formData.name}" registered in Knowledge Graph!`);
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
      console.error(err);
      toast.error('Failed to register: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (node: any) => {
    const d = node.data || {};
    const props = d.properties || {};
    setEditingNode(node);
    setEditFormData({
      name: d.label || '',
      category: props.category || 'PRICE',
      current_value: props.current_value || '',
      unit: props.unit || '',
      description: d.description || '',
      source_citation: props.citation || '',
      department_owner: props.department_owner || '',
      source_date: props.source_date || '',
      expiry_date: props.expiry_date || '',
      evidence_reference: props.evidence_reference || '',
      restricted_terms: Array.isArray(props.restricted_terms) ? props.restricted_terms.join(', ') : '',
      required_phrases: Array.isArray(props.required_phrases) ? props.required_phrases.join(', ') : ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode) return;

    try {
      setIsSubmitting(true);
      const factId = editingNode.data?.id;
      const res = await fetch(`/api/facts/${factId}`, {
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
      {/* Enterprise Page Header */}
      <PageHeader
        title="Brand Knowledge Base"
        description="Author, upload, and govern certified brand documents, pricing policies, and ground truth guardrails."
        icon={<BookOpen className="w-4 h-4 text-white" />}
        category="Governance Control Plane"
        workspaceName={brandId === 'aurelle-tech' ? 'Aurelle Technologies Inc.' : brandId}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Knowledge Base', active: true }
        ]}
        helpContext={{
          summary: "Brand Knowledge represents certified corporate ground truth. Custom documents are parsed, converted into high-dimensional semantic vectors, and actively govern the multi-agent verification pipeline.",
          terms: [
            { term: "Custom Documents", definition: "Tenant-authored brand guidelines, pricing schedules, and clinical claims with full versioning and audit trails." },
            { term: "Demo Benchmarks", definition: "Pre-configured baseline reference documents used for regression tests and system evaluation." },
            { term: "INDEXED Status", definition: "Confirmed status indicating text parsing, semantic embedding generation, and graph indexing were 100% successful." },
            { term: "Secure Ingestion Gateway", definition: "Enterprise security gateway blocking private IP subnets and internal loopbacks during public website imports." }
          ]
        }}
        primaryAction={{
          label: "Create Document",
          onClick: () => setIsCreateDocModalOpen(true),
          icon: <Plus className="w-3.5 h-3.5" />
        }}
        secondaryAction={{
          label: "Simulate Mutation",
          onClick: () => onNavigate && onNavigate('impact-simulator'),
          icon: <ExternalLink className="w-3.5 h-3.5" />
        }}
      />

      {/* Top View Mode Switcher (Documents Studio vs Truth Graph Nodes) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveStudioView('DOCUMENTS')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeStudioView === 'DOCUMENTS'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Brand Documents Studio</span>
            <Badge variant="brand" size="sm">{documents.length}</Badge>
          </button>

          <button
            onClick={() => setActiveStudioView('GRAPH_NODES')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeStudioView === 'GRAPH_NODES'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Certified Graph Nodes</span>
            <Badge variant="neutral" size="sm">{allNodes.length}</Badge>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto px-2">
          {activeStudioView === 'DOCUMENTS' && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsUploadDocModalOpen(true)}
                icon={<Upload className="w-3 h-3 text-slate-700 dark:text-slate-300" />}
              >
                Upload File
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsImportModalOpen(true)}
                icon={<Globe className="w-3 h-3 text-slate-700 dark:text-slate-300" />}
              >
                Import Website
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: BRAND DOCUMENTS STUDIO */}
      {/* ========================================================================= */}
      {activeStudioView === 'DOCUMENTS' && (
        <div className="space-y-5">
          
          {/* Studio Filters & Search Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            
            {/* Filter Tabs: ALL, CUSTOM, DEMO */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs font-medium">
              <button
                onClick={() => setDocFilter('ALL')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  docFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Documents ({documents.length})
              </button>
              <button
                onClick={() => setDocFilter('CUSTOM')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  docFilter === 'CUSTOM'
                    ? 'bg-white dark:bg-slate-700 text-emerald-900 dark:text-emerald-300 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Custom Documents ({documents.filter((d) => !d.is_demo).length})
              </button>
              <button
                onClick={() => setDocFilter('DEMO')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  docFilter === 'DEMO'
                    ? 'bg-white dark:bg-slate-700 text-indigo-900 dark:text-indigo-300 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Demo Benchmarks ({documents.filter((d) => d.is_demo).length})
              </button>
            </div>

            {/* Category Selector + Search */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 shadow-2xs"
              >
                <option value="ALL">All Categories</option>
                <option value="BRAND_GUIDELINES">Brand Guidelines</option>
                <option value="PRODUCT_FACTS">Product Facts</option>
                <option value="PRICING_POLICIES">Pricing Policies</option>
                <option value="BRAND_VOICE">Brand Voice</option>
                <option value="REGULATORY_POLICIES">Regulatory Policies</option>
                <option value="MARKETING_CLAIMS">Marketing Claims</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search documents, policies..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 shadow-2xs"
                />
              </div>
            </div>

          </div>

          {/* Documents Grid */}
          {isLoadingDocs ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Retrieving certified tenant document library...</span>
            </div>
          ) : filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocuments.map((doc) => {
                const isExpanded = expandedDocIds.has(doc.doc_id);
                return (
                  <div
                    key={doc.doc_id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-all"
                  >
                    <div className="space-y-3">
                      
                      {/* Header Row: Category Badge, Version & Demo/Custom Label */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                            {(doc.category || 'GENERAL').replace(/_/g, ' ')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            v{doc.version_number || '1.0'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {doc.is_demo ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              DEMO BENCHMARK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              CUSTOM TENANT DOC
                            </span>
                          )}

                          {/* Real-time processing status badge */}
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            doc.processing_status === 'INDEXED' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                            doc.processing_status === 'PROCESSING' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse' :
                            doc.processing_status === 'FAILED' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {doc.processing_status === 'INDEXED' && <Check className="w-3 h-3" />}
                            {doc.processing_status === 'PROCESSING' && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                            {doc.processing_status === 'FAILED' && <AlertTriangle className="w-2.5 h-2.5" />}
                            <span>{doc.processing_status || 'INDEXED'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {doc.title || 'Untitled Document'}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                            {doc.doc_id || 'DOC-UNKNOWN'}
                          </span>
                        </div>
                        {doc.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {doc.description}
                          </p>
                        )}
                      </div>

                      {/* Content Preview & Expand Toggle */}
                      <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase font-mono">
                          <span>Document Body Preview</span>
                          <button
                            onClick={() => toggleExpandDoc(doc.doc_id)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer lowercase"
                          >
                            <span>{isExpanded ? 'collapse' : 'view full text'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                        <p className={`font-mono text-[11px] whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {doc.raw_content}
                        </p>
                      </div>

                      {/* Metadata Row */}
                      <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <span>Source: <strong className="font-medium text-slate-600 dark:text-slate-300">{doc.source_type}</strong></span>
                          {doc.file_name && <span className="truncate max-w-[150px]">File: {doc.file_name}</span>}
                          {doc.source_url && <span className="truncate max-w-[150px]">URL: {doc.source_url}</span>}
                        </div>
                        <span>Updated: {formatDateSafe(doc.updated_at)}</span>
                      </div>

                    </div>

                    {/* Action Footers */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenEditDoc(doc)}
                          disabled={doc.is_demo}
                          icon={<Edit2 className="w-3 h-3" />}
                          title={doc.is_demo ? "Demo documents are read-only benchmarks" : "Edit document"}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenVersions(doc)}
                          icon={<History className="w-3 h-3" />}
                        >
                          Versions
                        </Button>
                      </div>

                      {!doc.is_demo && (
                        <button
                          onClick={() => handleOpenDeleteDoc(doc)}
                          className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete custom document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No Documents Match Filter"
              description={`No documents found in workspace matching "${docSearch || docFilter}". Author a custom document, upload an executive policy, or import a brand website.`}
              actionLabel="Create Document"
              onAction={() => setIsCreateDocModalOpen(true)}
              icon={<FileText className="w-6 h-6 text-slate-500" />}
            />
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CERTIFIED GRAPH NODES (EXISTING - 100% PRESERVED) */}
      {/* ========================================================================= */}
      {activeStudioView === 'GRAPH_NODES' && (
        <div className="space-y-5">
          {/* Filter and Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Certified Knowledge Repository</span>
              <Badge variant="neutral" size="sm">{filteredNodes.length} Nodes</Badge>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search facts, guidelines, citations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 shadow-2xs"
                />
              </div>
              <Button
                variant="primary"
                size="xs"
                onClick={() => setIsModalOpen(true)}
                icon={<Plus className="w-3 h-3" />}
              >
                Add Fact
              </Button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs overflow-x-auto">
            {['ALL', 'APPROVED_FACT', 'APPROVED_CLAIM', 'TRADEMARK', 'TONE_ATTRIBUTE', 'REGULATION'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap text-xs ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {(tab || '').replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Knowledge Cards Grid */}
          {filteredNodes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNodes.map((n: any) => {
                const d = n.data || {};
                const props = d.properties || {};
                const isFact = d.nodeType === 'APPROVED_FACT';
                return (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Badge variant={isFact ? 'brand' : 'neutral'} size="sm">
                          {d.nodeType ? d.nodeType.replace(/_/g, ' ') : 'KNOWLEDGE NODE'}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-semibold">{d.id}</span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{d.label}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{d.description}</p>
                      </div>
                    </div>

                    {/* Citations & Metadata */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {props.citation && (
                        <div className="flex items-start gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans shrink-0">Citation:</span>
                          <span className="text-emerald-800 dark:text-emerald-400 font-medium truncate">{props.citation}</span>
                        </div>
                      )}
                      {props.current_value && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Approved Value:</span>
                          <span className="text-slate-900 dark:text-white font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                            {props.current_value}
                          </span>
                        </div>
                      )}
                      {props.exact_mark && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Registered Mark:</span>
                          <span className="text-purple-800 dark:text-purple-400 font-bold">{props.exact_mark}</span>
                        </div>
                      )}
                      {props.source_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Source Date:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-mono">{props.source_date}</span>
                        </div>
                      )}
                      {props.expiry_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          <span className="text-amber-700 dark:text-amber-400 font-sans">Expires:</span>
                          <span className="text-amber-800 dark:text-amber-300 font-mono">{props.expiry_date}</span>
                        </div>
                      )}
                      {props.restricted_terms && props.restricted_terms.length > 0 && (
                        <div className="flex items-start gap-1">
                          <Tag className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
                          <span className="text-rose-700 dark:text-rose-400 font-sans shrink-0">Restricted:</span>
                          <span className="text-rose-800 dark:text-rose-300 truncate">{props.restricted_terms.join(', ')}</span>
                        </div>
                      )}
                      {props.department_owner && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500 dark:text-slate-400 font-sans">Owner:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-sans">{props.department_owner}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Action Footers */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: DOCUMENT MANAGEMENT STUDIO */}
      {/* ========================================================================= */}

      {/* 1. Create Document Modal */}
      <Modal
        isOpen={isCreateDocModalOpen}
        onClose={() => setIsCreateDocModalOpen(false)}
        title="Create Brand Knowledge Document"
        subtitle="Author a new policy, pricing mandate, or guidelines document with automated vector indexing."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateDocModalOpen(false)} disabled={isSubmittingDoc}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateDocument} isLoading={isSubmittingDoc}>
              Save &amp; Index Document
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <Input
            label="Document Title"
            required
            placeholder="e.g. Q2 2026 Enterprise Pricing & Seat Licensing Policy"
            value={createDocForm.title}
            onChange={(e) => setCreateDocForm({ ...createDocForm, title: e.target.value })}
          />

          <Select
            label="Document Category"
            required
            value={createDocForm.category}
            onChange={(e) => setCreateDocForm({ ...createDocForm, category: e.target.value })}
            options={[
              { value: 'BRAND_GUIDELINES', label: 'Brand Guidelines' },
              { value: 'PRODUCT_FACTS', label: 'Product Facts & Specs' },
              { value: 'PRICING_POLICIES', label: 'Pricing Policies' },
              { value: 'BRAND_VOICE', label: 'Brand Voice & Tone' },
              { value: 'REGULATORY_POLICIES', label: 'Regulatory Policies (FDA / FTC / SEC)' },
              { value: 'MARKETING_CLAIMS', label: 'Marketing Claims & Substantive Evidence' }
            ]}
          />

          <Input
            label="Description / Purpose (Optional)"
            placeholder="e.g. Official pricing tier structure authorized by governance board"
            value={createDocForm.description}
            onChange={(e) => setCreateDocForm({ ...createDocForm, description: e.target.value })}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Document Content <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={8}
              required
              placeholder="Enter complete brand policy statements, price commitments, claims, and mandatory citations..."
              value={createDocForm.raw_content}
              onChange={(e) => setCreateDocForm({ ...createDocForm, raw_content: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono shadow-2xs leading-relaxed"
            />
            <p className="text-[11px] text-slate-500">
              Upon creation, content is parsed into knowledge statements and indexed for semantic vector search.
            </p>
          </div>
        </form>
      </Modal>

      {/* 2. Upload Document Modal */}
      <Modal
        isOpen={isUploadDocModalOpen}
        onClose={() => setIsUploadDocModalOpen(false)}
        title="Upload Brand Document"
        subtitle="Upload PDF, DOCX, TXT, or Markdown documents for automated text extraction & vector indexing."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadDocModalOpen(false)} disabled={isSubmittingDoc}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUploadDocument} isLoading={isSubmittingDoc} disabled={!selectedUploadFile}>
              Upload &amp; Process Document
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setSelectedUploadFile(f);
                if (f && !uploadDocForm.title) {
                  setUploadDocForm((prev) => ({ ...prev, title: f.name.replace(/\.[^/.]+$/, "") }));
                }
              }}
              className="hidden"
              id="brand-doc-upload-file"
            />
            <label htmlFor="brand-doc-upload-file" className="cursor-pointer space-y-2 block">
              <FileUp className="w-8 h-8 text-indigo-600 mx-auto" />
              <div className="text-xs text-slate-700 font-medium">
                {selectedUploadFile ? (
                  <span className="font-semibold text-indigo-700">{selectedUploadFile.name} ({(selectedUploadFile.size / 1024).toFixed(1)} KB)</span>
                ) : (
                  <span>Click to select PDF, DOCX, TXT, or MD file</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Supported formats: PDF, DOCX, TXT, MD (Max 25MB)</p>
            </label>
          </div>

          <Input
            label="Document Title (Defaults to filename)"
            placeholder="Document title"
            value={uploadDocForm.title}
            onChange={(e) => setUploadDocForm({ ...uploadDocForm, title: e.target.value })}
          />

          <Select
            label="Document Category"
            value={uploadDocForm.category}
            onChange={(e) => setUploadDocForm({ ...uploadDocForm, category: e.target.value })}
            options={[
              { value: 'BRAND_GUIDELINES', label: 'Brand Guidelines' },
              { value: 'PRODUCT_FACTS', label: 'Product Facts & Specs' },
              { value: 'PRICING_POLICIES', label: 'Pricing Policies' },
              { value: 'BRAND_VOICE', label: 'Brand Voice & Tone' },
              { value: 'REGULATORY_POLICIES', label: 'Regulatory Policies' },
              { value: 'MARKETING_CLAIMS', label: 'Marketing Claims' }
            ]}
          />

          <Input
            label="Description (Optional)"
            placeholder="Context or notes about this document"
            value={uploadDocForm.description}
            onChange={(e) => setUploadDocForm({ ...uploadDocForm, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* 3. Website Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => { setIsImportModalOpen(false); setWebsitePreview(null); }}
        title="Import Public Brand Website"
        subtitle="Safely fetch and review content from a public brand website with secure origin verification."
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)} disabled={isSubmittingDoc}>
              Cancel
            </Button>
            {websitePreview && (
              <Button variant="primary" onClick={handleCommitWebsiteImport} isLoading={isSubmittingDoc}>
                Commit &amp; Index Document
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://example.com/brand-guidelines or pricing"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs font-mono"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleFetchWebsitePreview}
              isLoading={isFetchingPreview}
              icon={<Search className="w-3.5 h-3.5" />}
            >
              Fetch Preview
            </Button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Enterprise security gateway blocks restricted network paths and metadata endpoints.</span>
          </div>

          {/* Preview Box */}
          {websitePreview && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Extracted Web Page Content</span>
                <span className="text-[10px] font-mono text-slate-400">{websitePreview.extracted_content?.length || 0} characters</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Page Title</label>
                <input
                  type="text"
                  value={websitePreview.title}
                  onChange={(e) => setWebsitePreview({ ...websitePreview, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Target Category</label>
                <select
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value="BRAND_GUIDELINES">Brand Guidelines</option>
                  <option value="PRODUCT_FACTS">Product Facts & Specs</option>
                  <option value="PRICING_POLICIES">Pricing Policies</option>
                  <option value="BRAND_VOICE">Brand Voice</option>
                  <option value="MARKETING_CLAIMS">Marketing Claims</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Clean Extracted Text</label>
                <textarea
                  rows={6}
                  value={websitePreview.extracted_content}
                  onChange={(e) => setWebsitePreview({ ...websitePreview, extracted_content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 4. Edit Document Modal */}
      <Modal
        isOpen={isEditDocModalOpen}
        onClose={() => setIsEditDocModalOpen(false)}
        title={`Edit Document: ${editingDoc?.title || ''}`}
        subtitle={`Current version: v${editingDoc?.version_number || '1.0'}. Saving will archive current version and increment version counter.`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditDocModalOpen(false)} disabled={isSubmittingDoc}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEditDoc} isLoading={isSubmittingDoc}>
              Save &amp; Archive Revision
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEditDoc} className="space-y-4">
          <Input
            label="Document Title"
            required
            value={editDocForm.title}
            onChange={(e) => setEditDocForm({ ...editDocForm, title: e.target.value })}
          />

          <Select
            label="Document Category"
            value={editDocForm.category}
            onChange={(e) => setEditDocForm({ ...editDocForm, category: e.target.value })}
            options={[
              { value: 'BRAND_GUIDELINES', label: 'Brand Guidelines' },
              { value: 'PRODUCT_FACTS', label: 'Product Facts & Specs' },
              { value: 'PRICING_POLICIES', label: 'Pricing Policies' },
              { value: 'BRAND_VOICE', label: 'Brand Voice & Tone' },
              { value: 'REGULATORY_POLICIES', label: 'Regulatory Policies' },
              { value: 'MARKETING_CLAIMS', label: 'Marketing Claims' }
            ]}
          />

          <Input
            label="Change Summary / Audit Rationale"
            required
            placeholder="e.g. Revised seat price from ₹499 to ₹599"
            value={editDocForm.change_summary}
            onChange={(e) => setEditDocForm({ ...editDocForm, change_summary: e.target.value })}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Document Body Content</label>
            <textarea
              rows={8}
              required
              value={editDocForm.raw_content}
              onChange={(e) => setEditDocForm({ ...editDocForm, raw_content: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono shadow-2xs leading-relaxed"
            />
          </div>
        </form>
      </Modal>

      {/* 5. Version History Modal */}
      <Modal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        title={`Version History: ${versionDoc?.title || ''}`}
        subtitle={`Audit trail of all immutable archived revisions for ${versionDoc?.doc_id || ''}`}
        maxWidth="lg"
        footer={
          <Button variant="secondary" onClick={() => setIsVersionModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          {isLoadingVersions ? (
            <div className="py-12 flex justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : versionList.length > 0 ? (
            <div className="space-y-3">
              {versionList.map((ver, idx) => (
                <div key={ver.version_id || idx} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded text-[11px] font-mono">
                        v{ver.version_number || '1.0'}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{ver.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">{formatDateSafe(ver.created_at)}</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                    Reason: {ver.change_summary || 'Document revision committed.'}
                  </p>

                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {ver.raw_content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No historical revisions archived yet. Current version is v{versionDoc?.version_number || '1.0'}.
            </div>
          )}
        </div>
      </Modal>

      {/* 6. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Document Deletion"
        subtitle={`Are you sure you want to delete "${docToDelete?.title || ''}"?`}
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={isSubmittingDoc}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDeleteDoc} isLoading={isSubmittingDoc}>
              Delete Document
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Deleting this document will remove its vector embeddings and detach it from AI verification pipelines. Immutable audit ledger logs remain intact.
        </p>
      </Modal>

      {/* ========================================================================= */}
      {/* EXISTING MODALS: REGISTER APPROVED FACT & EDIT FACT (100% PRESERVED) */}
      {/* ========================================================================= */}

      {/* Register Approved Fact / Guideline Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={registrationMode === 'FACT' ? 'Register Approved Brand Fact' : 'Register Brand Guideline & Policy'}
        subtitle="Adds a certified truth node into the Brand Knowledge Graph."
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
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                registrationMode === 'FACT'
                  ? 'bg-white text-slate-900 border border-slate-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved Fact (Price, Spec, Range)
            </button>
            <button
              type="button"
              onClick={() => setRegistrationMode('GUIDELINE')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                registrationMode === 'GUIDELINE'
                  ? 'bg-white text-slate-900 border border-slate-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Guideline &amp; Guardrail Rule
            </button>
          </div>

          <Input
            label={registrationMode === 'FACT' ? 'Fact Name / Claim Target' : 'Guideline Name'}
            required
            placeholder={registrationMode === 'FACT' ? 'e.g. QuantumConnect Monthly Subscription' : 'e.g. Prohibited Medical Cures Mandate'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'PRICE', label: 'Price & Commercial Rate' },
                { value: 'RANGE', label: 'Battery / Range Specification' },
                { value: 'BATTERY', label: 'Battery Chemistry & Charging' },
                { value: 'TRADEMARK', label: 'Trademark & Intellectual Property' },
                { value: 'SAFETY', label: 'Safety & Regulatory Standards' },
                { value: 'TONE', label: 'Brand Voice & Tone' },
                { value: 'LEGAL', label: 'Legal & Compliance' }
              ]}
            />

            {registrationMode === 'FACT' ? (
              <Input
                label="Approved Certified Value"
                required
                placeholder="e.g. ₹499 or 520 miles"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
              />
            ) : (
              <Select
                label="Violation Severity"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                options={[
                  { value: 'CRITICAL', label: 'CRITICAL (Strict Release Blocker)' },
                  { value: 'HIGH', label: 'HIGH (Governance Override Required)' },
                  { value: 'MODERATE', label: 'MODERATE (Editorial Remediation)' }
                ]}
              />
            )}
          </div>

          <Input
            label="Description / Enforcement Rationale"
            placeholder="Official explanation and substantiation..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <Input
            label="Source Citation"
            placeholder="e.g. Board Resolution #2026-01 or Lab Test IEC-62133"
            value={formData.source_citation}
            onChange={(e) => setFormData({ ...formData, source_citation: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Source Effective Date"
              type="date"
              value={formData.source_date}
              onChange={(e) => setFormData({ ...formData, source_date: e.target.value })}
            />
            <Input
              label="Expiration Date (Optional)"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prohibited / Restricted Terms"
              placeholder="e.g. cure, diagnose, horizun (comma separated)"
              value={formData.restricted_terms}
              onChange={(e) => setFormData({ ...formData, restricted_terms: e.target.value })}
            />
            <Input
              label="Mandatory Required Phrases"
              placeholder="e.g. QuantumAcoustics™ (comma separated)"
              value={formData.required_phrases}
              onChange={(e) => setFormData({ ...formData, required_phrases: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Approved Fact Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Fact: ${editingNode?.data?.label || ''}`}
        subtitle={`Record ID: ${editingNode?.data?.id || ''} — Changes will be captured in the enterprise Audit Ledger.`}
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateFact} isLoading={isSubmitting}>
              Save Authorized Mutation
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateFact} className="space-y-4">
          <Input
            label="Fact Name / Label"
            required
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Approved Value"
              required
              value={editFormData.current_value}
              onChange={(e) => setEditFormData({ ...editFormData, current_value: e.target.value })}
            />
            <Input
              label="Unit / Qualifier"
              placeholder="e.g. /month, miles, kWh"
              value={editFormData.unit}
              onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
            />
          </div>

          <Input
            label="Description & Context"
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
          />

          <Input
            label="Source Citation"
            value={editFormData.source_citation}
            onChange={(e) => setEditFormData({ ...editFormData, source_citation: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Effective Date"
              type="date"
              value={editFormData.source_date}
              onChange={(e) => setEditFormData({ ...editFormData, source_date: e.target.value })}
            />
            <Input
              label="Expiration Date"
              type="date"
              value={editFormData.expiry_date}
              onChange={(e) => setEditFormData({ ...editFormData, expiry_date: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
