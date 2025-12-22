import type { StateCreator } from 'zustand';
import type { WorkflowState } from '../useWorkflowStore';
import type { SourceReference } from '../../types/workflow';

export interface UiSlice {
    viewMode: 'DEFAULT' | 'VERIFICATION';
    assetUrl: string | null;
    selectedNodeId: string | null;
    selectedSourceRegion: SourceReference | null;

    hoveredEdges: Record<string, boolean>;
    // [New] 마우스가 버튼 위에 있어서 호버가 유지되어야 하는 엣지들
    pinnedEdges: Record<string, boolean>;

    setViewMode: (mode: 'DEFAULT' | 'VERIFICATION') => void;
    setAssetUrl: (url: string | null) => void;
    selectNode: (nodeId: string | null) => void;
    selectSourceRegion: (ref: SourceReference | null) => void;

    setEdgeHover: (edgeId: string, isHovered: boolean) => void;
    setEdgePin: (edgeId: string, isPinned: boolean) => void; // [New]
    resetUi: () => void;
}

export const createUiSlice: StateCreator<WorkflowState, [], [], UiSlice> = (set) => ({
    viewMode: 'DEFAULT',
    assetUrl: null,
    selectedNodeId: null,
    selectedSourceRegion: null,
    hoveredEdges: {},
    pinnedEdges: {},

    setViewMode: (mode) => set({ viewMode: mode }),
    setAssetUrl: (url) => set({ assetUrl: url }),
    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    selectSourceRegion: (ref) => set({ selectedSourceRegion: ref }),

    setEdgeHover: (edgeId, isHovered) => set((state) => ({
        hoveredEdges: {
            ...state.hoveredEdges,
            [edgeId]: isHovered
        }
    })),

    setEdgePin: (edgeId, isPinned) => set((state) => ({
        pinnedEdges: {
            ...state.pinnedEdges,
            [edgeId]: isPinned
        }
    })),

    resetUi: () => set({
        viewMode: 'DEFAULT',
        assetUrl: null,
        selectedNodeId: null,
        selectedSourceRegion: null,
        hoveredEdges: {},
        pinnedEdges: {}
    }),
});