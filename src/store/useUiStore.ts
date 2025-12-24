import { create } from 'zustand';

export type MainView = 'CANVAS' | 'DATA' | 'FORM';
export type CopilotTab = 'CHAT' | 'KNOWLEDGE';

interface UiState {
    // Main Workspace View
    mainView: MainView;
    setMainView: (view: MainView) => void;

    // Right Panel (Copilot) Tab
    activeCopilotTab: CopilotTab;
    setActiveCopilotTab: (tab: CopilotTab) => void;

    // Node Config Overlay
    isNodeConfigOpen: boolean;
    setNodeConfigOpen: (isOpen: boolean) => void;
    toggleNodeConfig: () => void;

    // [New] Global Job ID for cross-component sync
    currentJobId: string | null;
    setCurrentJobId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
    mainView: 'CANVAS',
    setMainView: (view) => set({ mainView: view }),

    activeCopilotTab: 'CHAT',
    setActiveCopilotTab: (tab) => set({ activeCopilotTab: tab }),

    isNodeConfigOpen: false,
    setNodeConfigOpen: (isOpen) => set({ isNodeConfigOpen: isOpen }),
    toggleNodeConfig: () => set((state) => ({ isNodeConfigOpen: !state.isNodeConfigOpen })),

    // Initialize Job ID state
    currentJobId: null,
    setCurrentJobId: (id) => set({ currentJobId: id }),
}));