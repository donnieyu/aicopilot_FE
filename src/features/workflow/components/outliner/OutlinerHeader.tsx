import { ArrowLeft } from 'lucide-react';

interface OutlinerHeaderProps {
    topic: string;
    onTopicChange: (value: string) => void;
    onBack: () => void;
}

export function OutlinerHeader({ topic, onTopicChange, onBack }: OutlinerHeaderProps) {
    return (
        <div className="p-6 pb-2">
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-all group w-fit mb-6 shadow-sm"
            >
                <ArrowLeft size={14} />
                <span>Back to Topics</span>
            </button>

            <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block px-1">Process Topic</label>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => onTopicChange(e.target.value)}
                        className="w-full text-xl font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300 transition-colors"
                        placeholder="Enter Topic"
                    />
                </div>
            </div>
        </div>
    );
}