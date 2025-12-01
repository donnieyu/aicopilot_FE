import { Sparkles } from 'lucide-react';
import { AiActionButton } from '../../../../components/AiActionButton';

interface ContextInputProps {
    description: string;
    onChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    isDisabled: boolean;
    readOnly?: boolean; // [New] Prop
}

export function ContextInput({ description, onChange, onGenerate, isGenerating, isDisabled, readOnly }: ContextInputProps) {
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
                disabled={readOnly} // [Fix] Disable in read-only mode
                className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3 h-40 resize-none focus:ring-2 focus:ring-blue-100 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />

            {/* [Fix] Hide AI Button and Warning in Read-Only Mode */}
            {!readOnly && (
                <>
                    <AiActionButton
                        onClick={onGenerate}
                        disabled={isDisabled}
                        isLoading={isGenerating}
                        loadingText="Architecting..."
                        fullWidth={true}
                        className="mt-2"
                    >
                        Auto-Draft with AI
                    </AiActionButton>

                    <p className="text-[10px] text-slate-400 text-center leading-relaxed px-2">
                        AI will generate a structured step list based on this description.
                        <br/><span className="text-orange-400">Warning: Existing steps will be overwritten.</span>
                    </p>
                </>
            )}
        </div>
    );
}