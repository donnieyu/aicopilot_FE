import { create } from 'zustand';

/**
 * AI Copilot의 채팅 메시지 및 선택된 지식 컨텍스트를 관리하는 스토어
 */

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: number;
    // 향후 AI가 UI 액션을 제안할 때를 대비한 필드
    action?: {
        type: string;
        payload: any;
    };
}

interface CopilotState {
    // Chat State
    messages: ChatMessage[];
    input: string;
    isTyping: boolean;

    // Context Knowledge State (Asset 매니저와 연동)
    selectedAssetIds: string[];

    // Actions
    setInput: (value: string) => void;
    addMessage: (role: ChatMessage['role'], content: string, action?: ChatMessage['action']) => void;
    setTyping: (isTyping: boolean) => void;
    clearMessages: () => void;

    // Knowledge Selection Actions
    toggleAssetSelection: (id: string) => void;
    setSelectedAssetIds: (ids: string[]) => void;
    clearSelection: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
    // 초기 환영 메시지
    messages: [
        {
            id: 'welcome-msg',
            role: 'ai',
            content: '안녕하세요! 어떤 프로세스를 설계하고 싶으신가요? 왼쪽의 워크스페이스를 보며 대화할 수 있습니다.',
            timestamp: Date.now()
        }
    ],
    input: '',
    isTyping: false,
    selectedAssetIds: [],

    setInput: (value) => set({ input: value }),

    addMessage: (role, content, action) => set((state) => ({
        messages: [
            ...state.messages,
            {
                id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                role,
                content,
                timestamp: Date.now(),
                action
            }
        ]
    })),

    setTyping: (isTyping) => set({ isTyping }),

    clearMessages: () => set({
        messages: [{
            id: 'welcome-msg',
            role: 'ai',
            content: '새로운 대화를 시작합니다. 무엇을 도와드릴까요?',
            timestamp: Date.now()
        }]
    }),

    toggleAssetSelection: (id) => set((state) => {
        const isSelected = state.selectedAssetIds.includes(id);
        return {
            selectedAssetIds: isSelected
                ? state.selectedAssetIds.filter(item => item !== id)
                : [...state.selectedAssetIds, id]
        };
    }),

    setSelectedAssetIds: (ids) => set({ selectedAssetIds: ids }),

    clearSelection: () => set({ selectedAssetIds: [] }),
}));