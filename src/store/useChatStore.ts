import { create } from 'zustand';

export interface ChatMessage {
    id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: number;
}

interface ChatState {
    messages: ChatMessage[];
    input: string;
    isTyping: boolean; // AI 생성 중 여부

    setInput: (value: string) => void;
    addMessage: (role: ChatMessage['role'], content: string) => void;
    setTyping: (isTyping: boolean) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [
        {
            id: 'welcome-msg',
            role: 'ai',
            content: '안녕하세요! 어떤 비즈니스 프로세스를 설계하시겠습니까? 아래 템플릿을 선택하거나 직접 설명해주세요.',
            timestamp: Date.now()
        }
    ],
    input: '',
    isTyping: false,

    setInput: (value) => set({ input: value }),

    addMessage: (role, content) => set((state) => ({
        messages: [
            ...state.messages,
            {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role,
                content,
                timestamp: Date.now()
            }
        ]
    })),

    setTyping: (isTyping) => set({ isTyping }),
    clearMessages: () => set({ messages: [] })
}));