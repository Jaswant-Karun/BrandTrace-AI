import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Shield, FileText, CheckCircle2, AlertTriangle, Stamp, Flag, Sparkles, Layers } from 'lucide-react';

export const BrandNode = memo(({ data }: NodeProps) => {
  const nodeType = (data.nodeType as string) || 'ASSET';
  const label = (data.label as string) || (data.id as string);
  const description = (data.description as string) || '';
  const id = data.id as string;

  // Color & Icon mapping
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'BRAND':
        return {
          border: 'border-cyan-500/50 hover:border-cyan-400',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <Shield className="w-3.5 h-3.5 text-cyan-400" />,
          title: 'Brand Entity'
        };
      case 'PILLAR':
        return {
          border: 'border-blue-500/50 hover:border-blue-400',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
          title: 'Brand Pillar'
        };
      case 'TONE_ATTRIBUTE':
        return {
          border: 'border-rose-500/50 hover:border-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" />,
          title: 'Tone Attribute'
        };
      case 'APPROVED_CLAIM':
        return {
          border: 'border-emerald-500/50 hover:border-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          title: 'Approved Claim'
        };
      case 'PROHIBITED_CLAIM':
        return {
          border: 'border-red-500/60 hover:border-red-400',
          badge: 'bg-red-500/20 text-red-300 border-red-500/40',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
          title: 'Prohibited Claim'
        };
      case 'TRADEMARK':
        return {
          border: 'border-purple-500/50 hover:border-purple-400',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Stamp className="w-3.5 h-3.5 text-purple-400" />,
          title: 'Protected Mark'
        };
      case 'REGULATION':
        return {
          border: 'border-amber-500/60 hover:border-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Flag className="w-3.5 h-3.5 text-amber-400" />,
          title: 'Regulatory Code'
        };
      case 'CAMPAIGN':
        return {
          border: 'border-indigo-500/50 hover:border-indigo-400',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          icon: <FileText className="w-3.5 h-3.5 text-indigo-400" />,
          title: 'Campaign'
        };
      case 'ASSET':
      default:
        return {
          border: 'border-teal-500/50 hover:border-teal-400',
          badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          icon: <FileText className="w-3.5 h-3.5 text-teal-400" />,
          title: 'Release Asset'
        };
    }
  };

  const config = getTypeConfig(nodeType);

  return (
    <div className={`px-4 py-3 rounded-xl bg-slate-900/95 backdrop-blur-md border ${config.border} shadow-xl shadow-black/40 min-w-[220px] max-w-[260px] transition-all duration-200 cursor-pointer`}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-slate-400 !border-slate-800" />
      
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${config.badge}`}>
          {config.icon}
          {config.title}
        </span>
        <span className="text-[10px] font-mono text-slate-400">{id}</span>
      </div>

      <div className="font-semibold text-xs text-white leading-tight mb-1 truncate" title={label}>
        {label}
      </div>

      {description && (
        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {description}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-brand-400 !border-slate-800" />
    </div>
  );
});

BrandNode.displayName = 'BrandNode';
