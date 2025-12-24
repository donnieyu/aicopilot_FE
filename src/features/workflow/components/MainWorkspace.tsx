import clsx from 'clsx';
// [Fix] Relative paths for src/ directory
import { useUiStore } from '../../../store/useUiStore';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import { useWorkflowInteraction } from '../../../hooks/useWorkflowInteraction';

// [Fix] Component paths
import { WorkflowHeader } from './WorkflowHeader';
import { WorkflowCanvas } from '../WorkflowCanvas';
import { DataDictionaryPanel } from './DataDictionaryPanel';
import { FormListPanel } from './FormListPanel';
import { AssetViewer } from './asset/AssetViewer';
import { NodeConfigOverlay } from './NodeConfigOverlay';
import { SuggestionPanel } from './SuggestionPanel';
import { GeneratingOverlay } from './GeneratingOverlay';

import { Split } from 'lucide-react';
import { PanelToggleButton } from '../../../components/PanelToggleButton';
import type { JobStatus } from '../../../types/workflow';

interface MainWorkspaceProps {
    jobStatus: JobStatus | null | undefined;
    initialTopic: string;
    isCompleted: boolean;
    // [Fix] Naming consistency: isInspectorOpen matches state logic
    isInspectorOpen: boolean;
    setInspectorOpen: (open: boolean) => void;
    isSuggesting: boolean;
    handleTriggerSuggestion: () => void;

    // Loading state for the mini overlay
    showGeneratingOverlay: boolean;
}

/**
 * The Central Workspace area.
 * [Phase 3 Refinement] Added mini GeneratingOverlay to cover only the canvas area.
 */
export function MainWorkspace({
                                  jobStatus,
                                  initialTopic,
                                  isCompleted,
                                  isInspectorOpen, // Correctly destructured
                                  setInspectorOpen, // Correctly destructured
                                  isSuggesting,
                                  showGeneratingOverlay
                              }: MainWorkspaceProps) {
    const { mainView, setMainView } = useUiStore();
    const assetUrl = useWorkflowStore((state) => state.assetUrl);

    // Reuse interaction logic (selecting nodes, toggling split view)
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

    const selectNode = useWorkflowStore((state) => state.selectNode);
    const isProcessReady = !!jobStatus?.processResponse;

    // Split view logic: Show asset viewer alongside canvas when requested
    const isSplitView = viewMode === 'VERIFICATION' && assetUrl && mainView === 'CANVAS';

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">

            {/* [User Suggestion Applied]
               Mini Overlay: Now inside the MainWorkspace to cover only the canvas/tabs area.
               It has a low background opacity (0.2) and a minimalist pill design.
            */}
            <GeneratingOverlay
                isVisible={showGeneratingOverlay}
                message={jobStatus?.message || "Analyzing requirements..."}
            />

            {/* Top Workspace Header (Tabs) */}
            <WorkflowHeader
                jobStatus={jobStatus}
                initialTopic={initialTopic}
                isCompleted={isCompleted}
                isInspectorOpen={isInspectorOpen} // Corrected naming passed to header
                setInspectorOpen={setInspectorOpen}
                onOpenSideOutliner={() => {}}
                activeView={mainView}
                onViewChange={setMainView}
            />

            {/* Content Area with Split View Support */}
            <div className="flex-1 relative overflow-hidden flex">

                {/* Left Split Panel (Asset Viewer) */}
                {isSplitView && (
                    <div className="w-[40%] h-full border-r border-slate-200 bg-slate-100 z-10 shadow-inner animate-in slide-in-from-left-4 duration-300">
                        <AssetViewer fileUrl={assetUrl} />
                    </div>
                )}

                {/* Main View Container (Canvas or Tables) */}
                <div className="flex-1 relative h-full transition-all duration-300 flex flex-col">

                    {/* View 1: Process Map (Canvas) */}
                    <div className={clsx("w-full h-full absolute inset-0 transition-opacity duration-500", mainView === 'CANVAS' ? "opacity-100 z-10" : "opacity-0 pointer-events-none")}>

                        {/* Toggle button to show/hide source asset */}
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
                                <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4">
                                    <div className="w-20 h-20 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
                                    </div>
                                    <p className="text-sm font-medium">Use AI Chat to generate your first process.</p>
                                </div>
                            )}
                            {/* Deselect on background click */}
                            <div className="absolute inset-0 -z-10" onClick={handlePaneClick} aria-hidden="true" />
                        </div>

                        {/* Floating Panels inside Canvas */}
                        {selectedNodeId && (
                            <NodeConfigOverlay
                                nodeId={selectedNodeId}
                                onClose={() => selectNode(null)}
                            />
                        )}

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