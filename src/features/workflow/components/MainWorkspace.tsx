import clsx from 'clsx';
import { useUiStore } from '../../../../store/useUiStore';
import { useWorkflowStore } from '../../../../store/useWorkflowStore';
import { useWorkflowInteraction } from '../../../../hooks/useWorkflowInteraction';
import { WorkflowHeader } from './WorkflowHeader';
import { WorkflowCanvas } from '../WorkflowCanvas';
import { DataDictionaryPanel } from './DataDictionaryPanel';
import { FormListPanel } from './FormListPanel';
import { AssetViewer } from './asset/AssetViewer';
import { NodeConfigOverlay } from './NodeConfigOverlay';
import { SuggestionPanel } from './SuggestionPanel';
import { Split } from 'lucide-react';
import { PanelToggleButton } from '../../../../components/PanelToggleButton';
import type { JobStatus } from '../../../../types/workflow';

interface MainWorkspaceProps {
    jobStatus: JobStatus | null | undefined;
    initialTopic: string;
    isCompleted: boolean;
    isInspectorOpen: boolean;
    setInspectorOpen: (open: boolean) => void;

    // Suggestion logic
    isSuggesting: boolean;
    handleTriggerSuggestion: () => void;
    // [Refactor] Suggestion panel is managed here now? No, kept in App/Interaction hook mostly,
    // but rendered here to be inside workspace
}

export function MainWorkspace({
                                  jobStatus,
                                  initialTopic,
                                  isCompleted,
                                  isInspectorOpen,
                                  setInspectorOpen,
                                  isSuggesting
                              }: MainWorkspaceProps) {
    // Stores
    const { mainView, setMainView } = useUiStore();
    const assetUrl = useWorkflowStore((state) => state.assetUrl);

    // Interaction Hook (Reused)
    const {
        selectedNodeId,
        viewMode,
        toggleViewMode,
        handleNodeClick,
        handlePaneClick,
        showSuggestionPanel,
        setShowSuggestionPanel,
        suggestions,
        handleApplySuggestion
    } = useWorkflowInteraction();

    // Selectors
    const selectNode = useWorkflowStore((state) => state.selectNode);
    const isProcessReady = !!jobStatus?.processResponse;

    const isSplitView = viewMode === 'VERIFICATION' && assetUrl && mainView === 'CANVAS';

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* 1. Header (Tab Navigation) */}
            <WorkflowHeader
                jobStatus={jobStatus}
                initialTopic={initialTopic}
                isCompleted={isCompleted}
                isInspectorOpen={isInspectorOpen}
                setInspectorOpen={setInspectorOpen}
                onOpenSideOutliner={() => {}} // Deprecated/Hidden logic
                activeView={mainView}
                onViewChange={setMainView}
            />

            {/* 2. Main Content Area */}
            <div className="flex-1 relative overflow-hidden flex">

                {/* [A] Left Split Panel (Asset Viewer) - Only in Canvas Mode */}
                {isSplitView && (
                    <div className="w-[40%] h-full border-r border-slate-200 bg-slate-100 z-10 shadow-inner animate-in slide-in-from-left-4 duration-300">
                        <AssetViewer fileUrl={assetUrl} />
                    </div>
                )}

                {/* [B] Center View Container */}
                <div className="flex-1 relative h-full transition-all duration-300 flex flex-col">

                    {/* View 1: Canvas */}
                    <div className={clsx("w-full h-full absolute inset-0 transition-opacity duration-500", mainView === 'CANVAS' ? "opacity-100 z-10" : "opacity-0 pointer-events-none")}>

                        {/* Asset Toggle Overlay */}
                        {assetUrl && (
                            <div className="absolute top-4 left-4 z-20">
                                <PanelToggleButton
                                    isPanelOpen={viewMode === 'VERIFICATION'}
                                    label={viewMode === 'VERIFICATION' ? 'Hide Asset' : 'Show Asset'}
                                    icon={Split}
                                    onClick={toggleViewMode}
                                />
                            </div>
                        )}

                        <div className="w-full h-full relative">
                            {isProcessReady ? (
                                <WorkflowCanvas onNodeClick={handleNodeClick} />
                            ) : (
                                // Empty State Placeholder
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4">
                                    <div className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
                                    </div>
                                    <p className="text-sm font-medium">Use the AI Chat to generate a process.</p>
                                </div>
                            )}

                            {/* Background Click Handler */}
                            <div className="absolute inset-0 -z-10" onClick={handlePaneClick} aria-hidden="true" />
                        </div>

                        {/* Node Config Overlay (Inside Canvas Area) */}
                        {selectedNodeId && (
                            <NodeConfigOverlay
                                nodeId={selectedNodeId}
                                onClose={() => selectNode(null)}
                            />
                        )}

                        {/* Suggestion Panel (Floating) */}
                        {showSuggestionPanel && (
                            <SuggestionPanel
                                suggestions={suggestions}
                                isLoading={isSuggesting}
                                onApply={handleApplySuggestion}
                                onClose={() => setShowSuggestionPanel(false)}
                            />
                        )}
                    </div>

                    {/* View 2: Data Dictionary */}
                    <div className={clsx("w-full h-full absolute inset-0 transition-opacity duration-300 bg-white", mainView === 'DATA' ? "opacity-100 z-20" : "opacity-0 pointer-events-none")}>
                        <DataDictionaryPanel />
                    </div>

                    {/* View 3: Form List */}
                    <div className={clsx("w-full h-full absolute inset-0 transition-opacity duration-300 bg-white", mainView === 'FORM' ? "opacity-100 z-20" : "opacity-0 pointer-events-none")}>
                        <FormListPanel />
                    </div>
                </div>
            </div>
        </div>
    );
}