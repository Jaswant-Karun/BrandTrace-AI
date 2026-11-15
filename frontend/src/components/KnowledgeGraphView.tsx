import React, { useState, useEffect, useMemo } from 'react';
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
import { Search, Filter, Info, Shield, Layers } from 'lucide-react';

interface KnowledgeGraphViewProps {
  brandId: string;
}

const nodeTypes = {
  brandNode: BrandNode,
};

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ brandId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/brands/${brandId}/graph`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load graph:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [brandId, setNodes, setEdges]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      const matchesCategory = filterType === 'ALL' || node.data.nodeType === filterType;
      const matchesSearch =
        searchQuery.trim() === '' ||
        String(node.data.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(node.data.id).toLowerCase().includes(searchQuery.toLowerCase());

      const isHidden = !matchesCategory || !matchesSearch;
      return {
        ...node,
        hidden: isHidden,
      };
    });
  }, [nodes, filterType, searchQuery]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Brand Knowledge Graph Canvas
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter node by name / id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 w-52"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="ALL">All Categories</option>
              <option value="REGULATION">Regulations</option>
              <option value="APPROVED_CLAIM">Approved Claims</option>
              <option value="PROHIBITED_CLAIM">Prohibited Claims</option>
              <option value="TRADEMARK">Trademarks</option>
              <option value="PILLAR">Brand Pillars</option>
              <option value="CAMPAIGN">Campaigns</option>
              <option value="ASSET">Assets</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Canvas + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[680px]">
        {/* Canvas (9 cols or 12 cols) */}
        <div className={`${selectedNode ? 'lg:col-span-9' : 'lg:col-span-12'} h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative shadow-2xl transition-all`}>
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading Brand Knowledge Graph ontology...</p>
            </div>
          ) : (
            <ReactFlow
              nodes={filteredNodes}
              edges={edges}
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
                nodeColor="#0d9488"
                maskColor="rgba(8, 13, 26, 0.7)"
                className="!bg-slate-900 !border-slate-800 rounded-xl"
              />
            </ReactFlow>
          )}
        </div>

        {/* Selected Node Inspector (3 cols) */}
        {selectedNode && (
          <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between overflow-y-auto max-h-[680px] animate-fadeIn">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded">
                  {selectedNode.nodeType}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white mb-1">{selectedNode.label}</h3>
                <span className="text-xs font-mono text-slate-400">{selectedNode.id}</span>
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
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
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
            </div>

            <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-brand-400" />
              Direct DAG node in BrandTrace BKG Engine
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
