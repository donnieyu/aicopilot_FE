import { useState } from 'react';
import { ArrowRight, ArrowDown, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import type { JobStatus } from '../../../types/workflow';

interface AiStatusWidgetProps {
    status: JobStatus | null | undefined;
    message: string;
}

export function AiStatusWidget({ status, message }: AiStatusWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Logic: If map is done but others are not, show this widget.
    const isProcessDone = !!status?.stageDurations?.PROCESS;
    const isDataDone = !!status?.stageDurations?.DATA;
    const isFormDone = !!status?.stageDurations?.FORM;
    const isAllDone = status?.state === 'COMPLETED';

    const showWidget = isProcessDone && !isAllDone;

    if (!showWidget) return null;

    return (
        <div className="absolute bottom-6 right-6 z-40 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <div className="bg-white rounded-xl shadow-2xl border border-blue-100 overflow-hidden w-80">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-3 flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center gap-2 text-white">
                        <Sparkles size={16} className="animate-pulse" />
                        <span className="text-xs font-bold">AI Co-Architect Working</span>
                    </div>
                    {isExpanded ? <ArrowDown size={14} className="text-white/80" /> : <ArrowRight size={14} className="text-white/80" />}
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className="p-4 bg-slate-50 space-y-4">
                        <div className="space-y-3">
                            {/* Step 1: Map (Done) */}
                            <div className="flex items-center gap-3 opacity-50">
                                <div className="p-1.5 bg-green-100 text-green-600 rounded-full">
                                    <CheckCircle2 size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-700">Process Map</p>
                                    <p className="text-[10px] text-slate-500">Structure generated</p>
                                </div>
                            </div>

                            {/* Step 2: Data (Active/Done) */}
                            <div className={clsx("flex items-center gap-3", isDataDone ? "opacity-50" : "opacity-100")}>
                                <div className={clsx("p-1.5 rounded-full transition-colors", isDataDone ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
                                    {isDataDone ? <CheckCircle2 size={14} /> : <Loader2 size={14} className="animate-spin" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-700">Data Modeling</p>
                                    <p className="text-[10px] text-slate-500">{isDataDone ? "Entities extracted" : "Extracting variables..."}</p>
                                </div>
                            </div>

                            {/* Step 3: Form (Active/Pending/Done) */}
                            <div className={clsx("flex items-center gap-3", !isDataDone ? "opacity-30" : "opacity-100")}>
                                <div className={clsx("p-1.5 rounded-full transition-colors",
                                    isFormDone ? "bg-green-100 text-green-600" :
                                        (isDataDone && !isFormDone) ? "bg-blue-100 text-blue-600" : "bg-slate-200 text-slate-400"
                                )}>
                                    {isFormDone ? <CheckCircle2 size={14} /> : (isDataDone && !isFormDone) ? <Loader2 size={14} className="animate-spin" /> : <div className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-slate-700">Form UX</p>
                                    <p className="text-[10px] text-slate-500">{isFormDone ? "Design complete" : (isDataDone ? "Designing UI..." : "Pending...")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Live Log */}
                        <div className="pt-3 border-t border-slate-200">
                            <p className="text-[10px] font-mono text-blue-600 animate-pulse truncate">
                                &gt; {message || "Processing..."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}