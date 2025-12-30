import { useState, useMemo } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    Info,
    ChevronUp,
    ChevronDown,
    Locate,
    ArrowRight,
    Wrench,
    CheckCircle2, // [New] Healthy Icon
    RefreshCw,    // [New] Manual Trigger Icon
} from 'lucide-react';
import clsx from 'clsx';
import { useReactFlow } from 'reactflow';
import { useMutation } from '@tanstack/react-query'; // [New]
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { AnalysisResult } from '../../../types/workflow';
import { analyzeProcess } from '../../../api/workflow'; // [New]
import { ErrorFixModal } from './ErrorFixModal';

export function AnalysisConsole() {
    const [isExpanded, setExpanded] = useState(false);
    const [isFixModalOpen, setFixModalOpen] = useState(false);

    // Store Data
    const analysisResults = useWorkflowStore((state) => state.analysisResults);
    const nodes = useWorkflowStore((state) => state.nodes);
    const edges = useWorkflowStore((state) => state.edges);
    const setResults = useWorkflowStore((state) => state.setAnalysisResults);

    const { setCenter } = useReactFlow();

    // 1. 결과 Flattening 및 통계 계산
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

    const isHealthy = flatResults.length === 0;

    // [New] Manual Analysis Mutation
    const { mutate: runManualAnalysis, isPending: isAnalyzing } = useMutation({
        mutationFn: async () => {
            // Construct lightweight snapshot (Same logic as useAutoAnalysis)
            const snapshot = {
                nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    label: n.data.label,
                    nextActivityId: n.data.nextActivityId,
                    config: n.data.configuration
                })),
                edges: edges.map(e => ({
                    source: e.source,
                    target: e.target,
                    label: e.label
                }))
            };
            return await analyzeProcess(snapshot);
        },
        onSuccess: (data) => {
            setResults(data);
            // 만약 결과가 있으면 패널을 자동으로 열지 여부는 UX 선택 사항 (여기서는 유지)
        },
        onError: (err) => {
            console.error("Manual analysis failed:", err);
            alert("Failed to analyze process.");
        }
    });

    const handleFocusNode = (nodeId: string) => {
        if (!nodeId || nodeId === 'global') return;
        const node = useWorkflowStore.getState().nodes.find(n => n.id === nodeId);
        if (node) {
            setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
        }
    };

    // [Updated] Removed 'if (flatResults.length === 0) return null;' logic.
    // Now creates a persistent UI bar.

    return (
        <>
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-2xl px-4">

                {/* EXPANDED LIST VIEW (Only if there are results) */}
                {isExpanded && !isHealthy && (
                    <div className="w-full bg-white/90 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 mb-2 max-h-[400px] flex flex-col">
                        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analysis Report</span>
                                {stats.error > 0 && (
                                    <button
                                        onClick={() => setFixModalOpen(true)}
                                        className="ml-2 px-2 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded flex items-center gap-1 hover:bg-indigo-700 transition-colors shadow-sm animate-pulse"
                                    >
                                        <Wrench size={10} /> Auto-Fix
                                    </button>
                                )}
                            </div>
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
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[11px] text-blue-600 bg-blue-50/50 p-2 rounded border border-blue-100 flex-1 mr-2">
                                                    <ArrowRight size={12} />
                                                    <span>{result.suggestion}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setFixModalOpen(true); }}
                                                    className="text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 px-2 py-1.5 rounded border border-indigo-100 transition-colors whitespace-nowrap"
                                                >
                                                    Fix
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STATUS BAR (Always Visible) */}
                <div className="flex items-center gap-2 bg-white/95 backdrop-blur shadow-xl border border-slate-200 px-4 py-2 rounded-full hover:border-blue-300 transition-all duration-300 group">

                    {/* 1. Status Indicator section */}
                    <button
                        onClick={() => !isHealthy && setExpanded(!isExpanded)}
                        className={clsx("flex items-center gap-3", isHealthy ? "cursor-default" : "cursor-pointer")}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700">Audit Status</span>
                            <div className="h-4 w-px bg-slate-200"></div>
                        </div>

                        {isHealthy ? (
                            <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                <CheckCircle2 size={14} />
                                <span className="text-xs font-bold">Healthy</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {stats.error > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                                        <AlertCircle size={12} /> {stats.error}
                                    </div>
                                )}
                                {stats.warning > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-bold">
                                        <AlertTriangle size={12} /> {stats.warning}
                                    </div>
                                )}
                                {stats.info > 0 && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">
                                        <Info size={12} /> {stats.info}
                                    </div>
                                )}
                            </div>
                        )}
                    </button>

                    {/* 2. Divider */}
                    <div className="h-5 w-px bg-slate-200 mx-1"></div>

                    {/* 3. Manual Trigger Button */}
                    <button
                        onClick={() => runManualAnalysis()}
                        disabled={isAnalyzing}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                            isAnalyzing
                                ? "bg-slate-100 text-slate-400 cursor-wait"
                                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        )}
                        title="Run Logic Analysis Manually"
                    >
                        <RefreshCw size={12} className={clsx(isAnalyzing && "animate-spin")} />
                        {isAnalyzing ? "Analyzing..." : "Re-scan"}
                    </button>

                    {/* 4. Expand/Collapse Toggle (Only if not healthy) */}
                    {!isHealthy && (
                        <button
                            onClick={() => setExpanded(!isExpanded)}
                            className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {/* The Fixer Modal */}
            <ErrorFixModal
                isOpen={isFixModalOpen}
                onClose={() => setFixModalOpen(false)}
                // [Fix] Include INFO level results in the modal
                errors={flatResults.filter(r => r.severity === 'ERROR' || r.severity === 'WARNING' || r.severity === 'INFO')}
            />
        </>
    );
}