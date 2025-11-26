import { useEffect, useState, useRef } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { WorkflowCanvas } from './features/workflow/WorkflowCanvas';
import { JsonInspector } from './components/JsonInspector';
import { SuggestionPanel } from './features/workflow/components/SuggestionPanel';
// [Fix] 경로 수정 (Alias 사용)
import { OutlinerPanel } from '@/features/workflow/components/OutlinerPanel';
// [Fix] 미사용 List 제거, LayoutList 사용 확인
import { Wand2, Code, ArrowRight, ArrowDown, Sparkles, LayoutList } from 'lucide-react';
import clsx from 'clsx';
import type { NodeSuggestion } from './types/workflow';
import type { Node } from 'reactflow';

function App() {
    const [prompt, setPrompt] = useState('');
    const [isInspectorOpen, setInspectorOpen] = useState(false);
    const [isOutlinerOpen, setOutlinerOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([]);
    const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const {
        startJob,
        jobStatus,
        isCompleted, // Header 프로그레스 바에서 사용됨
        isProcessReady,
        getSuggestions,
        isSuggesting
    } = useWorkflowGenerator();

    const setProcess = useWorkflowStore((state) => state.setProcess);
    const layoutDirection = useWorkflowStore((state) => state.layoutDirection);
    const setLayoutDirection = useWorkflowStore((state) => state.setLayoutDirection);
    const applySuggestion = useWorkflowStore((state) => state.applySuggestion);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (jobStatus?.processResponse) {
            setProcess(jobStatus.processResponse);
        }
    }, [jobStatus?.processResponse, setProcess]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setHasStarted(true);
        startJob(prompt);
    };

    const handleNodeClick = async (_event: MouseEvent, node: Node) => {
        if (selectedNodeId === node.id && showSuggestionPanel) {
            setShowSuggestionPanel(false);
            return;
        }
        setSelectedNodeId(node.id);
        setShowSuggestionPanel(true);
        setSuggestions([]);

        const { nodes, edges } = useWorkflowStore.getState();
        const simplifiedNodes = nodes.map(n => ({
            id: n.id, type: n.type, data: { label: n.data.label, swimlaneId: n.data.swimlaneId, configuration: n.data.configuration }
        }));
        const simplifiedEdges = edges.map(e => ({ source: e.source, target: e.target, label: e.label }));
        const graphContext = JSON.stringify({ nodes: simplifiedNodes, edges: simplifiedEdges });

        try {
            const response = await getSuggestions({ graphJson: graphContext, focusNodeId: node.id });
            if (response?.suggestions) setSuggestions(response.suggestions);
        } catch (e) {
            console.error(e);
        }
    };

    const handleApplySuggestion = (suggestion: NodeSuggestion) => {
        if (selectedNodeId) {
            applySuggestion(suggestion, selectedNodeId);
            setShowSuggestionPanel(false);
            setSuggestions([]);
        }
    };

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center p-6 transition-all duration-500">
                <div className="w-full max-w-3xl flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-4">
                            <Wand2 className="w-10 h-10 text-blue-600" />
                        </div>
                        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
                            AI Workflow Architect
                        </h1>
                        <p className="text-lg text-slate-500 max-w-xl mx-auto">
                            복잡한 비즈니스 프로세스, 말 한마디로 설계하세요.<br/>
                            AI가 구조 설계부터 데이터 모델링, 폼 디자인까지 한 번에 완성합니다.
                        </p>
                    </div>

                    <div className="w-full relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <form onSubmit={handleSubmit} className="relative flex items-center bg-white rounded-xl p-2 shadow-2xl border border-slate-100">
                            <div className="pl-4 pr-2 text-slate-400">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="예: 휴가 신청 및 승인 프로세스를 만들어줘"
                                className="flex-1 py-4 px-2 text-lg outline-none text-slate-700 placeholder:text-slate-300 bg-transparent"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!prompt.trim()}
                                className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all duration-200"
                            >
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </form>
                    </div>

                    <div className="flex gap-3 text-sm text-slate-400">
                        <span className="px-3 py-1 bg-slate-100 rounded-full">비용 처리 프로세스</span>
                        <span className="px-3 py-1 bg-slate-100 rounded-full">신규 입사자 온보딩</span>
                        <span className="px-3 py-1 bg-slate-100 rounded-full">계약서 검토 요청</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
                        <Wand2 size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 text-sm leading-tight">
                            {jobStatus?.processResponse?.processName || 'Designing Process...'}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium">AI Architect Ver 7.2</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Progress Indicator (Header) */}
                    {!isCompleted && (
                        <div className="flex items-center gap-3 mr-4 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.PROCESS ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
                                <span className={clsx("text-[10px] font-bold", jobStatus?.stageDurations?.PROCESS ? "text-slate-500" : "text-blue-600")}>
                                    Map
                                </span>
                            </div>
                            <div className="w-px h-3 bg-slate-200" />
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-2 h-2 rounded-full", !jobStatus?.stageDurations?.PROCESS ? "bg-slate-200" : jobStatus?.stageDurations?.DATA ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
                                <span className={clsx("text-[10px] font-bold", !jobStatus?.stageDurations?.PROCESS ? "text-slate-300" : jobStatus?.stageDurations?.DATA ? "text-slate-500" : "text-blue-600")}>
                                    Data
                                </span>
                            </div>
                            <div className="w-px h-3 bg-slate-200" />
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-2 h-2 rounded-full", !jobStatus?.stageDurations?.DATA ? "bg-slate-200" : jobStatus?.stageDurations?.FORM ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
                                <span className={clsx("text-[10px] font-bold", !jobStatus?.stageDurations?.DATA ? "text-slate-300" : jobStatus?.stageDurations?.FORM ? "text-slate-500" : "text-blue-600")}>
                                    Form
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1">
                        <button
                            onClick={() => setLayoutDirection('LR')}
                            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", layoutDirection === 'LR' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            <ArrowRight size={14} /> LR
                        </button>
                        <button
                            onClick={() => setLayoutDirection('TB')}
                            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", layoutDirection === 'TB' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            <ArrowDown size={14} /> TB
                        </button>
                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                        {/* Outliner Button */}
                        <button
                            onClick={() => setOutlinerOpen(!isOutlinerOpen)}
                            className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", isOutlinerOpen ? "bg-blue-100 text-blue-700 shadow-inner" : "text-slate-600 hover:bg-white hover:shadow-sm")}
                            title="Toggle List View"
                        >
                            <LayoutList size={14} /> List
                        </button>
                    </div>

                    <div className="h-5 w-px bg-slate-300 mx-1" />

                    <button
                        onClick={() => setInspectorOpen(true)}
                        className={clsx("flex items-center gap-2 text-xs font-bold px-3 py-1.5 border rounded-lg transition-colors", isInspectorOpen ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600 border-slate-200 hover:bg-slate-50")}
                    >
                        <Code size={14} /> JSON
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                        New
                    </button>
                </div>
            </header>

            <div className="flex-1 relative overflow-hidden">
                {/* Initial Loading Overlay (Process 맵이 나오기 전까지만 표시) */}
                {!isProcessReady && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
                        <div className="text-center space-y-6 max-w-md">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                <Wand2 className="absolute inset-0 m-auto text-blue-600 w-8 h-8 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">AI가 프로세스 구조를 설계 중입니다</h2>
                                <p className="text-slate-500 text-sm">{prompt}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Canvas (데이터가 있으면 표시) */}
                <div className={clsx("w-full h-full transition-opacity duration-700", isProcessReady ? "opacity-100" : "opacity-0 scale-95")}>
                    <WorkflowCanvas onNodeClick={handleNodeClick} />
                </div>

                {/* Panels */}
                <JsonInspector
                    isOpen={isInspectorOpen}
                    onClose={() => setInspectorOpen(false)}
                    data={jobStatus || null}
                />

                <OutlinerPanel
                    isOpen={isOutlinerOpen}
                    onClose={() => setOutlinerOpen(false)}
                    process={jobStatus?.processResponse || null}
                />

                {showSuggestionPanel && (
                    <SuggestionPanel
                        suggestions={suggestions}
                        isLoading={isSuggesting}
                        onApply={handleApplySuggestion}
                        onClose={() => setShowSuggestionPanel(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default App;