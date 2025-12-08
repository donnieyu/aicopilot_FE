import { useEffect, useState, useRef } from 'react';
import { useWorkflowStore } from '../../../../store/useWorkflowStore';
import clsx from 'clsx';
import { ZoomIn, ZoomOut, FileText, Info, Quote, RotateCcw, Maximize, Minimize, CheckCircle2 } from 'lucide-react';
import type { SourceReference } from '../../../../types/workflow';
import { PanelHeader } from '../../../../components/PanelHeader';

interface AssetViewerProps {
    fileUrl: string | null;
}

export function AssetViewer({ fileUrl }: AssetViewerProps) {
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPanelExpanded, setIsPanelExpanded] = useState(true); // 하단 패널 접기/펴기 상태

    // Global State
    const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
    const nodes = useWorkflowStore((state) => state.nodes);
    const selectNode = useWorkflowStore((state) => state.selectNode);
    const processMetadata = useWorkflowStore((state) => state.processMetadata);

    // 1. 현재 선택된 노드 및 SourceRef
    const activeNode = nodes.find(n => n.id === selectedNodeId);
    const activeSourceRef = activeNode?.data?.sourceRef as SourceReference | undefined;

    // 2. 전체 매핑 정보
    const allMappedRefs = nodes
        .filter(n => n.data.sourceRef)
        .map(n => ({ nodeId: n.id, ref: n.data.sourceRef as SourceReference }));

    // Auto-scroll logic
    useEffect(() => {
        if (activeSourceRef && activeSourceRef.rects.length > 0 && containerRef.current) {
            const firstRect = activeSourceRef.rects[0];
            const scrollY = (firstRect.y / 100) * containerRef.current.scrollHeight;
            const containerHeight = containerRef.current.clientHeight;
            containerRef.current.scrollTo({ top: scrollY - (containerHeight / 2), behavior: 'smooth' });
        }
    }, [activeSourceRef]);

    // 배경 클릭 시 선택 해제 (전체 설명 보기)
    const handleBackgroundClick = () => {
        selectNode(null);
    };

    // [New] Confidence Color Helper
    const getConfidenceColor = (conf: number) => {
        if (conf >= 0.9) return "bg-green-500";
        if (conf >= 0.7) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getConfidenceTextClass = (conf: number) => {
        if (conf >= 0.9) return "text-green-600";
        if (conf >= 0.7) return "text-yellow-600";
        return "text-red-600";
    };

    if (!fileUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold">No Asset Loaded</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-100 border-r border-slate-200 relative overflow-hidden">

            {/* 1. Header / Toolbar (Top) */}
            <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-10 flex-shrink-0 shadow-sm">
                <span className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2 tracking-wider">
                    <FileText size={14} className="text-indigo-500" />
                    Source Viewer
                </span>
                <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-white rounded text-slate-500 transition-colors"><ZoomOut size={14} /></button>
                    <span className="text-[10px] font-mono w-8 text-center text-slate-600">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 hover:bg-white rounded text-slate-500 transition-colors"><ZoomIn size={14} /></button>
                </div>
            </div>

            {/* 2. Viewer Content (Flexible Area) */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-8 custom-scrollbar relative cursor-grab active:cursor-grabbing bg-slate-200/50"
                onClick={handleBackgroundClick}
            >
                <div
                    className="relative bg-white shadow-xl transition-transform origin-top-left duration-200 ease-out rounded-lg overflow-hidden mx-auto"
                    style={{ transform: `scale(${zoom})`, width: '100%', minHeight: '100%' }}
                >
                    <img src={fileUrl} alt="Asset Source" className="w-full h-auto block select-none pointer-events-none" />

                    {/* Overlay Layer */}
                    <div className="absolute inset-0">
                        {allMappedRefs.map(({ nodeId, ref }) => (
                            ref.rects.map((rect, idx) => {
                                const isActive = nodeId === selectedNodeId;
                                return (
                                    <div
                                        key={`${nodeId}-${idx}`}
                                        className={clsx(
                                            "absolute border-2 cursor-pointer transition-all duration-300 rounded-sm group",
                                            isActive
                                                ? "border-blue-500 bg-blue-500/20 z-20 shadow-[0_0_20px_rgba(59,130,246,0.5)] ring-2 ring-blue-400/30"
                                                : "border-indigo-400/30 bg-indigo-500/5 hover:bg-indigo-500/20 hover:border-indigo-500 z-10"
                                        )}
                                        style={{
                                            left: `${rect.x}%`,
                                            top: `${rect.y}%`,
                                            width: `${rect.w}%`,
                                            height: `${rect.h}%`
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectNode(nodeId);
                                        }}
                                    >
                                        {/* Hover Tooltip (Mini) - Only show when NOT active */}
                                        {!isActive && (
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-lg">
                                                Click to Verify
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Fixed Bottom Insight Panel */}
            <div className={clsx(
                "bg-white border-t border-slate-200 flex flex-col shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] z-20 transition-all duration-300 ease-in-out",
                isPanelExpanded ? "h-[35%]" : "h-[50px]" // 높이 조절
            )}>
                {/* [Refactor] Replaced manual header with PanelHeader */}
                <div onClick={() => setIsPanelExpanded(!isPanelExpanded)} className="cursor-pointer">
                    <PanelHeader
                        title={activeNode ? "Node Analysis" : "Process Overview"}
                        icon={activeNode ? Info : FileText}
                        iconClassName={activeNode ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"}
                        className="bg-slate-50/80 hover:bg-slate-100 transition-colors"
                        actions={[
                            // 조건부 렌더링: activeNode가 있을 때만 Reset 버튼 표시
                            ...(activeNode ? [{
                                icon: RotateCcw,
                                label: "Reset",
                                onClick: (e: React.MouseEvent) => { e.stopPropagation(); selectNode(null); },
                                title: "Back to Overview",
                                variant: 'default' as const
                            }] : []),
                            // Expand/Collapse 버튼
                            {
                                icon: isPanelExpanded ? Minimize : Maximize,
                                onClick: (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    setIsPanelExpanded(!isPanelExpanded);
                                },
                                title: isPanelExpanded ? "Collapse Panel" : "Expand Panel"
                            }
                        ]}
                    />
                </div>

                {/* Panel Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-white">
                    {activeNode ? (
                        // [Context A] Node Detail View
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
                                <span className={clsx(
                                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border mt-0.5",
                                    (activeNode.type || '').includes('USER') ? "bg-blue-50 text-blue-600 border-blue-100" :
                                        (activeNode.type || '').includes('SERVICE') ? "bg-purple-50 text-purple-600 border-purple-100" :
                                            "bg-orange-50 text-orange-600 border-orange-100"
                                )}>
                                    {/* [Fix] Safe access to type string */}
                                    {(activeNode.type || '').replace('_', ' ')}
                                </span>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-800 leading-tight">{activeNode.data.label}</h3>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{activeNode.data.description}</p>
                                </div>
                            </div>

                            {activeSourceRef ? (
                                <div className="relative pl-4 border-l-4 border-indigo-200 bg-indigo-50/30 p-3 rounded-r-xl">
                                    <Quote size={14} className="text-indigo-300 absolute top-3 left-[-22px] fill-white" />

                                    {/* Snippet */}
                                    <p className="text-xs text-slate-700 italic leading-relaxed font-medium mb-2">
                                        "{activeSourceRef.snippet || 'No text extracted'}"
                                    </p>

                                    {/* Confidence & Reason Bar */}
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-indigo-100/50">
                                        {/* Reason Display */}
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                            <CheckCircle2 size={12} className={clsx(getConfidenceTextClass(activeSourceRef.confidence))} />
                                            <span className="font-medium">
                                                {activeSourceRef.reason || "AI Logic matched successfully"}
                                            </span>
                                        </div>

                                        {/* Confidence Meter */}
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-12 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className={clsx("h-full rounded-full", getConfidenceColor(activeSourceRef.confidence))}
                                                    style={{ width: `${Math.round(activeSourceRef.confidence * 100)}%` }}
                                                />
                                            </div>
                                            <span className={clsx("text-[9px] font-mono font-bold", getConfidenceTextClass(activeSourceRef.confidence))}>
                                                {Math.round(activeSourceRef.confidence * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                                    <p className="text-xs text-slate-400 italic">No visual evidence detected for this node.</p>
                                </div>
                            )}

                            {/* AI Reasoning Static Text (Fallback or Additional Context) */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1 h-1 rounded-full bg-slate-400"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Architecture Logic</span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    Mapped to <b>{activeNode.data.swimlaneId?.replace('lane_', '') || 'Main Lane'}</b> based on spatial position.
                                    {activeNode.type === 'EXCLUSIVE_GATEWAY' ? " Detected as a branching point due to diamond shape." : " Identified as a standard task step."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        // [Context B] Global Overview
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-800 leading-tight mb-2">
                                    {processMetadata?.name || "Analyzed Process Flow"}
                                </h2>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-green-100 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        {nodes.filter(n => n.type !== 'SWIMLANE' && n.type !== 'START' && n.type !== 'END').length} Steps Detected
                                    </span>
                                    <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-blue-100">
                                        Asset-Driven Generation
                                    </span>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none">
                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    {processMetadata?.description || "The AI has successfully analyzed the uploaded asset and extracted the complete process flow. You can verify the results by clicking on the highlighted regions in the image above or selecting nodes in the diagram."}
                                </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                                    <Info size={12} />
                                    Click on any highlighted area in the image above to see detailed evidence.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}