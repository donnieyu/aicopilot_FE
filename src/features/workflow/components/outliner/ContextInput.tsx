import { Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface ContextInputProps {
    description: string;
    onChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    isDisabled: boolean;
}

export function ContextInput({ description, onChange, onGenerate, isGenerating, isDisabled }: ContextInputProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
                <Sparkles size={14} />
                AI Context & Description
            </label>
            <textarea
                value={description}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Describe your process goal or select a template above..."
                className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 h-40 resize-none focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />

            <button
                onClick={onGenerate}
                disabled={isDisabled}
                className={clsx(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm mt-2",
                    isDisabled
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-md hover:-translate-y-0.5"
                )}
            >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isGenerating ? "Architecting..." : "Auto-Draft with AI"}
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed px-2">
                AI will generate a structured step list based on this description.
                <br/><span className="text-orange-400">Warning: Existing steps will be overwritten.</span>
            </p>
        </div>
    );
}