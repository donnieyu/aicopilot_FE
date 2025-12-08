import type { StateCreator } from 'zustand';
import type { WorkflowState } from '../useWorkflowStore';
import type { SourceReference } from '../../types/workflow';

export interface UiSlice {
    viewMode: 'DEFAULT' | 'VERIFICATION';
    assetUrl: string | null;
    selectedNodeId: string | null;
    selectedSourceRegion: SourceReference | null;

    setViewMode: (mode: 'DEFAULT' | 'VERIFICATION') => void;
    setAssetUrl: (url: string | null) => void;
    selectNode: (nodeId: string | null) => void;
    selectSourceRegion: (ref: SourceReference | null) => void;
    resetUi: () => void;
}

export const createUiSlice: StateCreator<WorkflowState, [], [], UiSlice> = (set) => ({
    viewMode: 'DEFAULT',
    assetUrl: null,
    selectedNodeId: null,
    selectedSourceRegion: null,

    setViewMode: (mode) => set({ viewMode: mode }),
    setAssetUrl: (url) => set({ assetUrl: url }),
    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    selectSourceRegion: (ref) => set({ selectedSourceRegion: ref }),
    resetUi: () => set({
        viewMode: 'DEFAULT',
        assetUrl: null,
        selectedNodeId: null,
        selectedSourceRegion: null
    }),
});