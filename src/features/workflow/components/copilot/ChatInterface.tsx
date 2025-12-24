import { useEffect, useRef } from 'react';
import { Send, User, Bot, Library, CheckCircle2, Loader2, Circle, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../../../../store/useChatStore';
import { useWorkflowStore } from '../../../../store/useWorkflowStore'; // [New]
import { useWorkflowGenerator } from '../../../../hooks/useWorkflowGenerator';
import { getJobStatus } from '../../../../api/workflow';
import { useQuery } from '@tanstack/react-query';

/**
 * 특정 Job의 진행 상태를 표시하는 컴포넌트
 */
function ChatJobStatusIndicator({ jobId }: { jobId: string }) {
    const { data: status } = useQuery({
        queryKey: ['chatJobStatus', jobId],
        queryFn: () => getJobStatus(jobId),
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            return (state === 'COMPLETED' || state === 'FAILED') ? false : 1000;
        },
    });

    if (!status) return null;

    const stages = [
        { key: 'PROCESS', label: 'Process Design', done: !!status.stageDurations?.PROCESS },
        { key: 'DATA', label: 'Data Modeling', done: !!status.stageDurations?.DATA },
        { key: 'FORM', label: 'Form Design', done: !!status.stageDurations?.FORM },
    ];

    const isAllDone = status.state === 'COMPLETED';

    return (
        <div className="mt-1.5 pt-1.5 border-t border-blue-50/50 space-y-0.5 animate-in fade-in slide-in-from-top-1">
            {stages.map((stage, idx) => {
                const isCurrent = !stage.done && (idx === 0 || stages[idx - 1].done);
                return (
                    <div key={stage.key} className={clsx(
                        "flex items-center gap-1.5 text-[8px] transition-all",
                        stage.done ? "text-blue-600 font-bold" : (isCurrent ? "text-slate-600 font-medium animate-pulse" : "text-slate-300")
                    )}>
                        {stage.done ? (
                            <CheckCircle2 size={8} className="text-green-500 animate-in zoom-in" />
                        ) : isCurrent ? (
                            <Loader2 size={8} className="animate-spin text-blue-500" />
                        ) : (
                            <Circle size={8} />
                        )}
                        <span>{stage.label}</span>
                    </div>
                );
            })}
            {isAllDone && (
                <div className="text-[7.5px] text-green-600 font-bold bg-green-50/50 px-1.5 py-0.5 rounded mt-1 text-center border border-green-100/50 animate-in zoom-in uppercase tracking-tighter">
                    Ready
                </div>
            )}
        </div>
    );
}

const TEMPLATES = [
    { label: 'Vacation Request', prompt: 'Create a vacation request and approval process. An employee submits, the manager approves, and HR is notified.' },
    { label: 'Expense Reimbursement', prompt: 'Design a process for travel expense reimbursement. Include receipt attachment and approval by the head for amounts over $1,000.' }
];

export function ChatInterface() {
    const {
        messages,
        input,
        setInput,
        addMessage,
        isTyping,
        setTyping,
        selectedAssetIds
    } = useChatStore();

    const { startChatJob } = useWorkflowGenerator();
    const scrollRef = useRef<HTMLDivElement>(null);

    // [New] 현재 캔버스 상태를 가져오기 위한 스토어 구독
    const currentProcess = useWorkflowStore((state) => state.currentProcess);

    const isInitial = messages.length === 0;

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
            // [Update] 현재 캔버스에 프로세스가 있다면 JSON으로 변환하여 전송 (MODIFY 의도 감지용)
            const currentProcessJson = currentProcess ? JSON.stringify(currentProcess) : undefined;

            const response = await startChatJob({
                prompt: userPrompt,
                assetIds: selectedAssetIds,
                currentProcessJson: currentProcessJson // [New]
            });

            if (response.reply) {
                addMessage('ai', response.reply);
            }

            if (response.jobId) {
                addMessage('ai', 'Architecting process...', response.jobId);
            }

        } catch (error) {
            console.error('Chat Interaction Error:', error);
            addMessage('ai', 'An error occurred.');
        } finally {
            setTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const InputArea = ({ isCentered = false }: { isCentered?: boolean }) => (
        <div className={clsx(
            "transition-all duration-500 ease-in-out w-full flex flex-col items-center",
            isCentered ? "max-w-xl px-4" : "px-3"
        )}>
            {selectedAssetIds.length > 0 && (
                <div className="w-full flex items-center gap-2 mb-1 px-1">
                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1 border border-indigo-100 animate-in slide-in-from-left-1 uppercase tracking-tighter">
                        <Library size={8} />
                        {selectedAssetIds.length} Contexts Active
                    </span>
                </div>
            )}

            <div className={clsx(
                "relative flex flex-col bg-white border justify-end border-slate-200 rounded-xl overflow-hidden transition-all w-full",
                isCentered ? "shadow-lg border-slate-300" : "shadow-sm",
                "focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 group"
            )}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe requirement..."
                    className={clsx(
                        "w-full bg-transparent border-none focus:ring-0 text-[13px] focus:outline-none  placeholder:text-slate-400 resize-none pt-3 px-4 pb-10 custom-scrollbar transition-all font-medium leading-relaxed",
                        isCentered ? "min-h-[110px]" : "min-h-[80px]"
                    )}
                    rows={1}
                />

                <div className="w-full p-1 justify-end items-center d-flex">
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className={clsx(
                            "p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm flex items-center justify-center",
                            input.trim() ? "scale-100 opacity-100" : "scale-95 opacity-50"
                        )}
                    >
                        {isTyping ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden relative">
            {isInitial ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
                    <div className="mb-6 text-center space-y-1.5">
                        <div className="inline-flex p-3 bg-blue-50 rounded-xl mb-1">
                            <Sparkles size={28} className="text-blue-500" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">AI Architect</h2>
                        <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto leading-tight font-medium">
                            Design business workflows from <br/> natural language in seconds.
                        </p>
                    </div>

                    <InputArea isCentered={true} />

                    <div className="mt-6 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                        {TEMPLATES.map((tpl, idx) => (
                            <button
                                key={idx}
                                onClick={() => setInput(tpl.prompt)}
                                className="text-left p-3 bg-slate-50 border border-slate-100 rounded-lg hover:border-blue-200 hover:bg-white hover:shadow-sm transition-all group flex flex-col"
                            >
                                <span className="font-bold text-[11px] text-slate-700 group-hover:text-blue-700 mb-0.5">{tpl.label}</span>
                                <span className="text-[10px] text-slate-400 line-clamp-1 group-hover:text-slate-500 leading-tight">{tpl.prompt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar pb-32 bg-slate-50/30" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={clsx("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={clsx(
                                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs border",
                                    msg.role === 'user' ? "bg-white border-slate-200" : "bg-blue-50 border-blue-100 text-blue-600"
                                )}>
                                    {msg.role === 'user' ? <User size={14} className="text-slate-500" /> : <Bot size={14} />}
                                </div>
                                <div className={clsx(
                                    "max-w-[90%] p-2.5 rounded-xl text-[12px] leading-relaxed shadow-xs font-medium",
                                    msg.role === 'user'
                                        ? "bg-slate-800 text-white rounded-tr-none"
                                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                )}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    {msg.jobId && <ChatJobStatusIndicator jobId={msg.jobId} />}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-2 animate-in fade-in duration-300">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                                    <Bot size={14} />
                                </div>
                                <div className="bg-white p-2 rounded-xl rounded-tl-none border border-slate-100 flex flex-col gap-1 items-start shadow-xs">
                                    <span className="text-[8px] text-blue-500 font-black uppercase tracking-tighter">Thinking</span>
                                    <div className="flex items-center gap-1 px-1">
                                        <span className="w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce"></span>
                                        <span className="w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 z-20">
                        <InputArea />
                    </div>
                </>
            )}
        </div>
    );
}