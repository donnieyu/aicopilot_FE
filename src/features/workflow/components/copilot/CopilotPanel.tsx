import { MessageSquare, Library } from 'lucide-react';
import clsx from 'clsx';
import { useUiStore } from '../../../../store/useUiStore';
import { ChatInterface } from './ChatInterface';
import { AssetManager } from './AssetManager';

export function CopilotPanel() {
    const activeTab = useUiStore((state) => state.activeCopilotTab);
    const setActiveTab = useUiStore((state) => state.setActiveCopilotTab);

    return (
        <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-xl relative z-40">
            {/* Header Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('CHAT')}
                    className={clsx(
                        "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                        activeTab === 'CHAT'
                            ? "border-blue-500 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <MessageSquare size={16} />
                    AI Chat
                </button>
                <button
                    onClick={() => setActiveTab('KNOWLEDGE')}
                    className={clsx(
                        "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors",
                        activeTab === 'KNOWLEDGE'
                            ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                            : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <Library size={16} />
                    Knowledge Base
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <div className={clsx("absolute inset-0 transition-opacity duration-300", activeTab === 'CHAT' ? "opacity-100 z-10" : "opacity-0 pointer-events-none")}>
                    <ChatInterface />
                </div>
                <div className={clsx("absolute inset-0 transition-opacity duration-300", activeTab === 'KNOWLEDGE' ? "opacity-100 z-10" : "opacity-0 pointer-events-none")}>
                    <AssetManager />
                </div>
            </div>
        </div>
    );
}