import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { WorkflowCanvas } from './features/workflow/WorkflowCanvas';
import { JsonInspector } from './components/JsonInspector';
import { SuggestionPanel } from './features/workflow/components/SuggestionPanel';
import { LandingPage } from './features/workflow/components/LandingPage';
import { OutlinerPanel } from './features/workflow/components/OutlinerPanel';
import { Wand2, Code, ArrowRight, ArrowDown, CheckCircle2, Loader2, Sparkles, LayoutList } from 'lucide-react';
import clsx from 'clsx';
import type { NodeSuggestion, ProcessDefinition, JobStatus } from './types/workflow';
import type { Node } from 'reactflow';

// [Fix] Ensure WorkflowStep type is defined
type WorkflowStep = 'LANDING' | 'OUTLINING' | 'VIEWING';

// [New] Generating Overlay Component
function GeneratingOverlay({ message, isVisible }: { message: string; isVisible: boolean }) {
    if (!isVisible) return null;
    return (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-full max-w-md space-y-8 text-center">
                <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Wand2 className="w-12 h-12 text-blue-600 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-800">Architecting Structure</h2>
                    <p className="text-slate-500 text-lg animate-pulse">{message || "Analyzing requirements..."}</p>
                </div>
            </div>
        </div>
    );
}

function AiStatusWidget({ status, message }: { status: JobStatus | null | undefined, message: string }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const isProcessDone = !!status?.stageDurations?.PROCESS;
    const isDataDone = !!status?.stageDurations?.DATA;
    const isFormDone = !!status?.stageDurations?.FORM;
    const isAllDone = status?.state === 'COMPLETED';
    const showWidget = isProcessDone && !isAllDone;

    if (!showWidget) return null;

    return (
        <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden w-80">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-3 flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles size={16} className="animate-pulse" />
                        <span className="text-xs font-bold">AI Co-Architect Working</span>
                    </div>
                    {isExpanded ? <ArrowDown size={14} className="text-white/80" /> : <ArrowRight size={14} className="text-white/80" />}
                </div>
                {isExpanded && (
                    <div className="p-4 bg-slate-50 space-y-4">
                        <div className="space-y-3">
                            {/* Step 1: Map (Done) */}
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="p-1.5 bg-green-100 text-green-600 rounded-full"><CheckCircle2 size={14} /></div>
                                <div className="flex-1"><p className="text-xs font-bold text-slate-700">Process Map</p></div>
                            </div>
                            {/* Step 2: Data */}
                            <div className={clsx("flex items-center gap-3", isDataDone ? "opacity-50" : "opacity-100")}>
                                <div className={clsx("p-1.5 rounded-full transition-colors", isDataDone ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
                                    {/* [Fix] Using Loader2 here fixes the unused import error */}
                                    {isDataDone ? <CheckCircle2 size={14} /> : <Loader2 size={14} className="animate-spin" />}
                                </div>
                                <div className="flex-1"><p className="text-xs font-bold text-slate-700">Data Modeling</p></div>
                            </div>
                            {/* Step 3: Form */}
                            <div className={clsx("flex items-center gap-3", !isDataDone ? "opacity-30" : "opacity-100")}>
                                <div className={clsx("p-1.5 rounded-full transition-colors", isFormDone ? "bg-green-100 text-green-600" : (isDataDone && !isFormDone) ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400")}>
                                    {isFormDone ? <CheckCircle2 size={14} /> : (isDataDone && !isFormDone) ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1"><p className="text-xs font-bold text-slate-700">Form UX</p></div>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-200">
                            <p className="text-[10px] font-mono text-blue-600 animate-pulse truncate">&gt; {message || "Processing..."}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function App() {
    // [Fix] WorkflowStep is now defined above
    const [step, setStep] = useState<WorkflowStep>('LANDING');
    const [initialTopic, setInitialTopic] = useState('');

    const [isInspectorOpen, setInspectorOpen] = useState(false);
    const [isSideOutlinerOpen, setSideOutlinerOpen] = useState(false);

    const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([]);
    const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const {
        startTransformation,
        jobStatus,
        currentJobId,
        isProcessReady,
        getSuggestions,
        isSuggesting,
        isTransforming,
        isProcessing,
        isCompleted // [Fix] Added missing isCompleted
    } = useWorkflowGenerator();

    const setProcess = useWorkflowStore((state) => state.setProcess);
    const layoutDirection = useWorkflowStore((state) => state.layoutDirection);
    const setLayoutDirection = useWorkflowStore((state) => state.setLayoutDirection);
    const applySuggestion = useWorkflowStore((state) => state.applySuggestion);

    // [Effect] 프로세스 생성 완료 시 화면 전환
    useEffect(() => {
        if (jobStatus?.processResponse) {
            setProcess(jobStatus.processResponse);
            // [Fix] Check if we really need to update state to avoid unnecessary renders/warnings
            if (step !== 'VIEWING') {
                setStep('VIEWING');
            }
        }
    }, [jobStatus?.processResponse, setProcess, step]);

    const handleStartDrafting = (topic: string) => {
        setInitialTopic(topic);
        setStep('OUTLINING');
    };

    const handleTransform = (definition: ProcessDefinition) => {
        startTransformation(definition);
    };

    const handleNodeClick = async (_event: MouseEvent, node: Node) => {
        if (selectedNodeId === node.id && showSuggestionPanel) {
            setShowSuggestionPanel(false);
            return;
        }
        if (!currentJobId) return;

        setSelectedNodeId(node.id);
        setShowSuggestionPanel(true);
        setSuggestions([]);

        const { nodes, edges } = useWorkflowStore.getState();
        const simplifiedNodes = nodes.map(n => ({
            id: n.id, type: n.type, data: { label: n.data.label, swimlaneId: n.data.swimlaneId, configuration: n.data.configuration }
        }));
        const graphContext = JSON.stringify({ nodes: simplifiedNodes, edges });

        try {
            const response = await getSuggestions({
                graphJson: graphContext,
                focusNodeId: node.id,
                jobId: currentJobId
            });
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

    const showBlockingOverlay = isTransforming || (isProcessing && !jobStatus?.processResponse && step === 'OUTLINING');

    if (step === 'LANDING') {
        return <LandingPage onStart={handleStartDrafting} />;
    }

    if (step === 'OUTLINING') {
        return (
            <>
                <GeneratingOverlay isVisible={showBlockingOverlay} message={jobStatus?.message || "Analyzing structure..."} />
                <div className={clsx("w-full h-full transition-opacity duration-500", showBlockingOverlay ? "opacity-0" : "opacity-100")}>
                    <OutlinerPanel isOpen={true} onClose={() => {}} process={null} onTransform={handleTransform} initialTopic={initialTopic} />
                </div>
            </>
        );
    }

    // VIEWING
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
            <AiStatusWidget status={jobStatus} message={jobStatus?.message || ''} />

            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
                        <Wand2 size={18} />
                    </div>
                    <div>
                        <button
                            onClick={() => setSideOutlinerOpen(true)}
                            className="flex items-center gap-2 hover:bg-slate-50 p-1 -ml-1 rounded-lg transition-colors group"
                        >
                            <h1 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                                {jobStatus?.processResponse?.processName || initialTopic || 'Designing Process...'}
                            </h1>
                            <LayoutList size={14} className="text-slate-400 group-hover:text-blue-500" />
                        </button>
                        <p className="text-[10px] text-slate-400 font-medium">AI Architect Ver 8.2</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isCompleted && (
                        <div className="flex items-center gap-3 mr-4 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.PROCESS ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
                                <span className="text-[10px] font-bold text-slate-500">Map</span>
                            </div>
                            <div className="w-px h-3 bg-slate-200" />
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.DATA ? "bg-green-500" : (!jobStatus?.stageDurations?.PROCESS ? "bg-slate-200" : "bg-blue-500 animate-pulse"))} />
                                <span className="text-[10px] font-bold text-slate-500">Data</span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1">
                        <button onClick={() => setLayoutDirection('LR')} className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", layoutDirection === 'LR' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                            <ArrowRight size={14} /> LR
                        </button>
                        <button onClick={() => setLayoutDirection('TB')} className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", layoutDirection === 'TB' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                            <ArrowDown size={14} /> TB
                        </button>
                    </div>

                    <div className="h-5 w-px bg-slate-300 mx-1" />

                    <button onClick={() => setInspectorOpen(true)} className={clsx("flex items-center gap-2 text-xs font-bold px-3 py-1.5 border rounded-lg transition-colors", isInspectorOpen ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600 border-slate-200 hover:bg-slate-50")}>
                        <Code size={14} /> JSON
                    </button>
                    <button onClick={() => window.location.reload()} className="text-xs font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                        New
                    </button>
                </div>
            </header>

            <div className="flex-1 relative overflow-hidden bg-slate-50">
                <div className={clsx("w-full h-full transition-opacity duration-1000", isProcessReady ? "opacity-100" : "opacity-0")}>
                    <WorkflowCanvas onNodeClick={handleNodeClick} />
                </div>

                <JsonInspector isOpen={isInspectorOpen} onClose={() => setInspectorOpen(false)} data={jobStatus || null} />

                <OutlinerPanel
                    isOpen={isSideOutlinerOpen}
                    onClose={() => setSideOutlinerOpen(false)}
                    process={jobStatus?.processResponse || null}
                    mode="SIDE"
                />

                {showSuggestionPanel && (
                    <SuggestionPanel suggestions={suggestions} isLoading={isSuggesting} onApply={handleApplySuggestion} onClose={() => setShowSuggestionPanel(false)} />
                )}
            </div>
        </div>
    );
}

export default App;