import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Shield, FileText, CheckCircle2, AlertTriangle, Stamp, Flag, Sparkles, Layers } from 'lucide-react';

export const BrandNode = memo(({ data }: NodeProps) => {
  const nodeType = (data.nodeType as string) || 'ASSET';
  const label = (data.label as string) || (data.id as string);
  const description = (data.description as string) || '';
  const id = data.id as string;

  // Clean, restrained enterprise badge mapping
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'BRAND':
        return {
          border: 'border-slate-300 hover:border-slate-400',
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: <Shield className="w-3.5 h-3.5 text-slate-700" />,
          title: 'Brand Entity'
        };
      case 'PILLAR':
        return {
          border: 'border-blue-200 hover:border-blue-300',
          badge: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Layers className="w-3.5 h-3.5 text-blue-600" />,
          title: 'Brand Pillar'
        };
      case 'TONE_ATTRIBUTE':
        return {
          border: 'border-purple-200 hover:border-purple-300',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
          title: 'Tone Attribute'
        };
      case 'APPROVED_FACT':
        return {
          border: 'border-emerald-300 hover:border-emerald-400',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          title: 'Approved Fact'
        };
      case 'GUIDELINE':
      case 'BRAND_GUIDELINE':
        return {
          border: 'border-amber-300 hover:border-amber-400',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Flag className="w-3.5 h-3.5 text-amber-600" />,
          title: 'Brand Guideline'
        };
      case 'APPROVED_CLAIM':
        return {
          border: 'border-teal-300 hover:border-teal-400',
          badge: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />,
          title: 'Approved Claim'
        };
      case 'PROHIBITED_CLAIM':
        return {
          border: 'border-rose-300 hover:border-rose-400',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          title: 'Prohibited Claim'
        };
      case 'TRADEMARK':
        return {
          border: 'border-violet-200 hover:border-violet-300',
          badge: 'bg-violet-50 text-violet-700 border-violet-200',
          icon: <Stamp className="w-3.5 h-3.5 text-violet-600" />,
          title: 'Protected Mark'
        };
      case 'REGULATION':
        return {
          border: 'border-orange-300 hover:border-orange-400',
          badge: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: <Flag className="w-3.5 h-3.5 text-orange-600" />,
          title: 'Regulatory Code'
        };
      case 'CAMPAIGN':
        return {
          border: 'border-indigo-200 hover:border-indigo-300',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <FileText className="w-3.5 h-3.5 text-indigo-600" />,
          title: 'Campaign'
        };
      case 'ASSET':
      default:
        return {
          border: 'border-slate-200 hover:border-slate-300',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <FileText className="w-3.5 h-3.5 text-slate-600" />,
          title: 'Release Asset'
        };
    }
  };

  const config = getTypeConfig(nodeType);
  const isHighlighted = Boolean(data.isHighlighted);
  const isAffected = Boolean(data.isAffected);
  const isDimmed = Boolean(data.isDimmed);

  const containerClasses = isAffected
    ? 'border-amber-400 bg-amber-50/70 shadow-sm ring-2 ring-amber-400/50'
    : isHighlighted
    ? 'border-slate-900 bg-slate-50 shadow-md ring-2 ring-slate-900/20 scale-[1.02]'
    : isDimmed
    ? 'opacity-30 border-slate-200 bg-slate-50'
    : `${config.border} bg-white shadow-xs`;

  return (
    <div className={`px-4 py-3 rounded-xl border ${containerClasses} min-w-[220px] max-w-[260px] transition-all duration-200 cursor-pointer`}>
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-slate-400 !border-white" />
      
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${config.badge}`}>
          {config.icon}
          {config.title}
        </span>
        {isAffected ? (
          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
            AFFECTED
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-400">{id}</span>
        )}
      </div>

      <div className="font-semibold text-xs text-slate-900 leading-tight mb-1 truncate" title={label}>
        {label}
      </div>

      {description && (
        <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {description}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-slate-700 !border-white" />
    </div>
  );
});

BrandNode.displayName = 'BrandNode';
