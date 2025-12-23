import { useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, Paperclip, Library } from 'lucide-react';
import clsx from 'clsx';
// [Fix] 기존에 존재하는 useChatStore를 사용하고 상대 경로를 꼼꼼히 확인하여 수정
import { useChatStore } from '../../../../store/useChatStore';
import { useUiStore } from '../../../../store/useUiStore';
import { useWorkflowGenerator } from '../../../../hooks/useWorkflowGenerator';

/**
 * [Phase 4] 최종 리팩토링된 AI 협업 채팅 인터페이스
 * 지식 베이스 선택 유무에 따라 적절한 생성 API를 호출하도록 로직을 업데이트했습니다.
 */

const TEMPLATES = [
    { label: '휴가 신청', prompt: '휴가 신청 및 승인 프로세스를 만들어줘. 직원이 신청하면 팀장이 승인하고, 인사팀에 통보되는 흐름이야.' },
    { label: '비용 정산', prompt: '출장비 정산 프로세스 설계해줘. 영수증 첨부와 100만원 이상 시 본부장 전결 규정이 있어.' },
    { label: 'IT 장비 요청', prompt: '신규 입사자 장비 지급 프로세스. 노트북 신청부터 자산 등록까지의 과정을 포함해줘.' }
];

export function ChatInterface() {
    // [Fix] useCopilotStore 대신 확장된 useChatStore 사용
    const {
        messages,
        input,
        setInput,
        addMessage,
        isTyping,
        setTyping,
        selectedAssetIds
    } = useChatStore();

    const setActiveTab = useUiStore((state) => state.setActiveCopilotTab);

    // Workflow Generator 훅 (Phase 4에서 startChatJob 기능이 추가됨을 전제)
    const { startJob, startChatJob } = useWorkflowGenerator();

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userPrompt = input;
        addMessage('user', userPrompt);
        setInput('');
        setTyping(true);

        try {
            // [Phase 4] 로직 분기: 선택된 지식이 있으면 지식 기반 생성(startChatJob) 호출
            if (selectedAssetIds.length > 0 && startChatJob) {
                await startChatJob({ prompt: userPrompt, assetIds: selectedAssetIds });
                addMessage('ai', `${selectedAssetIds.length}개의 전문 지식을 참고하여 프로세스를 설계하고 있습니다. 잠시만 기다려주세요.`);
            } else {
                // 일반 텍스트 기반 생성
                await startJob(userPrompt);
                addMessage('ai', `요청하신 "${userPrompt}" 프로세스 설계를 시작합니다.`);
            }

        } catch (error) {
            addMessage('ai', '설계 요청 중 오류가 발생했습니다. 통신 상태를 확인해주세요.');
        } finally {
            setTyping(false);
        }
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
            {/* 메시지 히스토리 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {messages.length <= 1 && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                            <Sparkles size={24} className="text-blue-500" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">어떤 업무 프로세스를 설계해 드릴까요?</p>
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
                            "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                            msg.role === 'user'
                                ? "bg-blue-600 text-white rounded-tr-none"
                                : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
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
                        <div className="bg-slate-200/50 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* 입력 영역 */}
            <div className="p-4 bg-white border-t border-slate-100">
                {/* 지식 컨텍스트 활성화 배지 */}
                {selectedAssetIds.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in zoom-in">
                            <Library size={10} />
                            {selectedAssetIds.length} context files active
                        </span>
                    </div>
                )}

                <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
                    <button
                        onClick={() => setActiveTab('KNOWLEDGE')}
                        className={clsx(
                            "p-2 rounded-lg transition-colors flex-shrink-0",
                            selectedAssetIds.length > 0 ? "text-indigo-500 bg-indigo-50 hover:bg-indigo-100" : "text-slate-400 hover:bg-slate-200"
                        )}
                        title="지식 베이스 관리"
                    >
                        <Paperclip size={18} />
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="설계 지침 또는 수정 요청을 입력하세요..."
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
            </div>
        </div>
    );
}