import { useEffect, useState } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { useWorkflowInteraction } from './hooks/useWorkflowInteraction'; // [New] Import
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
import { Database, LayoutTemplate, Loader2, Sparkles, Split, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { PanelToggleButton } from './components/PanelToggleButton';

type WorkflowStep = 'LANDING' | 'OUTLINING' | 'VIEWING';
type RightPanelTab = 'DATA' | 'FORM';

// Local Component for Right Panel Loading State
function RightPanelLoading({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
            <div className="relative mb-4">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-25"></div>
                <div className="relative bg-white p-3 rounded-full shadow-sm border border-blue-100">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <Sparkles size={14} className="text-blue-500" />
                AI Architect Working
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
                {message}
            </p>
        </div>
    );
}

function App() {
    const [step, setStep] = useState<WorkflowStep>('LANDING');
    const [initialTopic, setInitialTopic] = useState('');
    const [initialDescription, setInitialDescription] = useState('');
    const [activeTab, setActiveTab] = useState<RightPanelTab>('DATA');

    // [Refactor] Use Custom Hook for Interactions
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

    // Store Selectors (Direct Access for logic not covered by interaction hook)
    const setProcess = useWorkflowStore((state) => state.setProcess);
    const setDataModel = useWorkflowStore((state) => state.setDataModel);
    const setFormDefinitions = useWorkflowStore((state) => state.setFormDefinitions);
    const resetWorkflow = useWorkflowStore((state) => state.reset);
    const selectNode = useWorkflowStore((state) => state.selectNode); // Used in onClose callback

    // Asset State setters
    const setAssetUrl = useWorkflowStore((state) => state.setAssetUrl);
    const setViewMode = useWorkflowStore((state) => state.setViewMode); // Used in landing page handler
    const setProcessMetadata = useWorkflowStore((state) => state.setProcessMetadata);

    const dataEntities = useWorkflowStore((state) => state.dataEntities);
    const formDefinitions = useWorkflowStore((state) => state.formDefinitions);

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

    const renderRightPanelContent = () => {
        if (isProcessing && activeTab === 'DATA' && dataEntities.length === 0) {
            return <RightPanelLoading message="Extracting business data entities from your process..." />;
        }
        if (isProcessing && activeTab === 'FORM' && formDefinitions.length === 0) {
            return <RightPanelLoading message="Designing UI forms and UX layouts..." />;
        }
        return activeTab === 'DATA' ? <DataDictionaryPanel /> : <FormListPanel />;
    };

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

    const showLoadingInView = isTransforming || (isProcessing && !isProcessReady);
    const isSplitView = viewMode === 'VERIFICATION' && assetUrl;

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
            />

            <div className="flex-1 relative overflow-hidden bg-slate-50 flex">
                {/* [A] LEFT PANEL */}
                {isSplitView && (
                    <div className="w-[40%] h-full border-r border-slate-200 bg-slate-100 z-10 shadow-inner animate-in slide-in-from-left-4 duration-500">
                        <AssetViewer fileUrl={assetUrl} />
                    </div>
                )}

                {/* [B] CENTER CANVAS */}
                <div className="flex-1 relative h-full transition-all duration-500">
                    {/* View Mode Toggle */}
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

                    {/* Right Panel Toggle */}
                    <div className="absolute top-4 right-4 z-20">
                        <PanelToggleButton
                            isPanelOpen={isRightPanelOpen}
                            label={isRightPanelOpen ? 'Hide Panel' : 'Show Panel'}
                            icon={isRightPanelOpen ? PanelRightClose : PanelRightOpen}
                            onClick={() => setRightPanelOpen(!isRightPanelOpen)}
                        />
                    </div>

                    <div className={clsx("w-full h-full transition-opacity duration-1000", isProcessReady ? "opacity-100" : "opacity-0")}>
                        <WorkflowCanvas onNodeClick={handleNodeClick} />
                        <div
                            className="absolute inset-0 -z-10"
                            onClick={handlePaneClick}
                            aria-hidden="true"
                        />
                    </div>
                </div>

                {/* [C] RIGHT SIDEBAR */}
                <div
                    className={clsx(
                        "h-full border-l border-slate-200 bg-white shadow-xl z-30 flex flex-col relative transition-all duration-300 ease-in-out",
                        isRightPanelOpen ? "w-[420px] translate-x-0" : "w-0 translate-x-full opacity-0 overflow-hidden"
                    )}
                >
                    <div className={clsx(
                        "absolute inset-0 bg-white flex flex-col transition-opacity duration-300",
                        selectedNodeId ? "opacity-0 pointer-events-none" : "opacity-100 z-10"
                    )}>
                        <div className="flex border-b border-slate-100 bg-white flex-shrink-0 pt-2">
                            <button
                                onClick={() => setActiveTab('DATA')}
                                className={clsx(
                                    "flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                                    activeTab === 'DATA'
                                        ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                                        : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <Database size={14} /> Data Dictionary
                            </button>
                            <button
                                onClick={() => setActiveTab('FORM')}
                                className={clsx(
                                    "flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                                    activeTab === 'FORM'
                                        ? "border-pink-500 text-pink-600 bg-pink-50/50"
                                        : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <LayoutTemplate size={14} /> Form List
                            </button>
                        </div>

                        <div className="flex-1 relative overflow-hidden">
                            {renderRightPanelContent()}
                        </div>
                    </div>

                    <NodeConfigPanel
                        nodeId={selectedNodeId}
                        isOpen={!!selectedNodeId && isRightPanelOpen}
                        onClose={() => selectNode(null)}
                        onTriggerSuggestion={handleTriggerSuggestion}
                    />
                </div>

                <JsonInspector isOpen={isInspectorOpen} onClose={() => setInspectorOpen(false)} data={jobStatus || null} />
                <OutlinerPanel isOpen={isSideOutlinerOpen} onClose={() => setSideOutlinerOpen(false)} process={jobStatus?.processResponse || null} mode="SIDE" />
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