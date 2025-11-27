import { User, GitFork, Settings, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
// [Fix] Removed unused 'clsx' import
import type { ProcessStep } from '../../../../types/workflow';

interface StepEditorProps {
    index: number;
    tempStep: Partial<ProcessStep>;
    // [Fix] Replaced 'any' with specific type lookup from ProcessStep
    onEditChange: (field: keyof ProcessStep, value: ProcessStep[keyof ProcessStep]) => void;
    onSave: () => void;
    onCancel: () => void;
    onAutoFill: () => void;
    isSuggesting: boolean;
}

const getIcon = (type: string) => {
    if (type === 'ACTION') return <User size={18} />;
    if (type === 'DECISION') return <GitFork size={18} />;
    return <Settings size={18} />;
};

export function StepEditor({ index, tempStep, onEditChange, onSave, onCancel, onAutoFill, isSuggesting }: StepEditorProps) {
    return (
        <div className="w-full bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-6 animate-in zoom-in-95 duration-200 z-20 my-4 ring-4 ring-blue-50/50 relative overflow-hidden">

            {/* Loading Overlay for this card */}
            {isSuggesting && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                    <span className="text-xs font-bold text-blue-600">AI is filling details...</span>
                </div>
            )}

            <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-lg">
                        Editing Step {index + 1}
                    </span>

                    {/* AI Auto-Fill Button */}
                    <button
                        onClick={onAutoFill}
                        disabled={isSuggesting}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold hover:shadow-md hover:scale-105 transition-all disabled:opacity-50"
                        title="Auto-fill this step with AI"
                    >
                        <Sparkles size={12} fill="currentColor" />
                        <span>Auto-Fill</span>
                    </button>
                </div>

                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                    {getIcon(tempStep.type || 'ACTION')}
                </div>
            </div>

            <div className="space-y-5">
                {/* Step Name */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Step Name</label>
                    <input
                        type="text"
                        value={tempStep.name || ''}
                        onChange={(e) => onEditChange('name', e.target.value)}
                        placeholder="e.g. Manager Approval"
                        className="w-full text-lg font-bold border-b border-slate-200 py-2 focus:border-blue-500 focus:outline-none transition-colors text-slate-800"
                        autoFocus
                    />
                </div>

                {/* Role & Type */}
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Role</label>
                        <input
                            type="text"
                            value={tempStep.role || ''}
                            onChange={(e) => onEditChange('role', e.target.value)}
                            placeholder="e.g. Manager"
                            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Type</label>
                        <div className="relative">
                            <select
                                value={tempStep.type || 'ACTION'}
                                onChange={(e) => onEditChange('type', e.target.value as 'ACTION' | 'DECISION')}
                                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white appearance-none transition-all"
                            >
                                <option value="ACTION">Action Task</option>
                                <option value="DECISION">Decision (Gateway)</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Description</label>
                    <textarea
                        value={tempStep.description || ''}
                        onChange={(e) => onEditChange('description', e.target.value)}
                        placeholder="What happens in this step?"
                        className="w-full text-sm border border-slate-200 rounded-xl p-4 h-24 resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                    onClick={onCancel}
                    className="text-xs font-bold text-slate-500 px-5 py-2.5 hover:bg-slate-100 rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={onSave}
                    className="text-xs font-bold bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}