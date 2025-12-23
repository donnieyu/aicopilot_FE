import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, User, Bot, Paperclip, Library, CheckCircle2, Loader2, Circle } from 'lucide-react';
import clsx from 'clsx';
// [Fix] Corrected relative paths to access 'src' directory from deep component location
import { useChatStore } from '../../../../store/useChatStore';
import { useUiStore } from '../../../../store/useUiStore';
import { useWorkflowGenerator } from '../../../../hooks/useWorkflowGenerator';
import { getJobStatus } from '../../../../api/workflow';
import { useQuery } from '@tanstack/react-query';

/**
 * Sub-component to display the progress of a specific Job inside the chat bubble.
 * Polling logic is contained here to update the status of individual messages.
 */
function ChatJobStatusIndicator({ jobId }: { jobId: string }) {
    // Poll the backend for the specific Job status every 1 second
    const { data: status } = useQuery({
        queryKey: ['chatJobStatus', jobId],
        queryFn: () => getJobStatus(jobId),
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            // Stop polling if the job reaches a terminal state
            return (state === 'COMPLETED' || state === 'FAILED') ? false : 1000;
        },
    });

    if (!status) return null;

    // Define the sequence of stages to show in the UI
    const stages = [
        { key: 'PROCESS', label: 'Process Structure Design', done: !!status.stageDurations?.PROCESS },
        { key: 'DATA', label: 'Data Modeling', done: !!status.stageDurations?.DATA },
        { key: 'FORM', label: 'Input Form Design', done: !!status.stageDurations?.FORM },
    ];

    const isAllDone = status.state === 'COMPLETED';

    return (
        <div className="mt-3 pt-3 border-t border-blue-100 space-y-2 animate-in fade-in slide-in-from-top-1">
            {stages.map((stage, idx) => {
                const isCurrent = !stage.done && (idx === 0 || stages[idx - 1].done);
                return (
                    <div key={stage.key} className={clsx(
                        "flex items-center gap-2 text-[11px] transition-all",
                        stage.done ? "text-blue-600 font-bold" : (isCurrent ? "text-slate-600 font-medium animate-pulse" : "text-slate-300")
                    )}>
                        {stage.done ? (
                            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                        ) : isCurrent ? (
                            <Loader2 size={12} className="animate-spin text-blue-500" />
                        ) : (
                            <Circle size={12} />
                        )}
                        <span>{stage.label}</span>
                    </div>
                );
            })}
            {isAllDone && (
                <div className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1.5 rounded mt-2 text-center border border-green-100 animate-in zoom-in">
                    ✨ Design completed! Check the workspace.
                </div>
            )}
        </div>
    );
}

const TEMPLATES = [
    { label: 'Vacation Request', prompt: 'Create a vacation request and approval process. An employee submits, the manager approves, and HR is notified.' },
    { label: 'Expense Reimbursement', prompt: 'Design a process for travel expense reimbursement. Include receipt attachment and approval by the head for amounts over $1,000.' },
    { label: 'IT Equipment Request', prompt: 'Process for issuing equipment to new hires. Include steps from laptop application to asset registration.' }
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

    const setActiveTab = useUiStore((state) => state.setActiveCopilotTab);
    const { startChatJob } = useWorkflowGenerator();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the bottom whenever messages change
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
            // Initiate the AI generation via the backend API
            const response = await startChatJob({
                prompt: userPrompt,
                assetIds: selectedAssetIds
            });

            // 1. Display text response if provided by AI
            if (response.reply) {
                addMessage('ai', response.reply);
            }

            // 2. If a background job was started, link it to a message with progress indicator
            if (response.jobId) {
                const initialStatusMsg = selectedAssetIds.length > 0
                    ? `Generating workflow using provided knowledge base.`
                    : `Starting the process design based on your requirements.`;

                addMessage('ai', initialStatusMsg, response.jobId);
            }

        } catch (error) {
            console.error('Chat Interaction Error:', error);
            addMessage('ai', 'An error occurred while processing your request. Please try again later.');
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
            {/* Chat History Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {/* Empty State / Suggestions */}
                {messages.length <= 1 && (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-100">
                            <Sparkles size={24} className="text-blue-500" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium italic">How can I help with your process design?</p>
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

                {/* Render Messages */}
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
                            <div>{msg.content}</div>

                            {/* Detailed progress tracker for process generation jobs */}
                            {msg.jobId && <ChatJobStatusIndicator jobId={msg.jobId} />}
                        </div>
                    </div>
                ))}

                {/* AI Thinking Indicator */}
                {isTyping && (
                    <div className="flex gap-3 animate-in fade-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Bot size={18} />
                        </div>
                        <div className="bg-slate-100/50 p-3 rounded-2xl rounded-tl-none flex flex-col gap-1 items-start">
                            <span className="text-[10px] text-blue-500 font-bold mb-1 uppercase tracking-tighter">AI Thinking...</span>
                            <div className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></span>
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                {/* Active Context Indicators */}
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
                        title="Manage Knowledge Base"
                    >
                        <Paperclip size={18} />
                    </button>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question or describe a process..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400 resize-none py-2 max-h-32 custom-scrollbar"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />

                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}