import { useState, useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronUp, ChevronDown, Locate, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { useReactFlow } from 'reactflow';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
// [Fix] AnalysisResult 타입이 사용되지 않아 에러가 발생했으므로, 명시적 타입 선언에 사용합니다.
import type { AnalysisResult } from '../../../types/workflow';

export function AnalysisConsole() {
    const [isExpanded, setExpanded] = useState(false);
    const analysisResults = useWorkflowStore((state) => state.analysisResults);
    // [Fix] zoomTo가 사용되지 않아 에러가 발생했으므로 제거합니다.
    const { setCenter } = useReactFlow();

    // 1. 결과 Flattening 및 통계 계산
    // [Fix] 타입을 명시하여 unused import 에러 해결
    const flatResults: AnalysisResult[] = useMemo(() => {
        return Object.values(analysisResults).flat();
    }, [analysisResults]);

    const stats = useMemo(() => {
        return {
            error: flatResults.filter(r => r.severity === 'ERROR').length,
            warning: flatResults.filter(r => r.severity === 'WARNING').length,
            info: flatResults.filter(r => r.severity === 'INFO').length,
        };
    }, [flatResults]);

    // 이슈가 없으면 렌더링하지 않음 (또는 "All Good" 상태 표시)
    if (flatResults.length === 0) return null;

    // 2. 노드로 이동하는 핸들러
    const handleFocusNode = (nodeId: string) => {
        if (!nodeId || nodeId === 'global') return;

        // ReactFlow의 setCenter를 사용하여 해당 노드로 이동
        const node = useWorkflowStore.getState().nodes.find(n => n.id === nodeId);
        if (node) {
            setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
        }
    };

    return (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-2xl px-4">

            {/* EXPANDED LIST VIEW */}
            {isExpanded && (
                <div className="w-full bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 mb-2 max-h-[400px] flex flex-col">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analysis Report</span>
                        <button onClick={() => setExpanded(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
                            <ChevronDown size={16} />
                        </button>
                    </div>

                    <div className="overflow-y-auto p-2 custom-scrollbar space-y-2">
                        {flatResults.map((result, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group cursor-pointer"
                                onClick={() => handleFocusNode(result.targetNodeId)}
                            >
                                <div className={clsx(
                                    "p-1.5 rounded-full mt-0.5 flex-shrink-0",
                                    result.severity === 'ERROR' ? "bg-red-100 text-red-600" :
                                        result.severity === 'WARNING' ? "bg-amber-100 text-amber-600" :
                                            "bg-blue-100 text-blue-600"
                                )}>
                                    {result.severity === 'ERROR' ? <AlertCircle size={14} /> :
                                        result.severity === 'WARNING' ? <AlertTriangle size={14} /> : <Info size={14} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-sm font-bold text-slate-800 truncate">{result.type.replace(/_/g, ' ')}</h4>
                                        {result.targetNodeId && result.targetNodeId !== 'global' && (
                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono flex items-center gap-1 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <Locate size={10} />
                                                {result.targetNodeId}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{result.message}</p>
                                    {result.suggestion && (
                                        <div className="mt-2 flex items-center gap-2 text-[11px] text-blue-600 bg-blue-50/50 p-2 rounded border border-blue-100">
                                            <ArrowRight size={12} />
                                            <span>{result.suggestion}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* COLLAPSED STATUS BAR (Floating Pill) */}
            <button
                onClick={() => setExpanded(!isExpanded)}
                className="flex items-center gap-4 bg-white/95 backdrop-blur shadow-xl border border-slate-200 px-5 py-3 rounded-full hover:scale-105 hover:border-blue-300 transition-all duration-300 group"
            >
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700 mr-2">Architect Issues</span>

                    {stats.error > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                            <AlertCircle size={12} /> {stats.error}
                        </div>
                    )}
                    {stats.warning > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-bold">
                            <AlertTriangle size={12} /> {stats.warning}
                        </div>
                    )}
                    {stats.info > 0 && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                            <Info size={12} /> {stats.info}
                        </div>
                    )}
                </div>

                <div className="w-px h-4 bg-slate-300"></div>

                <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>
            </button>
        </div>
    );
}