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

interface KnowledgeGraphViewProps {
  brandId: string;
}

const nodeTypes = {
  brandNode: BrandNode,
};

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ brandId: initialBrandId }) => {
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
      let strokeColor = '#334155';
      let strokeWidth = 1.5;

      if (traversedSubgraph) {
        const edgeIdPattern = `${edge.source}->${edge.target}`;
        if (
          traversedSubgraph.subgraphEdgeIds.includes(edgeIdPattern) ||
          (traversedSubgraph.subgraphNodeIds.includes(edge.source) && traversedSubgraph.subgraphNodeIds.includes(edge.target))
        ) {
          isHighlighted = true;
          strokeColor = '#06B6D4';
          strokeWidth = 2.5;
        } else {
          strokeColor = '#1e293b';
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
      {/* Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Brand Dependency Intelligence Graph (BDIG)
              </span>
              <span className="text-[11px] text-slate-400">
                Live MongoDB Atlas Knowledge Ontology
              </span>
            </div>
          </div>

          {/* Brand Workspace Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Brand:</span>
            {[
              { id: 'aurelle-tech', label: 'AURELLE (Consumer Tech)' },
              { id: 'apex-dynamics', label: 'APEX (EV Mobility)' },
              { id: 'novus-health', label: 'NOVUS (Life Sciences)' }
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setActiveBrandId(b.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeBrandId === b.id
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>

        {/* Filters, Search & Trace Reset */}
        <div className="flex items-center gap-3 flex-wrap">
          {traversedSubgraph && (
            <button
              onClick={handleClearTrace}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition-all animate-pulse"
            >
              <X className="w-3.5 h-3.5" />
              Clear Dependency Trace ({traversedSubgraph.subgraphNodeIds.length} nodes)
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search node name, ID, desc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 w-52"
            />
          </div>

          {/* Node Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
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
            <GitFork className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={relationshipFilter}
              onChange={(e) => setRelationshipFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
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
            className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[700px]">
        {/* Canvas */}
        <div className={`${selectedNode ? 'lg:col-span-8' : 'lg:col-span-12'} h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl transition-all`}>
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading Brand Knowledge Graph ontology from MongoDB Atlas...</p>
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
              className="bg-slate-950"
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e293b" />
              <Controls className="!bg-slate-900 !border-slate-800 !fill-white" />
              <MiniMap
                nodeColor={(node) => {
                  if (node.data.isHighlighted) return '#06B6D4';
                  if (node.data.isAffected) return '#F59E0B';
                  return '#334155';
                }}
                maskColor="rgba(8, 13, 26, 0.75)"
                className="!bg-slate-900 !border-slate-800 rounded-xl"
              />
            </ReactFlow>
          )}

          {/* Active Trace Legend Overlay */}
          {traversedSubgraph && (
            <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs backdrop-blur-md shadow-xl max-w-sm space-y-1 animate-fadeIn">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
                Active Dependency Subgraph
              </div>
              <p className="text-[11px] text-slate-300">
                Root: <span className="font-mono text-cyan-400">{traversedSubgraph.startNodeId}</span> · Highlighting {traversedSubgraph.subgraphNodeIds.length} connected touchpoints and {traversedSubgraph.evidenceCitations.length} evidence links.
              </p>
            </div>
          )}
        </div>

        {/* Selected Node Inspector Drawer (4 cols) */}
        {selectedNode && (
          <div className="lg:col-span-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between overflow-y-auto max-h-[700px] animate-fadeIn">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/30 px-2.5 py-1 rounded">
                  {selectedNode.nodeType || 'GRAPH_NODE'}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1 leading-snug">{selectedNode.label}</h3>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {selectedNode.id}
                </span>
              </div>

              {/* Action: Trace Dependencies */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Trace Blast & Dependencies</span>
                  <button
                    onClick={() => handleTraceDependencies(selectedNode.id)}
                    disabled={isTracing}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-500 text-slate-950 font-bold text-xs hover:bg-brand-400 transition-all disabled:opacity-50"
                  >
                    {isTracing ? (
                      <span className="animate-spin text-[10px]">⏳</span>
                    ) : (
                      <GitFork className="w-3.5 h-3.5" />
                    )}
                    Trace DAG
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Calculates all upstream governing sources and downstream affected marketing assets.
                </p>
              </div>

              {selectedNode.description && (
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Description</div>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {selectedNode.description}
                  </p>
                </div>
              )}

              {/* Node Properties */}
              {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Metadata & Citations</div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(selectedNode.properties).map(([k, v]) => (
                      <div key={k} className="text-xs">
                        <span className="text-slate-400 capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                        <span className="text-slate-200 font-medium">
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
                  <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    Evidence-Backed Relationships
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {traversedSubgraph.evidenceCitations.map((c, idx) => (
                      <div key={idx} className="bg-slate-950/80 p-2.5 rounded-lg border border-cyan-900/40 text-[11px]">
                        <div className="font-mono text-cyan-300 font-semibold mb-0.5">
                          {c.source_node} <span className="text-slate-400">({c.relationship})</span> → {c.target_node}
                        </div>
                        <div className="text-slate-300 text-[10px] italic">
                          "{c.evidence}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Shield className="w-3.5 h-3.5 text-brand-400" />
                Live MongoDB DAG Node
              </span>
              <span className="font-mono text-[10px] text-slate-500">{activeBrandId}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
