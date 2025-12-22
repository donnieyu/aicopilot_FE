import { useEffect, useState } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { useWorkflowInteraction } from './hooks/useWorkflowInteraction';
import { WorkflowCanvas } from './features/workflow/WorkflowCanvas';
import { JsonInspector } from './components/JsonInspector';
import { SuggestionPanel } from './features/workflow/components/SuggestionPanel';
import { LandingPage } from './features/workflow/components/LandingPage';
import { OutlinerPanel } from './features/workflow/components/OutlinerPanel';
import { GeneratingOverlay } from './features/workflow/components/GeneratingOverlay';
import { AiStatusWidget } from './features/workflow/components/AiStatusWidget';
import { WorkflowHeader } from './features/workflow/components/WorkflowHeader';
import { NodeConfigPanel } from './features/workflow/components/NodeConfigPanel';
import { DataDictionaryPanel } from './features/workflow/components/DataDictionaryPanel';
import { FormListPanel } from './features/workflow/components/FormListPanel';
import { AssetViewer } from './features/workflow/components/asset/AssetViewer';
import clsx from 'clsx';
import type { ProcessDefinition } from './types/workflow';
import { useAutoAnalysis } from './hooks/useAutoAnalysis';
import { Split, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { PanelToggleButton } from './components/PanelToggleButton';

type WorkflowStep = 'LANDING' | 'OUTLINING' | 'VIEWING';
// [Refactor] 메인 뷰 상태 타입 정의
export type MainView = 'CANVAS' | 'DATA' | 'FORM';

function App() {
    const [step, setStep] = useState<WorkflowStep>('LANDING');
    const [initialTopic, setInitialTopic] = useState('');
    const [initialDescription, setInitialDescription] = useState('');

    // [Refactor] 메인 뷰 상태 추가
    const [mainView, setMainView] = useState<MainView>('CANVAS');

    const {
        selectedNodeId,
        viewMode,
        assetUrl,
        isInspectorOpen,
        isSideOutlinerOpen,
        isRightPanelOpen,
        showSuggestionPanel,
        suggestions,
        setInspectorOpen,
        setSideOutlinerOpen,
        setRightPanelOpen,
        setShowSuggestionPanel,
        setSuggestions,
        handleNodeClick,
        handlePaneClick,
        toggleViewMode,
        handleApplySuggestion
    } = useWorkflowInteraction();

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
    const setDataModel = useWorkflowStore((state) => state.setDataModel);
    const setFormDefinitions = useWorkflowStore((state) => state.setFormDefinitions);
    const resetWorkflow = useWorkflowStore((state) => state.reset);
    const selectNode = useWorkflowStore((state) => state.selectNode);

    const setAssetUrl = useWorkflowStore((state) => state.setAssetUrl);
    const setViewMode = useWorkflowStore((state) => state.setViewMode);
    const setProcessMetadata = useWorkflowStore((state) => state.setProcessMetadata);

    useAutoAnalysis();

    useEffect(() => {
        if (jobStatus) {
            if (jobStatus.processResponse) {
                setProcess(jobStatus.processResponse);
                if (step !== 'VIEWING') setTimeout(() => setStep('VIEWING'), 0);
            }
            if (jobStatus.dataEntitiesResponse) {
                setDataModel(
                    jobStatus.dataEntitiesResponse.entities,
                    jobStatus.dataEntitiesResponse.groups
                );
            }
            if (jobStatus.formResponse?.formDefinitions) {
                setFormDefinitions(jobStatus.formResponse.formDefinitions);
            }
        }
    }, [jobStatus, setProcess, setDataModel, setFormDefinitions, step]);

    const handleStartDrafting = (topic: string, description?: string) => {
        resetWorkflow();
        setInitialTopic(topic);
        setInitialDescription(description || '');
        setStep('OUTLINING');
        setViewMode('DEFAULT');
    };

    const handleStartFromAsset = (definition: ProcessDefinition, fileUrl?: string) => {
        resetWorkflow();
        setInitialTopic(definition.topic);
        setProcessMetadata(definition.topic, definition.steps.map(s => s.description).join(" "));

        if (fileUrl) {
            setAssetUrl(fileUrl);
            setViewMode('VERIFICATION');
        }

        startTransformation(definition);
        setStep('VIEWING');
    };

    const handleTransform = (definition: ProcessDefinition) => {
        resetWorkflow();
        startTransformation(definition);
    };

    const handleTriggerSuggestion = async () => {
        if (!selectedNodeId || !currentJobId) return;
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
                focusNodeId: selectedNodeId,
                jobId: currentJobId
            });
            if (response?.suggestions) setSuggestions(response.suggestions);
        } catch (e) {
            setShowSuggestionPanel(false);
        }
    };

    const showBlockingOverlay = isTransforming || (isProcessing && !jobStatus?.processResponse && step === 'OUTLINING');

    // [Refactor] 뷰 모드에 따른 로딩 상태 처리
    const showLoadingInView = isTransforming || (isProcessing && !isProcessReady);
    const isSplitView = viewMode === 'VERIFICATION' && assetUrl && mainView === 'CANVAS';

    if (step === 'LANDING') return (
        <LandingPage
            onStart={handleStartDrafting}
            onStartFromAsset={(def, url) => handleStartFromAsset(def, url)}
        />
    );

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
                        initialDescription={initialDescription}
                        mode="FULL"
                    />
                </div>
            </>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50 relative">
            <GeneratingOverlay isVisible={showLoadingInView} message={jobStatus?.message || "Generating Process Map from Asset..."} />

            <AiStatusWidget status={jobStatus} message={jobStatus?.message || ''} />

            <WorkflowHeader
                jobStatus={jobStatus}
                initialTopic={initialTopic}
                isCompleted={isCompleted}
                isInspectorOpen={isInspectorOpen}
                setInspectorOpen={setInspectorOpen}
                onOpenSideOutliner={() => setSideOutlinerOpen(true)}
                // [Refactor] 메인 뷰 상태 전달
                activeView={mainView}
                onViewChange={setMainView}
            />

            <div className="flex-1 relative overflow-hidden bg-slate-50 flex">

                {/* [A] LEFT PANEL (Asset Viewer) - Only in Canvas Mode & Verification Mode */}
                {isSplitView && (
                    <div className="w-[40%] h-full border-r border-slate-200 bg-slate-100 z-10 shadow-inner animate-in slide-in-from-left-4 duration-500">
                        <AssetViewer fileUrl={assetUrl} />
                    </div>
                )}

                {/* [B] MAIN CONTENT AREA (Swappable) */}
                <div className="flex-1 relative h-full transition-all duration-500 flex flex-col">

                    {/* 1. Canvas View */}
                    {mainView === 'CANVAS' && (
                        <>
                            {/* View Mode Toggle (Overlay) */}
                            {assetUrl && (
                                <div className="absolute top-4 left-4 z-10">
                                    <PanelToggleButton
                                        isPanelOpen={viewMode === 'VERIFICATION'}
                                        label={viewMode === 'VERIFICATION' ? 'Hide Asset' : 'Show Asset'}
                                        icon={Split}
                                        onClick={toggleViewMode}
                                    />
                                </div>
                            )}

                            {/* Node Config Toggle (Overlay) - 노드가 선택되었을 때만 */}
                            {selectedNodeId && (
                                <div className="absolute top-4 right-4 z-20">
                                    <PanelToggleButton
                                        isPanelOpen={isRightPanelOpen}
                                        label={isRightPanelOpen ? 'Hide Panel' : 'Show Panel'}
                                        icon={isRightPanelOpen ? PanelRightClose : PanelRightOpen}
                                        onClick={() => setRightPanelOpen(!isRightPanelOpen)}
                                    />
                                </div>
                            )}

                            <div className={clsx("w-full h-full transition-opacity duration-1000", isProcessReady ? "opacity-100" : "opacity-0")}>
                                <WorkflowCanvas onNodeClick={handleNodeClick} />
                                <div
                                    className="absolute inset-0 -z-10"
                                    onClick={handlePaneClick}
                                    aria-hidden="true"
                                />
                            </div>
                        </>
                    )}

                    {/* 2. Data Dictionary View */}
                    {mainView === 'DATA' && (
                        <div className="w-full h-full animate-in fade-in zoom-in-95 duration-300">
                            <DataDictionaryPanel />
                        </div>
                    )}

                    {/* 3. Form List View */}
                    {mainView === 'FORM' && (
                        <div className="w-full h-full animate-in fade-in zoom-in-95 duration-300">
                            <FormListPanel />
                        </div>
                    )}
                </div>

                {/* [C] RIGHT SIDEBAR (Node Config Only - Canvas Mode) */}
                {mainView === 'CANVAS' && (
                    <div
                        className={clsx(
                            "h-full border-l border-slate-200 bg-white shadow-xl z-30 flex flex-col relative transition-all duration-300 ease-in-out",
                            (isRightPanelOpen && selectedNodeId) ? "w-[420px] translate-x-0" : "w-0 translate-x-full opacity-0 overflow-hidden"
                        )}
                    >
                        <NodeConfigPanel
                            nodeId={selectedNodeId}
                            isOpen={!!selectedNodeId && isRightPanelOpen}
                            onClose={() => selectNode(null)}
                            onTriggerSuggestion={handleTriggerSuggestion}
                        />
                    </div>
                )}

                {/* Global Modals/Panels */}
                <JsonInspector isOpen={isInspectorOpen} onClose={() => setInspectorOpen(false)} data={jobStatus || null} />
                <OutlinerPanel isOpen={isSideOutlinerOpen} onClose={() => setSideOutlinerOpen(false)} process={jobStatus?.processResponse || null} mode="SIDE" />

                {/* Suggestion Panel (Only in Canvas Mode) */}
                {mainView === 'CANVAS' && showSuggestionPanel && (
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