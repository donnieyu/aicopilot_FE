import { create } from 'zustand';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: number;
    jobId?: string;
}

interface ChatState {
    messages: ChatMessage[];
    input: string;
    isTyping: boolean;
    selectedAssetIds: string[];

    setInput: (value: string) => void;
    addMessage: (role: ChatMessage['role'], content: string, jobId?: string) => void;
    setTyping: (isTyping: boolean) => void;
    clearMessages: () => void;
    toggleAssetSelection: (id: string) => void;
    setSelectedAssets: (ids: string[]) => void;
    clearSelection: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    // [Fix] 초기 환영 메시지 제거: 빈 배열로 시작
    messages: [],
    input: '',
    isTyping: false,
    selectedAssetIds: [],

    setInput: (value) => set({ input: value }),

    addMessage: (role, content, jobId) => set((state) => ({
        messages: [
            ...state.messages,
            {
                id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                role,
                content,
                timestamp: Date.now(),
                jobId
            }
        ]
    })),

    setTyping: (isTyping) => set({ isTyping }),
    clearMessages: () => set({ messages: [] }),

    toggleAssetSelection: (id) => set((state) => {
        const isSelected = state.selectedAssetIds.includes(id);
        return {
            selectedAssetIds: isSelected
                ? state.selectedAssetIds.filter(item => item !== id)
                : [...state.selectedAssetIds, id]
        };
    }),

    setSelectedAssets: (ids) => set({ selectedAssetIds: ids }),
    clearSelection: () => set({ selectedAssetIds: [] }),
}));