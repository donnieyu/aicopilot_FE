import { Wand2, ArrowRight, ArrowDown, LayoutList, Code } from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { JobStatus } from '../../../types/workflow';

interface WorkflowHeaderProps {
    jobStatus: JobStatus | null | undefined;
    initialTopic: string;
    isCompleted: boolean;
    isInspectorOpen: boolean;
    setInspectorOpen: (open: boolean) => void;
    onOpenSideOutliner: () => void;
}

export function WorkflowHeader({
                                   jobStatus,
                                   initialTopic,
                                   isCompleted,
                                   isInspectorOpen,
                                   setInspectorOpen,
                                   onOpenSideOutliner
                               }: WorkflowHeaderProps) {
    const layoutDirection = useWorkflowStore((state) => state.layoutDirection);
    const setLayoutDirection = useWorkflowStore((state) => state.setLayoutDirection);

    return (
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
                    <Wand2 size={18} />
                </div>
                <div>
                    <button
                        onClick={onOpenSideOutliner}
                        className="flex items-center gap-2 hover:bg-slate-50 p-1 -ml-1 rounded-lg transition-colors group"
                    >
                        <h1 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors">
                            {jobStatus?.processResponse?.processName || initialTopic || 'Designing Process...'}
                        </h1>
                        <LayoutList size={14} className="text-slate-400 group-hover:text-blue-500" />
                    </button>
                    <p className="text-[10px] text-slate-400 font-medium">AI Architect Ver 8.2</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Progress Indicator */}
                {!isCompleted && (
                    <div className="flex items-center gap-3 mr-4 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.PROCESS ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
                            <span className="text-[10px] font-bold text-slate-500">Map</span>
                        </div>
                        <div className="w-px h-3 bg-slate-200" />
                        <div className="flex items-center gap-1.5">
                            <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.DATA ? "bg-green-500" : (!jobStatus?.stageDurations?.PROCESS ? "bg-slate-200" : "bg-blue-500 animate-pulse"))} />
                            <span className="text-[10px] font-bold text-slate-500">Data</span>
                        </div>
                    </div>
                )}

                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1">
                    <button onClick={() => setLayoutDirection('LR')} className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", layoutDirection === 'LR' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                        <ArrowRight size={14} /> LR
                    </button>
                    <button onClick={() => setLayoutDirection('TB')} className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all", layoutDirection === 'TB' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                        <ArrowDown size={14} /> TB
                    </button>
                </div>

                <div className="h-5 w-px bg-slate-300 mx-1" />

                <button onClick={() => setInspectorOpen(true)} className={clsx("flex items-center gap-2 text-xs font-bold px-3 py-1.5 border rounded-lg transition-colors", isInspectorOpen ? "bg-blue-50 text-blue-600 border-blue-200" : "text-slate-600 border-slate-200 hover:bg-slate-50")}>
                    <Code size={14} /> JSON
                </button>
                <button onClick={() => window.location.reload()} className="text-xs font-bold text-slate-500 hover:text-blue-600 px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                    New
                </button>
            </div>
        </header>
    );
}