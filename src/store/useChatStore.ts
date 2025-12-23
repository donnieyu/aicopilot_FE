import { create } from 'zustand';

/**
 * Integrated store for AI collaboration chat and knowledge context.
 * - Manages chat messages
 * - Manages selected assets (context)
 */

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: number;
    // Metadata for UI actions (e.g., generated Job ID)
    jobId?: string;
    // Field for potential AI-suggested UI actions
    action?: {
        type: string;
        payload: any;
    };
}

interface ChatState {
    // --- Chat State ---
    messages: ChatMessage[];
    input: string;
    isTyping: boolean;

    // --- Knowledge Context State ---
    selectedAssetIds: string[];

    // --- Actions ---
    setInput: (value: string) => void;
    addMessage: (role: ChatMessage['role'], content: string, jobId?: string, action?: ChatMessage['action']) => void;
    setTyping: (isTyping: boolean) => void;
    clearMessages: () => void;

    // --- Asset Actions ---
    toggleAssetSelection: (id: string) => void;
    clearSelection: () => void;
    setSelectedAssets: (ids: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    // Initial State with English welcome message
    messages: [
        {
            id: 'welcome-msg',
            role: 'ai',
            content: 'Hello! Which business process would you like to design today? You can get more accurate results by uploading and selecting relevant knowledge files.',
            timestamp: Date.now()
        }
    ],
    input: '',
    isTyping: false,
    selectedAssetIds: [],

    // Chat Actions
    setInput: (value) => set({ input: value }),

    addMessage: (role, content, jobId, action) => set((state) => ({
        messages: [
            ...state.messages,
            {
                id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                role,
                content,
                timestamp: Date.now(),
                jobId,
                action
            }
        ]
    })),

    setTyping: (isTyping) => set({ isTyping }),
    clearMessages: () => set({
        messages: [{
            id: 'welcome-msg',
            role: 'ai',
            content: 'Starting a new conversation. How can I assist you?',
            timestamp: Date.now()
        }]
    }),

    // Asset Actions
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