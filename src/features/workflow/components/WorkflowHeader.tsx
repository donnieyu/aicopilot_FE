import { Wand2, ArrowRight, ArrowDown, LayoutList, Code, GitFork, Database, LayoutTemplate } from 'lucide-react';
import clsx from 'clsx';
import { useWorkflowStore } from '../../../store/useWorkflowStore';
import type { JobStatus } from '../../../types/workflow';
import type { MainView } from '../../../App'; // App.tsx에서 타입 임포트

interface WorkflowHeaderProps {
    jobStatus: JobStatus | null | undefined;
    initialTopic: string;
    isCompleted: boolean;
    isInspectorOpen: boolean;
    setInspectorOpen: (open: boolean) => void;
    onOpenSideOutliner: () => void;

    // [New] Navigation Props
    activeView: MainView;
    onViewChange: (view: MainView) => void;
}

export function WorkflowHeader({
                                   jobStatus,
                                   initialTopic,
                                   isCompleted,
                                   isInspectorOpen,
                                   setInspectorOpen,
                                   onOpenSideOutliner,
                                   activeView,
                                   onViewChange
                               }: WorkflowHeaderProps) {
    const layoutDirection = useWorkflowStore((state) => state.layoutDirection);
    const setLayoutDirection = useWorkflowStore((state) => state.setLayoutDirection);

    return (
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
            {/* Left: Branding & Topic */}
            <div className="flex items-center gap-4 w-[280px]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 shadow-lg">
                        <Wand2 size={18} />
                    </div>
                    <div>
                        <button
                            onClick={onOpenSideOutliner}
                            className="flex items-center gap-2 hover:bg-slate-50 p-1 -ml-1 rounded-lg transition-colors group text-left"
                        >
                            <h1 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-blue-600 transition-colors truncate max-w-[180px]">
                                {jobStatus?.processResponse?.processName || initialTopic || 'Designing...'}
                            </h1>
                            <LayoutList size={14} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                        </button>
                        <p className="text-[10px] text-slate-400 font-medium">AI Architect Ver 8.2</p>
                    </div>
                </div>
            </div>

            {/* Center: Main Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200">
                <NavTab
                    active={activeView === 'CANVAS'}
                    onClick={() => onViewChange('CANVAS')}
                    icon={GitFork}
                    label="Process Map"
                />
                <NavTab
                    active={activeView === 'DATA'}
                    onClick={() => onViewChange('DATA')}
                    icon={Database}
                    label="Data Dictionary"
                />
                <NavTab
                    active={activeView === 'FORM'}
                    onClick={() => onViewChange('FORM')}
                    icon={LayoutTemplate}
                    label="Form List"
                />
            </div>

            {/* Right: Tools & Actions */}
            <div className="flex items-center gap-3 w-[280px] justify-end">
                {/* Progress Indicator (only visible when not done) */}
                {!isCompleted && (
                    <div className="flex items-center gap-2 mr-2">
                        <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.PROCESS ? "bg-green-500" : "bg-blue-500 animate-pulse")} />
                        <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.DATA ? "bg-green-500" : (!jobStatus?.stageDurations?.PROCESS ? "bg-slate-200" : "bg-blue-500 animate-pulse"))} />
                        <div className={clsx("w-2 h-2 rounded-full", jobStatus?.stageDurations?.FORM ? "bg-green-500" : (!jobStatus?.stageDurations?.DATA ? "bg-slate-200" : "bg-blue-500 animate-pulse"))} />
                    </div>
                )}

                {/* Canvas Controls (Visible only in Canvas Mode) */}
                {activeView === 'CANVAS' && (
                    <>
                        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1">
                            <button onClick={() => setLayoutDirection('LR')} className={clsx("p-1.5 rounded-md transition-all", layoutDirection === 'LR' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                                <ArrowRight size={14} />
                            </button>
                            <button onClick={() => setLayoutDirection('TB')} className={clsx("p-1.5 rounded-md transition-all", layoutDirection === 'TB' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                                <ArrowDown size={14} />
                            </button>
                        </div>
                        <div className="h-5 w-px bg-slate-300 mx-1" />
                    </>
                )}

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

function NavTab({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200",
                active
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
        >
            <Icon size={14} className={clsx(active ? "text-blue-500" : "text-slate-400")} />
            {label}
        </button>
    );
}