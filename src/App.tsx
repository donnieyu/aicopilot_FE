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
import { NodeConfigPanel } from './features/workflow/components/NodeConfigPanel'; // [New] Import
import clsx from 'clsx';
import type { NodeSuggestion, ProcessDefinition } from './types/workflow';
import type { Node } from 'reactflow';
import { useAutoAnalysis } from './hooks/useAutoAnalysis';

type WorkflowStep = 'LANDING' | 'OUTLINING' | 'VIEWING';

function App() {
    const [step, setStep] = useState<WorkflowStep>('LANDING');
    const [initialTopic, setInitialTopic] = useState('');

    const [isInspectorOpen, setInspectorOpen] = useState(false);
    const [isSideOutlinerOpen, setSideOutlinerOpen] = useState(false);

    const [suggestions, setSuggestions] = useState<NodeSuggestion[]>([]);
    const [showSuggestionPanel, setShowSuggestionPanel] = useState(false);

    // [UX] 선택된 노드 관리 (ConfigPanel 표시용)
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

    // [New] Activate Shadow Architect
    useAutoAnalysis();

    useEffect(() => {
        if (jobStatus?.processResponse) {
            setProcess(jobStatus.processResponse);
            if (step !== 'VIEWING') {
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

    // [Refactor] 노드 클릭 핸들러: API 호출 제거 -> 패널 열기만 수행
    const handleNodeClick = (_event: MouseEvent, node: Node) => {
        // 이미 선택된 노드면 아무것도 하지 않음 (또는 토글)
        if (selectedNodeId === node.id) return;

        console.log("👆 Node Clicked:", node.id, "- Opening Inspector");

        // 1. 선택 상태 업데이트
        setSelectedNodeId(node.id);

        // 2. 기존 제안 패널 닫기 (새로운 컨텍스트 시작)
        setShowSuggestionPanel(false);
        setSuggestions([]);

        // ⚠️ 여기서 API(getSuggestions)를 호출하지 않습니다!
        // 사용자가 ConfigPanel의 버튼을 누를 때 호출합니다.
    };

    // [New] AI 제안 요청 핸들러 (ConfigPanel의 버튼에서 호출)
    const handleTriggerSuggestion = async () => {
        if (!selectedNodeId || !currentJobId) return;

        // UI 피드백: 제안 패널을 로딩 상태로 먼저 띄움
        setShowSuggestionPanel(true);
        setSuggestions([]);

        const { nodes, edges } = useWorkflowStore.getState();
        const simplifiedNodes = nodes.map(n => ({
            id: n.id, type: n.type, data: { label: n.data.label, swimlaneId: n.data.swimlaneId, configuration: n.data.configuration }
        }));
        const graphContext = JSON.stringify({ nodes: simplifiedNodes, edges });

        try {
            console.log("🤖 Asking AI for suggestions on node:", selectedNodeId);
            const response = await getSuggestions({
                graphJson: graphContext,
                focusNodeId: selectedNodeId,
                jobId: currentJobId
            });
            if (response?.suggestions) {
                setSuggestions(response.suggestions);
            }
        } catch (e) {
            console.error("Suggestion failed", e);
            setShowSuggestionPanel(false); // 에러 시 닫기
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

                {/* [New] 우측 속성 패널 (Inspector) */}
                <NodeConfigPanel
                    nodeId={selectedNodeId}
                    isOpen={!!selectedNodeId}
                    onClose={() => setSelectedNodeId(null)}
                    onTriggerSuggestion={handleTriggerSuggestion} // 수동 트리거 연결
                />

                {/* AI 제안 패널 (Suggestion) */}
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