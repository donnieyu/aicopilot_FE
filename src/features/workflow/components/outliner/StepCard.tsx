import { User, GitFork, Settings, Trash2, Plus } from 'lucide-react';
import clsx from 'clsx';
import type { ProcessStep } from '../../../../types/workflow';
import { StepEditor } from './StepEditor';

interface StepCardProps {
    step: ProcessStep;
    index: number;
    isEditing: boolean;
    tempStep: Partial<ProcessStep>;
    onEditStart: () => void;
    onEditChange: (field: keyof ProcessStep, value: any) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: () => void;
    onAddBefore: () => void;
    onAddAfter: () => void;
    isLast: boolean;
    // [New] Props for AI Auto-fill
    onAutoFill: () => void;
    isStepSuggesting: boolean;
}

const getIcon = (type: string) => {
    if (type === 'ACTION') return <User size={18} />;
    if (type === 'DECISION') return <GitFork size={18} />;
    return <Settings size={18} />;
};

export function StepCard({
                             step, index, isEditing, tempStep,
                             onEditStart, onEditChange, onSave, onCancel, onDelete,
                             onAddBefore, onAddAfter, isLast,
                             onAutoFill, isStepSuggesting
                         }: StepCardProps) {

    // --- EDIT MODE ---
    if (isEditing) {
        return (
            <StepEditor
                index={index}
                tempStep={tempStep}
                onEditChange={onEditChange}
                onSave={onSave}
                onCancel={onCancel}
                onAutoFill={onAutoFill}
                isSuggesting={isStepSuggesting}
            />
        );
    }

    // --- VIEW MODE ---
    return (
        <div className="w-full flex flex-col items-center relative group">
            {/* Insert Button (Top - Add Before) */}
            <button
                onClick={onAddBefore}
                className="absolute -top-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-500 hover:scale-110 transition-all shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100"
                title="Insert Step Before"
            >
                <Plus size={16} />
            </button>

            <div
                className={clsx(
                    "w-full bg-white rounded-2xl border p-6 my-3 relative transition-all hover:shadow-xl cursor-pointer group/card",
                    step.type === 'DECISION'
                        ? "border-l-[6px] border-l-orange-400 border-y-slate-200 border-r-slate-200 hover:border-l-orange-500"
                        : "border-l-[6px] border-l-blue-500 border-y-slate-200 border-r-slate-200 hover:border-l-blue-600"
                )}
                onClick={onEditStart}
            >
                <div className="flex items-start gap-5">
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5 transition-colors",
                        step.type === 'DECISION' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                    )}>
                        {getIcon(step.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <h4 className="text-lg font-bold text-slate-800 truncate">{step.name}</h4>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-bold text-slate-300 tracking-wider">STEP {index + 1}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                    className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/card:opacity-100 p-1.5 rounded-lg hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 uppercase tracking-wide">
                                {step.role}
                            </span>
                            {step.type === 'DECISION' && (
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-100 uppercase tracking-wide flex items-center gap-1">
                                    <GitFork size={10} /> Gateway
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                            {step.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Insert Button (Button - Add After) */}
            <button
                onClick={onAddAfter}
                className="absolute -bottom-4 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-500 hover:scale-110 transition-all shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100"
                title="Append Step"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}