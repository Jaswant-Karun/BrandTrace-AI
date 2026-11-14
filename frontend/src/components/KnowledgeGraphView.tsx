import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { BrandNode } from './BrandNode';
import { 
  Search, Filter, Shield, Layers, GitFork, Sparkles, 
  CheckCircle2, RefreshCw, X 
} from 'lucide-react';
import { PageHeader } from './ui/PageHeader';
import { WorkflowBanner } from './ui/WorkflowBanner';

interface KnowledgeGraphViewProps {
  brandId: string;
  onNavigate?: (tab: any) => void;
}

const nodeTypes = {
  brandNode: BrandNode,
};

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ brandId: initialBrandId, onNavigate }) => {
  const [activeBrandId, setActiveBrandId] = useState<string>(initialBrandId || 'aurelle-tech');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [relationshipFilter, setRelationshipFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Traversal & Highlighting State
  const [traversedSubgraph, setTraversedSubgraph] = useState<{
    startNodeId: string;
    subgraphNodeIds: string[];
    subgraphEdgeIds: string[];
    evidenceCitations: Array<{ source_node: string; target_node: string; relationship: string; evidence: string }>;
  } | null>(null);
  const [isTracing, setIsTracing] = useState<boolean>(false);

  // Sync with prop
  useEffect(() => {
    if (initialBrandId) {
      setActiveBrandId(initialBrandId);
    }
  }, [initialBrandId]);

  const loadGraph = useCallback(() => {
    setIsLoading(true);
    setTraversedSubgraph(null);
    setSelectedNode(null);

    fetch(`/api/brands/${activeBrandId}/graph`)
      .then((res) => res.json())
      .then((data) => {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load graph:', err);
        setIsLoading(false);
      });
  }, [activeBrandId, setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Execute Graph Traversal on a Node
  const handleTraceDependencies = async (nodeId: string) => {
    setIsTracing(true);
    try {
      const res = await fetch('/api/graph/traverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: activeBrandId,
          start_node_id: nodeId,
          direction: 'BOTH'
        })
      });
      if (!res.ok) throw new Error('Traversal failed');
      const data = await res.json();
      
      setTraversedSubgraph({
        startNodeId: nodeId,
        subgraphNodeIds: data.subgraph_node_ids || [],
        subgraphEdgeIds: data.subgraph_edge_ids || [],
        evidenceCitations: data.evidence_citations || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTracing(false);
    }
  };

  const handleClearTrace = () => {
    setTraversedSubgraph(null);
  };

  // Filtered & Styled Nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const matchesCategory = filterType === 'ALL' || node.data.nodeType === filterType;
      const matchesSearch =
        searchQuery.trim() === '' ||
        String(node.data.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(node.data.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(node.data.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      const isHidden = !matchesCategory || !matchesSearch;

      // Traversal Highlighting
      let isHighlighted = false;
      let isAffected = false;
      let isDimmed = false;

      if (traversedSubgraph) {
        const inSubgraph = traversedSubgraph.subgraphNodeIds.includes(node.id);
        if (node.id === traversedSubgraph.startNodeId) {
          isHighlighted = true;
        } else if (inSubgraph) {
          isAffected = true;
        } else {
          isDimmed = true;
        }
      }

      return {
        ...node,
        hidden: isHidden,
        data: {
          ...node.data,
          isHighlighted,
          isAffected,
          isDimmed
        }
      };
    });
  }, [nodes, filterType, searchQuery, traversedSubgraph]);

  // Filtered Edges
  const filteredEdges = useMemo(() => {
    return edges.map((edge) => {
      const edgeType = (edge.data as any)?.edgeType || '';
      const matchesRel = relationshipFilter === 'ALL' || edgeType === relationshipFilter;

      let isHighlighted = false;
      let strokeColor = '#CBD5E1';
      let strokeWidth = 1.5;

      if (traversedSubgraph) {
        const edgeIdPattern = `${edge.source}->${edge.target}`;
        if (
          traversedSubgraph.subgraphEdgeIds.includes(edgeIdPattern) ||
          (traversedSubgraph.subgraphNodeIds.includes(edge.source) && traversedSubgraph.subgraphNodeIds.includes(edge.target))
        ) {
          isHighlighted = true;
          strokeColor = '#0F172A';
          strokeWidth = 2.5;
        } else {
          strokeColor = '#E2E8F0';
          strokeWidth = 1;
        }
      }

      return {
        ...edge,
        hidden: !matchesRel,
        animated: isHighlighted || edge.animated,
        style: {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          opacity: traversedSubgraph && !isHighlighted ? 0.25 : 1
        }
      };
    });
  }, [edges, relationshipFilter, traversedSubgraph]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data);
  };

  return (
    <div className="space-y-4">
      {/* Standardized Enterprise Page Header */}
      <PageHeader
        title="Knowledge Graph"
        description="Explore and visualize relationships between brand guidelines, approved facts, campaigns, and marketing assets."
        category="Workspace"
        workspaceName={activeBrandId === 'aurelle-tech' ? 'Aurelle Technologies Inc.' : activeBrandId}
        breadcrumbs={[
          { label: 'BrandTrace' },
          { label: 'Workspace' },
          { label: 'Knowledge Graph', active: true }
        ]}
        helpContext={{
          summary: "The Brand Knowledge Graph models all enterprise touchpoints in a directed acyclic graph (DAG). Edges represent dependencies such as 'CITES_FACT', 'GOVERNED_BY', or 'PROHIBITS_CLAIM'.",
          terms: [
            { term: "Node Types", definition: "Approved Facts, Guidelines, Registered Trademarks, Touchpoints, and Prohibited Claims." },
            { term: "DAG Traversal", definition: "Click any node to highlight upstream root facts and downstream dependent marketing assets." },
            { term: "Evidence Citations", definition: "Structural graph connections linking copy assertions to certified laboratory tests or regulatory filings." }
          ]
        }}
        primaryAction={{
          label: "Inspect Copy",
          onClick: () => onNavigate && onNavigate('content-studio'),
          icon: <Sparkles className="w-3.5 h-3.5" />
        }}
        secondaryAction={{
          label: "Reload Graph",
          onClick: loadGraph,
          icon: <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        }}
      />

      {/* Top Control Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
              <Layers className="w-4 h-4 text-slate-800" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Brand Dependency Intelligence Graph (BDIG)
              </span>
              <span className="text-[11px] text-slate-500">
                Live MongoDB Atlas Knowledge Ontology
              </span>
            </div>
          </div>

          {/* Brand Workspace Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2">Brand:</span>
            {[
              { id: 'aurelle-tech', label: 'AURELLE (Consumer Tech)' },
              { id: 'apex-dynamics', label: 'APEX (EV Mobility)' },
              { id: 'novus-health', label: 'NOVUS (Life Sciences)' }
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBrandId(b.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeBrandId === b.id
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>

        {/* Filters, Search & Trace Reset */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {traversedSubgraph && (
            <button
              onClick={handleClearTrace}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold hover:bg-amber-100 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Clear Trace ({traversedSubgraph.subgraphNodeIds.length} nodes)
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search node name, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 w-48 shadow-xs"
            />
          </div>

          {/* Node Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400 shadow-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="APPROVED_FACT">Approved Facts</option>
              <option value="APPROVED_CLAIM">Approved Claims</option>
              <option value="PROHIBITED_CLAIM">Prohibited Claims</option>
              <option value="TRADEMARK">Trademarks</option>
              <option value="GUIDELINE">Brand Guidelines</option>
              <option value="REGULATION">Regulations</option>
              <option value="PILLAR">Brand Pillars</option>
              <option value="CAMPAIGN">Campaigns</option>
              <option value="ASSET">Assets</option>
            </select>
          </div>

          {/* Relationship Filter */}
          <div className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={relationshipFilter}
              onChange={(e) => setRelationshipFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-slate-400 shadow-xs"
            >
              <option value="ALL">All Relationships</option>
              <option value="DEPENDS_ON_FACT">DEPENDS_ON_FACT</option>
              <option value="CITES_CLAIM">CITES_CLAIM</option>
              <option value="GOVERNS">GOVERNS</option>
              <option value="PROTECTS">PROTECTS</option>
              <option value="DEFINES">DEFINES</option>
              <option value="CONSTRAINS">CONSTRAINS</option>
            </select>
          </div>

          <button
            onClick={loadGraph}
            title="Reload from MongoDB"
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[700px]">
        {/* Canvas */}
        <div className={`${selectedNode ? 'lg:col-span-8' : 'lg:col-span-12'} h-full bg-white border border-slate-200 rounded-xl overflow-hidden relative shadow-xs transition-all`}>
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-white">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading Brand Knowledge Graph ontology from MongoDB Atlas...</p>
            </div>
          ) : (
            <ReactFlow
              nodes={filteredNodes}
              edges={filteredEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={1.5}
              className="bg-white"
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#E2E8F0" />
              <Controls className="!bg-white !border-slate-200 !fill-slate-700 !shadow-xs" />
              <MiniMap
                nodeColor={(node) => {
                  if (node.data.isHighlighted) return '#0F172A';
                  if (node.data.isAffected) return '#F59E0B';
                  return '#94A3B8';
                }}
                maskColor="rgba(248, 250, 252, 0.75)"
                className="!bg-white !border-slate-200 rounded-lg !shadow-xs"
              />
            </ReactFlow>
          )}

          {/* Active Trace Legend Overlay */}
          {traversedSubgraph && (
            <div className="absolute bottom-4 left-4 bg-white/95 border border-slate-200 rounded-xl p-3 text-xs backdrop-blur-xs shadow-md max-w-sm space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Active Dependency Subgraph
              </div>
              <p className="text-[11px] text-slate-600">
                Root: <span className="font-mono text-slate-900 font-semibold">{traversedSubgraph.startNodeId}</span> · Highlighting {traversedSubgraph.subgraphNodeIds.length} connected touchpoints and {traversedSubgraph.evidenceCitations.length} evidence links.
              </p>
            </div>
          )}
        </div>

        {/* Selected Node Inspector Drawer (4 cols) */}
        {selectedNode && (
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between overflow-y-auto max-h-[700px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded">
                  {selectedNode.nodeType || 'GRAPH_NODE'}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1 leading-snug">{selectedNode.label}</h3>
                <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {selectedNode.id}
                </span>
              </div>

              {/* Action: Trace Dependencies */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">Trace Blast & Dependencies</span>
                  <button
                    onClick={() => handleTraceDependencies(selectedNode.id)}
                    disabled={isTracing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isTracing ? (
                      <span className="animate-spin text-[10px]">⏳</span>
                    ) : (
                      <GitFork className="w-3.5 h-3.5" />
                    )}
                    Trace DAG
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Calculates all upstream governing sources and downstream affected marketing assets.
                </p>
              </div>

              {selectedNode.description && (
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedNode.description}
                  </p>
                </div>
              )}

              {/* Node Properties */}
              {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metadata & Citations</div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(selectedNode.properties).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                        <span className="text-slate-900 font-medium">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence-backed relationship citations for this node */}
              {traversedSubgraph && traversedSubgraph.evidenceCitations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Evidence-Backed Relationships
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {traversedSubgraph.evidenceCitations.map((c, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]">
                        <div className="font-mono text-slate-900 font-semibold mb-0.5">
                          {c.source_node} <span className="text-slate-500">({c.relationship})</span> → {c.target_node}
                        </div>
                        <div className="text-slate-600 text-[10px] italic">
                          "{c.evidence}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <Shield className="w-3.5 h-3.5 text-slate-700" />
                Live MongoDB DAG Node
              </span>
              <span className="font-mono text-[10px] text-slate-500">{activeBrandId}</span>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Banner: Next Step in Governance Journey */}
      <WorkflowBanner
        currentStage="Knowledge Graph"
        nextStageTitle="Content Intelligence"
        nextStageDescription="Submit marketing copy to test multi-agent inspection against the certified nodes discovered in this graph."
        nextStageActionLabel="Go to Content Intelligence"
        onNavigateNext={() => onNavigate && onNavigate('content-studio')}
        governanceHint="The graph links every marketing asset to root corporate facts and governing legal guardrails."
      />
    </div>
  );
};
