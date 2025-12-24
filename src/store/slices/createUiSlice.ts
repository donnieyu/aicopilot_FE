import type { StateCreator } from 'zustand';
import type { WorkflowState } from '../useWorkflowStore';
import type { SourceReference } from '../../types/workflow';

export interface UiSlice {
    viewMode: 'DEFAULT' | 'VERIFICATION';
    assetUrl: string | null;
    selectedNodeId: string | null;
    selectedSourceRegion: SourceReference | null;

    // 캔버스 잠금 상태 (기본값 true)
    isLocked: boolean;

    hoveredEdges: Record<string, boolean>;
    pinnedEdges: Record<string, boolean>;

    setViewMode: (mode: 'DEFAULT' | 'VERIFICATION') => void;
    setAssetUrl: (url: string | null) => void;
    selectNode: (nodeId: string | null) => void;
    selectSourceRegion: (ref: SourceReference | null) => void;

    // 잠금 상태 변경 액션
    setIsLocked: (isLocked: boolean) => void;

    setEdgeHover: (edgeId: string, isHovered: boolean) => void;
    setEdgePin: (edgeId: string, isPinned: boolean) => void;
    resetUi: () => void;
}

export const createUiSlice: StateCreator<WorkflowState, [], [], UiSlice> = (set) => ({
    viewMode: 'DEFAULT',
    assetUrl: null,
    selectedNodeId: null,
    selectedSourceRegion: null,

    // 기본 상태를 Locked(true)로 설정하여 시작
    isLocked: true,

    hoveredEdges: {},
    pinnedEdges: {},

    setViewMode: (mode) => set({ viewMode: mode }),
    setAssetUrl: (url) => set({ assetUrl: url }),
    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    selectSourceRegion: (ref) => set({ selectedSourceRegion: ref }),

    setIsLocked: (isLocked) => set({ isLocked }),

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
        isLocked: true,
        hoveredEdges: {},
        pinnedEdges: {}
    }),
});