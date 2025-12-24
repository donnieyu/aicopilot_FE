import { useEffect, useRef } from 'react';
import { Send, User, Bot, Library, CheckCircle2, Loader2, Circle, Sparkles, AlertCircle, AlertTriangle, Info, Wrench } from 'lucide-react';
import clsx from 'clsx';
// [Fix] 경로 해석 오류를 방지하기 위해 상대 경로를 사용하며, 스토어와 훅의 명칭을 정확히 참조합니다.
import { useChatStore } from '../../../../store/useChatStore';
import { useWorkflowStore } from '../../../../store/useWorkflowStore';
import { useWorkflowGenerator } from '../../../../hooks/useWorkflowGenerator';
import { getJobStatus } from '../../../../api/workflow';
import { useQuery } from '@tanstack/react-query';
import type { ProgressStep, AnalysisResult } from '../../../../types/workflow';

/**
 * [高] 특정 Job의 진행 상태 및 분석 결과를 표시하는 컴포넌트
 * 진행 단계 리스트 아래에 AI의 수정 제안을 테이블 형태로 표시합니다.
 */
function ChatJobStatusIndicator({ jobId }: { jobId: string }) {
    const setInput = useChatStore((state) => state.setInput);

    const { data: status } = useQuery({
        queryKey: ['chatJobStatus', jobId],
        queryFn: () => getJobStatus(jobId),
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            return (state === 'COMPLETED' || state === 'FAILED') ? false : 1000;
        },
    });

    // 데이터 로딩 전이거나 진행 단계가 없는 경우 가이드 표시
    if (!status || !status.progressSteps || status.progressSteps.length === 0) {
        return (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 animate-pulse px-1 italic">
                <Loader2 size={10} className="animate-spin" />
                Initializing architect engine...
            </div>
        );
    }

    const isAllDone = status.state === 'COMPLETED';
    const analysisResults = status.analysisResults || []; // [Fix] Optional field safety
    const hasAnalysis = analysisResults.length > 0;

    /**
     * 분석 제안 아이템 클릭 시 수정 프롬프트를 입력창에 주입합니다.
     */
    const handleRowClick = (result: AnalysisResult) => {
        if (!result.suggestion) return;

        // 사용자가 즉시 수정(MODIFY) 인텐트로 연결할 수 있도록 프롬프트 가공
        const prompt = result.targetNodeId
            ? `Fix this issue for node [${result.targetNodeId}]: ${result.suggestion}`
            : `Optimize the workflow: ${result.suggestion}`;

        setInput(prompt);
        // 포커스는 InputArea의 autoFocus 속성에 의해 자연스럽게 이동합니다.
    };

    return (
        <div className="mt-2 pt-2 border-t border-blue-50/50 space-y-3 animate-in fade-in slide-in-from-top-1">

            {/* 1. 진행 단계 리스트 (Progress Steps) */}
            <div className="space-y-1.5">
                {status.progressSteps.map((step: ProgressStep) => {
                    const isInProgress = step.status === 'IN_PROGRESS';
                    const isCompleted = step.status === 'COMPLETED';
                    const isStepFailed = step.status === 'FAILED';

                    return (
                        <div key={step.id} className={clsx(
                            "flex items-center gap-2 text-[9px] transition-all duration-300 px-1 py-0.5 rounded-sm",
                            isCompleted ? "text-blue-600 font-bold bg-blue-50/30" :
                                isInProgress ? "text-slate-700 font-medium animate-pulse" :
                                    isStepFailed ? "text-red-500" : "text-slate-300"
                        )}>
                            {isCompleted ? (
                                <CheckCircle2 size={10} className="text-green-500 animate-in zoom-in" />
                            ) : isInProgress ? (
                                <Loader2 size={10} className="animate-spin text-blue-500" />
                            ) : isStepFailed ? (
                                <AlertCircle size={10} className="text-red-500" />
                            ) : (
                                <Circle size={10} className="text-slate-200" />
                            )}
                            <span className="truncate">{step.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* 2. AI 분석 피드백 테이블 (Architect's Feedback) */}
            {isAllDone && hasAnalysis && (
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm animate-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Wrench size={10} className="text-indigo-500" />
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Architect's Feedback</span>
                        </div>
                        <span className="text-[8px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                            {analysisResults.length} Issues
                        </span>
                    </div>

                    {/* Table Structure */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-3 py-1.5 text-[8px] font-bold text-slate-400 uppercase w-10">Type</th>
                                <th className="px-3 py-1.5 text-[8px] font-bold text-slate-400 uppercase">Finding & Suggestion</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {analysisResults.map((result, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => handleRowClick(result)}
                                    className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-3 py-2.5 align-top">
                                        {result.severity === 'ERROR' ? (
                                            <AlertCircle size={12} className="text-red-500" />
                                        ) : result.severity === 'WARNING' ? (
                                            <AlertTriangle size={12} className="text-amber-500" />
                                        ) : (
                                            <Info size={12} className="text-blue-500" />
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <p className="text-[10px] font-bold text-slate-700 leading-tight mb-1 group-hover:text-indigo-700">
                                            {result.message}
                                        </p>
                                        {result.suggestion && (
                                            <p className="text-[9px] text-slate-400 italic line-clamp-1 group-hover:text-indigo-400">
                                                💡 {result.suggestion}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-indigo-50/50 px-3 py-1.5 text-[8px] text-indigo-500 font-bold text-center italic border-t border-indigo-100/50">
                        Click a row to auto-populate the correction request
                    </div>
                </div>
            )}

            {isAllDone && (
                <div className="text-[8px] text-green-600 font-black bg-green-50 px-2 py-1 rounded mt-2 text-center border border-green-100 shadow-sm animate-in zoom-in-95 uppercase tracking-wider">
                    ✨ Architecture Ready
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
 * 입력 영역 컴포넌트
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
            isCentered ? "max-w-xl px-4" : "px-3"
        )}>
            {selectedAssetIds.length > 0 && (
                <div className="w-full flex items-center gap-2 mb-1 px-1">
                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1 border border-indigo-100 uppercase tracking-tighter">
                        <Library size={8} />
                        {selectedAssetIds.length} Contexts Active
                    </span>
                </div>
            )}

            <div className={clsx(
                "relative flex flex-col bg-white border justify-end border-slate-200 rounded-xl overflow-hidden transition-all w-full",
                isCentered ? "shadow-lg border-slate-300" : "shadow-sm",
                "focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400"
            )}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe requirement..."
                    className={clsx(
                        "w-full bg-transparent border-none focus:ring-0 text-[13px] focus:outline-none placeholder:text-slate-400 resize-none pt-3 px-4 pb-10 custom-scrollbar transition-all font-medium leading-relaxed",
                        isCentered ? "min-h-[110px]" : "min-h-[80px]"
                    )}
                    rows={1}
                    autoFocus={!isCentered}
                />

                <div className="w-full p-1 justify-end items-center flex">
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
            const currentProcessJson = currentProcess ? JSON.stringify(currentProcess) : undefined;

            const response = await startChatJob({
                prompt: userPrompt,
                assetIds: selectedAssetIds,
                currentProcessJson: currentProcessJson
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

                    <InputArea
                        input={input}
                        setInput={setInput}
                        handleSend={handleSend}
                        handleKeyDown={handleKeyDown}
                        isTyping={isTyping}
                        selectedAssetIds={selectedAssetIds}
                        isCentered={true}
                    />

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