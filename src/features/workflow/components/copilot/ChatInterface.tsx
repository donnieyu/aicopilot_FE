import { useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, Paperclip } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../../../../store/useChatStore';
import { useUiStore } from '../../../../store/useUiStore';
import { useAssetStore } from '../../../../store/useAssetStore';

// Mock Templates (나중에 상수로 분리 가능)
const TEMPLATES = [
    { label: '휴가 신청', prompt: '휴가 신청 및 승인 프로세스를 만들어줘. 직원이 신청하면 팀장이 승인하고, 인사팀에 통보되는 흐름이야.' },
    { label: '비용 정산', prompt: '출장비 정산 프로세스 설계해줘. 영수증 첨부와 100만원 이상 시 본부장 전결 규정이 있어.' },
    { label: 'IT 장비 요청', prompt: '신규 입사자 장비 지급 프로세스. 노트북 신청부터 자산 등록까지의 과정을 포함해줘.' }
];

export function ChatInterface() {
    const { messages, input, setInput, addMessage, isTyping, setTyping } = useChatStore();
    const setActiveTab = useUiStore((state) => state.setActiveCopilotTab);
    const selectedAssetIds = useAssetStore((state) => state.selectedAssetIds);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        // 1. User Message 추가
        addMessage('user', input);
        const userPrompt = input;
        setInput('');
        setTyping(true);

        // 2. AI Response Simulation (나중에 백엔드 API 연결)
        setTimeout(() => {
            const contextMsg = selectedAssetIds.length > 0
                ? `(참고한 지식: ${selectedAssetIds.length}건)\n`
                : '';

            addMessage('ai', `${contextMsg}요청하신 "${userPrompt}"에 대한 프로세스 초안을 생성했습니다. 캔버스를 확인해주세요.`);
            setTyping(false);
        }, 2000);
    };

    const handleTemplateClick = (prompt: string) => {
        setInput(prompt);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {messages.length === 1 && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                            <Sparkles size={24} className="text-blue-500" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">추천 템플릿으로 시작해보세요.</p>
                        <div className="grid grid-cols-1 gap-2 w-full px-4">
                            {TEMPLATES.map((tpl, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleTemplateClick(tpl.prompt)}
                                    className="text-left p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-xs text-slate-600 hover:text-blue-600 group"
                                >
                                    <span className="font-bold block mb-1 group-hover:text-blue-700">{tpl.label}</span>
                                    <span className="text-[10px] text-slate-400 line-clamp-1">{tpl.prompt}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={clsx("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            msg.role === 'user' ? "bg-slate-200" : "bg-blue-100 text-blue-600"
                        )}>
                            {msg.role === 'user' ? <User size={16} className="text-slate-500" /> : <Bot size={18} />}
                        </div>
                        <div className={clsx(
                            "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.role === 'user'
                                ? "bg-white text-slate-700 rounded-tr-none border border-slate-100"
                                : "bg-blue-50 text-slate-800 rounded-tl-none border border-blue-100"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Bot size={18} />
                        </div>
                        <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                {/* Context Indicator */}
                {selectedAssetIds.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Library size={10} />
                            {selectedAssetIds.length} context files active
                        </span>
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                    <button
                        onClick={() => setActiveTab('KNOWLEDGE')}
                        className={clsx(
                            "p-2 rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0",
                            selectedAssetIds.length > 0 ? "text-indigo-500 bg-indigo-50 hover:bg-indigo-100" : "text-slate-400"
                        )}
                        title="Manage Knowledge Base"
                    >
                        <Paperclip size={18} />
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe a process or give instructions..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400 resize-none py-2 max-h-32 custom-scrollbar"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-300 mt-2">
                    AI can make mistakes. Please review generated workflows.
                </p>
            </div>
        </div>
    );
}