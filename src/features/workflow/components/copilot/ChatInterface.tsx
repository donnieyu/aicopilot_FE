import { useEffect, useRef } from 'react';
import { Send, User, Bot, Library, CheckCircle2, Loader2, Circle } from 'lucide-react';
import clsx from 'clsx';
import { useChatStore } from '../../../../store/useChatStore';
import { useWorkflowGenerator } from '../../../../hooks/useWorkflowGenerator';
import { getJobStatus } from '../../../../api/workflow';
import { useQuery } from '@tanstack/react-query';

/**
 * 특정 Job의 실시간 상태와 체크리스트를 표시하는 컴포넌트
 * [Refinement] 캔버스 오버레이에 있던 메시지를 이곳으로 이동시켰습니다.
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
        <div className="mt-2 pt-2 border-t border-blue-50/50 space-y-1.5 animate-in fade-in slide-in-from-top-1">
            {/* [New] 캔버스 오버레이에서 이동된 상태 메시지 */}
            {!isAllDone && (
                <p className="text-[10px] text-blue-600 font-bold animate-pulse leading-tight italic px-1 mb-1 bg-blue-50/50 rounded-sm">
                    {status.message || "Generating process logic..."}
                </p>
            )}

            {stages.map((stage, idx) => {
                const isCurrent = !stage.done && (idx === 0 || stages[idx - 1].done);
                return (
                    <div key={stage.key} className={clsx(
                        "flex items-center gap-1.5 text-[9px] transition-all px-1",
                        stage.done ? "text-blue-600 font-bold" : (isCurrent ? "text-slate-600 font-medium" : "text-slate-300")
                    )}>
                        {stage.done ? (
                            <CheckCircle2 size={10} className="text-green-500 animate-in zoom-in" />
                        ) : isCurrent ? (
                            <Loader2 size={10} className="animate-spin text-blue-500" />
                        ) : (
                            <Circle size={10} />
                        )}
                        <span className="truncate">{stage.label}</span>
                    </div>
                );
            })}

            {isAllDone && (
                <div className="text-[8px] text-green-600 font-bold bg-green-50/50 px-1.5 py-0.5 rounded mt-1 text-center border border-green-100/50 animate-in zoom-in uppercase tracking-tighter">
                    Design ready!
                </div>
            )}
        </div>
    );
}

interface InputAreaProps {
    input: string;
    setInput: (val: string) => void;
    handleSend: () => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    isTyping: boolean;
    selectedAssetIds: string[];
    isCentered?: boolean;
}

/**
 * 입력 영역 컴포넌트 (포커스 유지를 위해 외부화)
 */
function InputArea({
                       input,
                       setInput,
                       handleSend,
                       handleKeyDown,
                       isTyping,
                       selectedAssetIds,
                       isCentered = false
                   }: InputAreaProps) {
    return (
        <div className={clsx(
            "transition-all duration-500 ease-in-out w-full flex flex-col items-center",
            isCentered ? "max-w-xl" : " "
        )}>
            <div className={clsx(
                "relative flex flex-col items-stretch bg-white border border-slate-200 rounded-lg overflow-hidden transition-all w-full",
                isCentered ? "shadow-lg border-slate-300" : "shadow-sm",
                "focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400"
            )}>
                <div className="flex-1 flex flex-col min-w-0">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe requirement..."
                        className={clsx(
                            "w-full bg-transparent border-none focus:ring-0 text-[12px] focus:outline-none text-slate-800 placeholder:text-slate-400 resize-none py-3 px-3 custom-scrollbar transition-all font-medium leading-relaxed",
                            isCentered ? "min-h-[90px]" : "min-h-[50px]"
                        )}
                        rows={1}
                        autoFocus={!isCentered}
                    />
                </div>
                <div className="flex flex-row items-center justify-between p-1 bg-slate-50/30 w-full flex-shrink-0">
                    <div className="flex justify-center">
                        {selectedAssetIds.length > 0 && (
                            <span className="text-[8px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center justify-center gap-1 w-full border border-indigo-100 uppercase tracking-tighter" title={`${selectedAssetIds.length} contexts active`}>
                                <Library size={8} />
                                {selectedAssetIds.length} contexts
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className={clsx(
                            "p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-300 transition-all shadow-sm flex items-center justify-center mt-1",
                            input.trim() ? "scale-100 opacity-100" : "scale-95 opacity-70"
                        )}
                    >
                        {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>
            </div>
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
            const response = await startChatJob({
                prompt: userPrompt,
                assetIds: selectedAssetIds
            });

            if (response.reply) {
                addMessage('ai', response.reply);
            }

            if (response.jobId) {
                addMessage('ai', 'Architecting process...', response.jobId);
            }

        } catch (error) {
            console.error('Chat Interaction Error:', error);
            addMessage('ai', 'Error occurred.');
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

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden relative font-sans text-[12px]">
            {isInitial ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
                    {/*<div className="mb-4 text-center space-y-1">*/}
                    {/*    <div className="inline-flex p-2 bg-blue-50 rounded-lg mb-1 border border-blue-100/30">*/}
                    {/*        <Sparkles size={20} className="text-blue-500" />*/}
                    {/*    </div>*/}
                    {/*    <h2 className="text-[14px] font-black text-slate-900 tracking-tight uppercase">AI Architect</h2>*/}
                    {/*    <p className="text-[10px] text-slate-400 max-w-[180px] mx-auto leading-tight font-medium">*/}
                    {/*        Architect workflows via <br/> natural language.*/}
                    {/*    </p>*/}
                    {/*</div>*/}

                    <InputArea
                        input={input}
                        setInput={setInput}
                        handleSend={handleSend}
                        handleKeyDown={handleKeyDown}
                        isTyping={isTyping}
                        selectedAssetIds={selectedAssetIds}
                        isCentered={true}
                    />

                    <div className="mt-4 w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-1.5 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                        {TEMPLATES.map((tpl, idx) => (
                            <button
                                key={idx}
                                onClick={() => setInput(tpl.prompt)}
                                className="text-left p-2 bg-slate-50 border border-slate-100 rounded-md hover:border-blue-200 hover:bg-white transition-all group flex flex-col shadow-xs"
                            >
                                <span className="font-bold text-[10px] text-slate-700 group-hover:text-blue-700 mb-0.5">{tpl.label}</span>
                                <span className="text-[9px] text-slate-400 line-clamp-1 group-hover:text-slate-500 leading-tight">{tpl.prompt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2.5 custom-scrollbar pb-28 bg-slate-50/10" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={clsx("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={clsx(
                                    "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border shadow-xs",
                                    msg.role === 'user' ? "bg-white border-slate-200" : "bg-blue-50 border-blue-100 text-blue-600"
                                )}>
                                    {msg.role === 'user' ? <User size={10} className="text-slate-500" /> : <Bot size={10} />}
                                </div>
                                <div className={clsx(
                                    "max-w-[92%] p-2 rounded-lg text-[11.5px] leading-snug shadow-xs font-medium",
                                    msg.role === 'user'
                                        ? "bg-slate-800 text-white rounded-tr-none"
                                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                                )}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    {/* Job 상태 인디케이터 (메시지가 생성한 Job인 경우 표시) */}
                                    {msg.jobId && <ChatJobStatusIndicator jobId={msg.jobId} />}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-2 animate-in fade-in duration-300">
                                <div className="w-5 h-5 rounded bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                                    <Bot size={10} />
                                </div>
                                <div className="bg-white p-1 rounded-lg rounded-tl-none border border-slate-100 flex flex-col gap-0.5 items-start">
                                    <span className="text-[7px] text-blue-500 font-black uppercase tracking-tighter">Thinking</span>
                                    <div className="flex items-center gap-0.5 px-0.5">
                                        <span className="w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce" />
                                        <span className="w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-0.5 h-0.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-white via-white/95 to-transparent pt-6 z-20">
                        <InputArea
                            input={input}
                            setInput={setInput}
                            handleSend={handleSend}
                            handleKeyDown={handleKeyDown}
                            isTyping={isTyping}
                            selectedAssetIds={selectedAssetIds}
                            isCentered={false}
                        />
                    </div>
                </>
            )}
        </div>
    );
}