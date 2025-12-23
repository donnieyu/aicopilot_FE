import { useEffect, useState } from 'react';
import { useWorkflowGenerator } from './hooks/useWorkflowGenerator';
import { useWorkflowStore } from './store/useWorkflowStore';
import { useUiStore } from './store/useUiStore';
import { JsonInspector } from './components/JsonInspector';
import { GeneratingOverlay } from './features/workflow/components/GeneratingOverlay';
import { AiStatusWidget } from './features/workflow/components/AiStatusWidget';
import { MainWorkspace } from './features/workflow/components/MainWorkspace';
import { CopilotPanel } from './features/workflow/components/copilot/CopilotPanel';
import { useAutoAnalysis } from './hooks/useAutoAnalysis';

function App() {
    // [Refactor] UI Store for global overlay states
    const [initialTopic, setInitialTopic] = useState('');

    // Interaction Hooks
    const { isInspectorOpen, setInspectorOpen } = useUiStore(state => ({
        isInspectorOpen: false, // TODO: Add to UiStore if needed globally, or keep local state here
        setInspectorOpen: (v: boolean) => {} // Mock for now or move to store
    }));
    const [inspectorOpen, setLocalInspectorOpen] = useState(false);

    const {
        jobStatus,
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

    useAutoAnalysis();

    // Sync Backend State to Store
    useEffect(() => {
        if (jobStatus) {
            // Topic update
            if (jobStatus.processResponse?.processName) {
                setInitialTopic(jobStatus.processResponse.processName);
            }

            if (jobStatus.processResponse) {
                setProcess(jobStatus.processResponse);
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
    }, [jobStatus, setProcess, setDataModel, setFormDefinitions]);

    const showLoading = isTransforming || (isProcessing && !isProcessReady);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
            {/* Global Overlays */}
            <GeneratingOverlay isVisible={showLoading} message={jobStatus?.message || "AI Architect is working..."} />
            <AiStatusWidget status={jobStatus} message={jobStatus?.message || ''} />
            <JsonInspector isOpen={inspectorOpen} onClose={() => setLocalInspectorOpen(false)} data={jobStatus || null} />

            {/* 1. Main Workspace (Left - Flex Grow) */}
            <div className="flex-1 min-w-0 h-full relative z-0">
                <MainWorkspace
                    jobStatus={jobStatus}
                    initialTopic={initialTopic}
                    isCompleted={isCompleted}
                    isInspectorOpen={inspectorOpen}
                    setInspectorOpen={setLocalInspectorOpen}
                    isSuggesting={isSuggesting}
                    handleTriggerSuggestion={() => {}} // Handled inside or via chat now
                />
            </div>

            {/* 2. Copilot Panel (Right - Fixed Width) */}
            <div className="w-[450px] flex-shrink-0 h-full border-l border-slate-200 z-10 shadow-xl bg-white">
                <CopilotPanel />
            </div>
        </div>
    );
}

export default App;