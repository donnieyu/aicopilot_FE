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

    // Node Config Overlay (Canvas 내부 오버레이)
    isNodeConfigOpen: boolean;
    setNodeConfigOpen: (isOpen: boolean) => void;
    toggleNodeConfig: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    mainView: 'CANVAS',
    setMainView: (view) => set({ mainView: view }),

    activeCopilotTab: 'CHAT',
    setActiveCopilotTab: (tab) => set({ activeCopilotTab: tab }),

    isNodeConfigOpen: false,
    setNodeConfigOpen: (isOpen) => set({ isNodeConfigOpen: isOpen }),
    toggleNodeConfig: () => set((state) => ({ isNodeConfigOpen: !state.isNodeConfigOpen })),
}));