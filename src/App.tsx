import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { WorkflowCanvas } from './features/workflow/WorkflowCanvas';
import { JsonInspector } from './components/JsonInspector';
import { SuggestionPanel } from './features/workflow/components/SuggestionPanel';
import { LandingPage } from './features/workflow/components/LandingPage';
import { OutlinerPanel } from './features/workflow/components/OutlinerPanel';
import { GeneratingOverlay } from './features/workflow/components/GeneratingOverlay';
import { AiStatusWidget } from './features/workflow/components/AiStatusWidget';
import { WorkflowHeader } from './features/workflow/components/WorkflowHeader';
import clsx from 'clsx';
import type { NodeSuggestion, ProcessDefinition } from './types/workflow';
import type { Node } from 'reactflow';

type WorkflowStep = 'LANDING' | 'OUTLINING' | 'VIEWING';

function App() {
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
        isCompleted
    } = useWorkflowGenerator();

    const setProcess = useWorkflowStore((state) => state.setProcess);
    const applySuggestion = useWorkflowStore((state) => state.applySuggestion);

    // [Effect] Process Generation Complete -> Transition to Viewing
    useEffect(() => {
        if (jobStatus?.processResponse) {
            setProcess(jobStatus.processResponse);
            if (step !== 'VIEWING') {
                // [Fix] ESLint Error: Calling setState synchronously...
                // setTimeout으로 비동기 처리하여 렌더링 사이클 분리
                setTimeout(() => setStep('VIEWING'), 0);
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

    // --- RENDER START ---

    if (step === 'LANDING') {
        return <LandingPage onStart={handleStartDrafting} />;
    }

    if (step === 'OUTLINING') {
        return (
            <>
                <GeneratingOverlay isVisible={showBlockingOverlay} message={jobStatus?.message || "Analyzing structure..."} />
                <div className={clsx("w-full h-full transition-opacity duration-500", showBlockingOverlay ? "opacity-0" : "opacity-100")}>
                    {/* [Fix] mode prop explicitly set to FULL (optional as it's default) */}
                    <OutlinerPanel
                        isOpen={true}
                        onClose={() => {}}
                        process={null}
                        onTransform={handleTransform}
                        initialTopic={initialTopic}
                        mode="FULL"
                    />
                </div>
            </>
        );
    }

    // VIEWING
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
            <AiStatusWidget status={jobStatus} message={jobStatus?.message || ''} />

            <WorkflowHeader
                jobStatus={jobStatus}
                initialTopic={initialTopic}
                isCompleted={isCompleted}
                isInspectorOpen={isInspectorOpen}
                setInspectorOpen={setInspectorOpen}
                onOpenSideOutliner={() => setSideOutlinerOpen(true)}
            />

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