import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { WorkflowCanvas } from './features/workflow/WorkflowCanvas';
import { JsonInspector } from './components/JsonInspector';
import { SuggestionPanel } from './features/workflow/components/SuggestionPanel';
import { LandingPage } from './features/workflow/components/LandingPage';
import { OutlinerPanel } from './features/workflow/components/OutlinerPanel';
import { Wand2, Code, ArrowRight, ArrowDown } from 'lucide-react'; // LayoutList 제거
import clsx from 'clsx';
import type { NodeSuggestion, ProcessDefinition } from './types/workflow';
import type { Node } from 'reactflow';

// UX Steps 정의
type WorkflowStep = 'LANDING' | 'OUTLINING' | 'VIEWING';

function App() {
    const [step, setStep] = useState<WorkflowStep>('LANDING');
    const [initialTopic, setInitialTopic] = useState('');

    const [isInspectorOpen, setInspectorOpen] = useState(false);
    // isOutlinerOpen 상태 제거 (Step으로 대체됨)

    const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([]);
    const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const {
        startTransformation,
        jobStatus,
        currentJobId,
        isCompleted,
        isProcessReady,
        getSuggestions,
        isSuggesting,
        isTransforming
    } = useWorkflowGenerator();

    const setProcess = useWorkflowStore((state) => state.setProcess);
    const layoutDirection = useWorkflowStore((state) => state.layoutDirection);
    const setLayoutDirection = useWorkflowStore((state) => state.setLayoutDirection);
    const applySuggestion = useWorkflowStore((state) => state.applySuggestion);

    useEffect(() => {
        if (jobStatus?.processResponse) {
            setProcess(jobStatus.processResponse);
            if (step !== 'VIEWING') {
                setStep('VIEWING');
            }
        }
    }, [jobStatus?.processResponse, setProcess, step]);

    // Step 1: Landing -> Outlining
    const handleStartDrafting = (topic: string) => {
        setInitialTopic(topic);
        setStep('OUTLINING');
    };

    // Step 2: Outlining -> Generating
    const handleTransform = (definition: ProcessDefinition) => {
        startTransformation(definition);
        // Step은 useEffect에서 jobStatus 변경 시 VIEWING으로 전환됨
    };

    // ... Node Interaction logic ...
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
            id: n.id,
            type: n.type,
            data: {
                label: n.data.label,
                swimlaneId: n.data.swimlaneId,
                configuration: n.data.configuration
            }
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

    // RENDER: Step 1 - Landing Page
    if (step === 'LANDING') {
        return <LandingPage onStart={handleStartDrafting} />;
    }

    // RENDER: Step 2 - Outlining Panel (Full Screen)
    if (step === 'OUTLINING') {
        return (
            <OutlinerPanel
                isOpen={true}
                onClose={() => {}}
                process={null}
                onTransform={handleTransform}
                initialTopic={initialTopic}
            />
        );
    }

    // RENDER: Step 3 - Viewing (Canvas)
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
                        <Wand2 size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-800 text-sm leading-tight">
                            {jobStatus?.processResponse?.processName || initialTopic || 'Designing Process...'}
                        </h1>
                        <p className="text-[10px] text-slate-400 font-medium">AI Architect Ver 8.2</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Progress Indicator */}
                    {!isCompleted && (
                        <div className="flex items-center gap-3 mr-4 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.PROCESS ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
                                <span className="text-[10px] font-bold text-slate-500">Map</span>
                            </div>
                            <div className="w-px h-3 bg-slate-200" />
                            <div className="flex items-center gap-1.5">
                                <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.DATA ? "bg-green-500" : "bg-slate-200")} />
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
                        {/* List View 버튼 제거됨 (Outliner가 별도 단계로 분리되었으므로) */}
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
                {/* Loading State */}
                {(isTransforming || !isProcessReady) && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
                        {/* Loading Spinner... (Same as before) */}
                        <div className="text-center space-y-6 max-w-md">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                                <Wand2 className="absolute inset-0 m-auto text-blue-600 w-8 h-8 animate-pulse" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Generating Process Map...</h2>
                                <p className="text-slate-500 text-sm">Converting your outline into BPMN structure</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Workflow Canvas */}
                <div className={clsx("w-full h-full transition-opacity duration-700", isProcessReady ? "opacity-100" : "opacity-0 scale-95 pointer-events-none")}>
                    <WorkflowCanvas onNodeClick={handleNodeClick} />
                </div>

                <JsonInspector
                    isOpen={isInspectorOpen}
                    onClose={() => setInspectorOpen(false)}
                    data={jobStatus || null}
                />

                {/* OutlinerPanel (Modal) 제거됨 -> Step 2 화면으로 변경됨 */}

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